import "server-only";

import { createServiceClient } from "@/lib/supabase/service";

// ── Minimal data shapes for the boarding page ──────────────────────────────

export interface BoatInfo {
  id: string;
  boatName: string;
  boatType: string;
  publicSlug: string;
  marinaName: string;
  slipNumber: string | null;
  captainName: string | null;
}

export interface TripInfo {
  id: string;
  slug: string;
  tripCode: string;
  tripDate: string;
  departureTime: string;   // HH:MM
  durationHours: number;
  charterType: string;
  maxGuests: number;
  guestCount: number;
}

export interface GuestInfo {
  id: string;
  fullName: string;
  qrToken: string;
}

// ── Discriminated union: four possible states ─────────────────────────────

export type BoardingState =
  | { kind: "no_trips";      boat: BoatInfo }
  | { kind: "single_trip";   boat: BoatInfo; trip: TripInfo; recognizedGuest: GuestInfo | null }
  | { kind: "multi_trip";    boat: BoatInfo; trips: TripInfo[] };

/**
 * Resolve the boarding state for a given boat public_slug.
 *
 * @param publicSlug   - The 32-char hex slug from the URL.
 * @param recognizedGuestId - Guest UUID from verified known-guest cookie, or null.
 * @returns BoardingState, or null if the boat is not found / inactive.
 */
export async function getBoatBoardingState(
  publicSlug: string,
  recognizedGuestId: string | null
): Promise<BoardingState | null> {
  const supabase = createServiceClient();

  // 1. Resolve the boat — must be active
  const { data: boat, error: boatError } = await supabase
    .from("boats")
    .select(
      "id, boat_name, boat_type, public_slug, is_active, marina_name, slip_number, captain_name"
    )
    .eq("public_slug", publicSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (boatError || !boat) return null;

  const boatInfo: BoatInfo = {
    id: boat.id as string,
    boatName: boat.boat_name as string,
    boatType: boat.boat_type as string,
    publicSlug: boat.public_slug as string,
    marinaName: boat.marina_name as string,
    slipNumber: (boat.slip_number as string) ?? null,
    captainName: (boat.captain_name as string) ?? null,
  };

  // 2. Find today's current/upcoming trips on this boat (UTC — MVP assumption)
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

  const { data: trips } = await supabase
    .from("trips")
    .select(
      "id, slug, trip_code, trip_date, departure_time, duration_hours, charter_type, max_guests, status"
    )
    .eq("boat_id", boat.id)
    .eq("trip_date", today)
    .in("status", ["upcoming", "active"])
    .order("departure_time", { ascending: true });

  if (!trips || trips.length === 0) {
    return { kind: "no_trips", boat: boatInfo };
  }

  // 3. Batch guest counts for all today's trips in a single query
  const tripIds = trips.map((t) => t.id as string);

  const { data: guestRows } = await supabase
    .from("guests")
    .select("trip_id")
    .in("trip_id", tripIds)
    .is("deleted_at", null);

  const countByTrip = new Map<string, number>();
  (guestRows ?? []).forEach((g) => {
    const id = g.trip_id as string;
    countByTrip.set(id, (countByTrip.get(id) ?? 0) + 1);
  });

  const tripInfos: TripInfo[] = trips.map((t) => ({
    id: t.id as string,
    slug: t.slug as string,
    tripCode: t.trip_code as string,
    tripDate: t.trip_date as string,
    departureTime: t.departure_time as string,
    durationHours: Number(t.duration_hours),
    charterType: t.charter_type as string,
    maxGuests: t.max_guests as number,
    guestCount: countByTrip.get(t.id as string) ?? 0,
  }));

  // 4. Multiple trips → return picker (guest chooses which trip they're on)
  if (tripInfos.length > 1) {
    return { kind: "multi_trip", boat: boatInfo, trips: tripInfos };
  }

  // 5. Single trip — check if this is a returning guest
  const trip = tripInfos[0]!;
  let recognizedGuest: GuestInfo | null = null;

  if (recognizedGuestId) {
    const { data: guest } = await supabase
      .from("guests")
      .select("id, full_name, qr_token")
      .eq("id", recognizedGuestId)
      .eq("trip_id", trip.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (guest) {
      recognizedGuest = {
        id: guest.id as string,
        fullName: guest.full_name as string,
        qrToken: guest.qr_token as string,
      };
    }
  }

  return { kind: "single_trip", boat: boatInfo, trip, recognizedGuest };
}
