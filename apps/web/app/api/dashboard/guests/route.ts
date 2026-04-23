import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { rateLimit } from "@/lib/security/rate-limit";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { verifyWaiverHash } from "@/lib/security/waiver";
import { generateQRToken } from "@/lib/security/tokens";
import { auditLog } from "@/lib/security/audit";
import { guestRegistrationSchema, sanitiseText } from "@/lib/security/sanitise";
import {
  buildKnownGuestCookieValue,
  knownGuestCookieOptions,
} from "@/lib/board/knownGuestCookie";

/**
 * GET /api/dashboard/guests
 * Guest list endpoint — not yet implemented (reserved for operator CRM).
 */
/**
 * GET /api/dashboard/guests
 * Operator-wide guest CRM — search, filter by date and waiver status.
 *
 * Query params:
 *   q       — full_name ilike search
 *   date    — trip_date YYYY-MM-DD filter
 *   waiver  — 'signed' | 'unsigned'
 *   limit   — default 50, max 200
 *   offset  — pagination offset
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { operator } = await requireOperator()
  const { searchParams } = new URL(req.url)

  const search   = searchParams.get('q')?.trim() ?? ''
  const tripDate = searchParams.get('date') ?? ''
  const waiver   = searchParams.get('waiver') ?? ''
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 200)
  const offset   = Math.max(parseInt(searchParams.get('offset') ?? '0', 10), 0)

  const supabase = createServiceClient()

  let query = supabase
    .from('guests')
    .select(`
      id, full_name, dietary_requirements, language_preference,
      waiver_signed, waiver_signed_at, approval_status,
      checked_in_at, created_at,
      trips!inner (
        id, slug, trip_date, departure_time, status,
        boats ( boat_name )
      )
    `, { count: 'exact' })
    .eq('operator_id', operator.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.ilike('full_name', `%${search}%`)
  }
  if (tripDate) {
    query = query.eq('trips.trip_date', tripDate)
  }
  if (waiver === 'signed') {
    query = query.eq('waiver_signed', true)
  } else if (waiver === 'unsigned') {
    query = query.eq('waiver_signed', false)
  }

  const { data, count, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data, total: count ?? 0 })
}


/**
 * POST /api/dashboard/guests
 * Guest self-registration — called from the /trip/[slug] join flow.
 *
 * Security layers applied:
 *   1. Rate limit: 20 registrations / 10 min per IP
 *   2. Cloudflare Turnstile bot protection
 *   3. Zod schema validation on all inputs
 *   4. Trip state validation (not cancelled, not full)
 *   5. SHA-256 waiver text hash verification (timing-safe)
 *   6. Generates HMAC-signed QR boarding pass token
 *   7. Writes signed known-guest cookie for per-boat QR recognition
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Rate limit: 20 registrations per 10 minutes per IP
  const limited = await rateLimit(req, {
    max: 20,
    window: 600,
    key: "guest:register",
  });
  if (limited.blocked) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please wait a few minutes." },
      { status: 429 }
    );
  }

  // 2. Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = guestRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const input = parsed.data;

  // 3. Cloudflare Turnstile bot protection
  const turnstileOk = await verifyTurnstile(input.turnstileToken);
  if (!turnstileOk) {
    return NextResponse.json(
      { error: "Bot protection check failed. Please refresh and try again." },
      { status: 403 }
    );
  }

  const supabase = createServiceClient();

  // 4. Resolve trip — must be upcoming or active, match code
  const { data: trip } = await supabase
    .from("trips")
    .select(
      "id, slug, trip_code, trip_date, status, max_guests, requires_approval, charter_type, boat_id, operator_id"
    )
    .eq("slug", input.tripSlug)
    .maybeSingle();

  if (!trip) {
    return NextResponse.json(
      { error: "Trip not found." },
      { status: 404 }
    );
  }

  if (trip.trip_code !== input.tripCode) {
    return NextResponse.json(
      { error: "Incorrect trip code." },
      { status: 400 }
    );
  }

  if (!["upcoming", "active"].includes(trip.status as string)) {
    return NextResponse.json(
      { error: "This trip is no longer accepting registrations." },
      { status: 409 }
    );
  }

  // 5. Check capacity
  const { count: currentGuests } = await supabase
    .from("guests")
    .select("id", { count: "exact", head: true })
    .eq("trip_id", trip.id)
    .is("deleted_at", null);

  if ((currentGuests ?? 0) >= (trip.max_guests as number)) {
    return NextResponse.json(
      { error: "This trip is full." },
      { status: 409 }
    );
  }

  // 6. Verify waiver hash
  if (input.waiverTextHash !== "firma_template") {
    // Fetch boat waiver text for hash comparison
    const { data: boat } = await supabase
      .from("boats")
      .select("waiver_text")
      .eq("id", trip.boat_id)
      .maybeSingle();

    if (boat?.waiver_text) {
      const hashOk = verifyWaiverHash(input.waiverTextHash, boat.waiver_text as string);
      if (!hashOk) {
        return NextResponse.json(
          { error: "Waiver text has changed. Please refresh and try again." },
          { status: 409 }
        );
      }
    }
  }

  // 7. Determine approval status
  const isBareboatCharter = (trip.charter_type as string) === "bareboat";
  const needsLiveryBriefing = isBareboatCharter && !input.fwcLicenseUrl;
  let approvalStatus: string;

  if (needsLiveryBriefing) {
    approvalStatus = "pending_livery_briefing";
  } else if (trip.requires_approval) {
    approvalStatus = "pending";
  } else {
    approvalStatus = "auto_approved";
  }

  // 8. Generate boarding QR token (before insert so we have it for the response)
  const guestPlaceholderId = crypto.randomUUID();
  const qrToken = generateQRToken(
    guestPlaceholderId,
    trip.id as string,
    trip.trip_date as string
  );

  // 9. Determine EU jurisdiction (simplified: checked by client, stored as-is)
  const ipHeader = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  // 10. Insert guest record
  const { data: guest, error: insertError } = await supabase
    .from("guests")
    .insert({
      id: guestPlaceholderId,
      trip_id: trip.id,
      operator_id: trip.operator_id,
      full_name: sanitiseText(input.fullName),
      emergency_contact_name: sanitiseText(input.emergencyContactName),
      emergency_contact_phone: sanitiseText(input.emergencyContactPhone),
      dietary_requirements: input.dietaryRequirements
        ? sanitiseText(input.dietaryRequirements)
        : null,
      language_preference: input.languagePreference,
      date_of_birth: input.dateOfBirth ?? null,
      is_non_swimmer: input.isNonSwimmer,
      is_seasickness_prone: input.isSeaSicknessProne,
      gdpr_consent: input.gdprConsent,
      marketing_consent: input.marketingConsent,
      safety_acknowledgments: JSON.stringify(input.safetyAcknowledgments),
      waiver_signed: true,
      waiver_signature_text: sanitiseText(input.waiverSignatureText),
      waiver_agreed_at: new Date().toISOString(),
      waiver_text_hash: input.waiverTextHash,
      waiver_ip_address: ipHeader,
      fwc_license_url: input.fwcLicenseUrl ?? null,
      approval_status: approvalStatus,
      qr_token: qrToken,
    })
    .select("id")
    .single();

  if (insertError || !guest) {
    console.error("[guest:register] insert failed:", insertError?.message);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }

  // 11. Audit log (fire-and-forget)
  auditLog({
    action: "guest_registered",
    operatorId: trip.operator_id as string,
    actorType: "guest",
    actorIdentifier: sanitiseText(input.fullName),
    entityType: "guest",
    entityId: guest.id as string,
    ipAddress: ipHeader ?? undefined,
  });

  // 12. Build the response
  const response = NextResponse.json({
    success: true,
    guestId: guest.id,
    qrToken,
    approvalStatus,
    requiresCourse: needsLiveryBriefing && !input.fwcLicenseUrl,
  });

  // 13. Set known-guest cookie for per-boat QR recognition
  //     Scoped to the boat, 30 days, HttpOnly, SameSite=Lax
  const boatId = trip.boat_id as string;
  const cookieValue = buildKnownGuestCookieValue(guest.id as string, boatId);
  const cookieOpts = knownGuestCookieOptions(boatId);
  response.cookies.set(cookieOpts.name, cookieValue, {
    httpOnly: cookieOpts.httpOnly,
    sameSite: cookieOpts.sameSite,
    secure: cookieOpts.secure,
    maxAge: cookieOpts.maxAge,
    path: cookieOpts.path,
  });

  return response;
}
