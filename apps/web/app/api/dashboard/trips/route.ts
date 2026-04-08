import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import type { TripListItem } from '@/types'

export async function GET(req: NextRequest) {
  // 1. Auth
  const { operator } = await requireOperator()

  // 2. Rate limit: 60 requests/min per operator
  const limited = await rateLimit(req, {
    max: 60,
    window: 60,
    key: `trips:list:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // 3. Parse query params
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') ?? 'upcoming'
  const limit = Math.min(Number(searchParams.get('limit') ?? 20), 100)
  const offset = Number(searchParams.get('offset') ?? 0)

  const supabase = createServiceClient()

  // 4. Fetch trips with boat data joined
  const { data: trips, error, count } = await supabase
    .from('trips')
    .select(
      `
      id,
      slug,
      trip_code,
      trip_date,
      departure_time,
      duration_hours,
      max_guests,
      status,
      charter_type,
      special_notes,
      requires_approval,
      created_at,
      boats (
        id,
        boat_name,
        boat_type,
        marina_name,
        slip_number,
        captain_name,
        lat,
        lng
      )
    `,
      { count: 'exact' },
    )
    .eq('operator_id', operator.id)
    .eq('status', status)
    .order('trip_date', { ascending: status === 'upcoming' })
    .order('departure_time', { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[trips:list]', error.code)
    return NextResponse.json({ error: 'Failed to fetch trips' }, { status: 500 })
  }

  // 5. Batch guest counts in a single query
  const tripIds = (trips ?? []).map((t) => t.id)
  const guestCounts = await getGuestCountsForTrips(tripIds, supabase)

  // 6. Shape response
  const shaped: TripListItem[] = (trips ?? []).map((trip) => ({
    id: trip.id,
    slug: trip.slug,
    tripCode: trip.trip_code,
    tripDate: trip.trip_date,
    departureTime: trip.departure_time,
    durationHours: trip.duration_hours,
    maxGuests: trip.max_guests,
    status: trip.status as TripListItem['status'],
    charterType: trip.charter_type as TripListItem['charterType'],
    specialNotes: trip.special_notes,
    guestCount: guestCounts[trip.id]?.total ?? 0,
    waiversSigned: guestCounts[trip.id]?.signed ?? 0,
    boat: {
      id: (trip.boats as unknown as Record<string, unknown>)?.id as string,
      boatName: (trip.boats as unknown as Record<string, unknown>)?.boat_name as string,
      boatType: (trip.boats as unknown as Record<string, unknown>)?.boat_type as string,
      marinaName: (trip.boats as unknown as Record<string, unknown>)?.marina_name as string,
      slipNumber: ((trip.boats as unknown as Record<string, unknown>)?.slip_number as string) ?? null,
      captainName: ((trip.boats as unknown as Record<string, unknown>)?.captain_name as string) ?? null,
      lat: ((trip.boats as unknown as Record<string, unknown>)?.lat as number) ?? null,
      lng: ((trip.boats as unknown as Record<string, unknown>)?.lng as number) ?? null,
    },
  }))

  return NextResponse.json({
    data: shaped,
    meta: {
      total: count ?? 0,
      limit,
      offset,
      hasMore: offset + limit < (count ?? 0),
    },
  })
}

// ─── Helper: batch guest counts ───────────────────────────────────────────────

async function getGuestCountsForTrips(
  tripIds: string[],
  supabase: ReturnType<typeof createServiceClient>,
): Promise<Record<string, { total: number; signed: number }>> {
  if (tripIds.length === 0) return {}

  const { data } = await supabase
    .from('guests')
    .select('trip_id, waiver_signed')
    .in('trip_id', tripIds)
    .is('deleted_at', null)

  const counts: Record<string, { total: number; signed: number }> = {}
  for (const guest of data ?? []) {
    if (!counts[guest.trip_id]) {
      counts[guest.trip_id] = { total: 0, signed: 0 }
    }
    counts[guest.trip_id]!.total++
    if (guest.waiver_signed) counts[guest.trip_id]!.signed++
  }
  return counts
}
