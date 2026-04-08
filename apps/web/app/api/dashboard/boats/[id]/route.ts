import { NextRequest, NextResponse } from "next/server";
import { requireOperator } from "@/lib/security/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET /api/dashboard/boats/[id] ─────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { operator, supabase } = await requireOperator();

  const { data: boat, error } = await supabase
    .from("boats")
    .select(
      `
      *,
      addons (
        id, name, description, emoji, price_cents, currency,
        max_quantity, is_available, sort_order
      )
    `
    )
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (error || !boat) {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }

  return NextResponse.json({ data: boat });
}

// ─── PATCH /api/dashboard/boats/[id] ────────────────────────────────────────

const boatUpdateSchema = z
  .object({
    boat_name: z.string().min(1).max(120).optional(),
    boat_type: z
      .enum([
        "yacht",
        "catamaran",
        "motorboat",
        "sailboat",
        "pontoon",
        "fishing",
        "speedboat",
        "other",
      ])
      .optional(),
    charter_type: z.enum(["captained", "bareboat", "both"]).optional(),
    year_built: z.number().int().min(1900).max(2030).optional(),
    length_ft: z.number().positive().optional(),
    max_capacity: z.number().int().min(1).max(500).optional(),
    weight_limit_lbs: z.number().int().positive().optional().nullable(),
    marina_name: z.string().min(1).optional(),
    marina_address: z.string().min(1).optional(),
    slip_number: z.string().optional().nullable(),
    parking_instructions: z.string().optional().nullable(),
    lat: z.number().optional().nullable(),
    lng: z.number().optional().nullable(),
    captain_name: z.string().optional().nullable(),
    captain_photo_url: z.string().url().optional().nullable(),
    captain_bio: z.string().optional().nullable(),
    captain_license: z.string().optional().nullable(),
    captain_languages: z.array(z.string()).optional(),
    captain_years_exp: z.number().int().optional().nullable(),
    what_to_bring: z.string().optional().nullable(),
    house_rules: z.string().optional().nullable(),
    prohibited_items: z.string().optional().nullable(),
    safety_briefing: z.string().optional().nullable(),
    onboard_info: z.record(z.string(), z.unknown()).optional(),
    waiver_text: z.string().min(1).optional(),
    cancellation_policy: z.string().optional().nullable(),
    boatsetter_url: z.string().url().optional().nullable(),
    getmyboat_url: z.string().url().optional().nullable(),
    photo_urls: z.array(z.string().url()).optional(),
  })
  .strict();

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { operator, supabase } = await requireOperator();

  const body = await req.json();
  const parsed = boatUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Ensure operator owns this boat
  const { data: existing } = await supabase
    .from("boats")
    .select("id")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("boats")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: updated });
}

// ─── DELETE /api/dashboard/boats/[id] (soft-deactivate) ─────────────────────

export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { operator } = await requireOperator();
  const supabase = createServiceClient();

  // Check ownership
  const { data: boat } = await supabase
    .from("boats")
    .select("id, is_active")
    .eq("id", id)
    .eq("operator_id", operator.id)
    .single();

  if (!boat) {
    return NextResponse.json({ error: "Boat not found" }, { status: 404 });
  }

  // Block if boat has upcoming/active trips
  const { count } = await supabase
    .from("trips")
    .select("id", { count: "exact", head: true })
    .eq("boat_id", id)
    .in("status", ["upcoming", "active"]);

  if (count && count > 0) {
    return NextResponse.json(
      {
        error: `Cannot deactivate boat with ${count} active/upcoming trip(s). Cancel or complete them first.`,
      },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("boats")
    .update({
      is_active: false,
      deactivated_at: new Date().toISOString(),
      deactivated_by: operator.id,
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
