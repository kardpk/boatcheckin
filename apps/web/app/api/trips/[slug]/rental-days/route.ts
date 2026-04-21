import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { z } from 'zod'

/**
 * GET  /api/trips/[slug]/rental-days
 *   Returns all rental day records for the trip.
 *   Auto-creates day records if trip.duration_days > 1 and none exist.
 *
 * Called by multi-day guest screen to render day condition cards.
 * Validates guestId in query belongs to this trip.
 */

const guestIdSchema = z.string().uuid()

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, { max: 60, window: 60, key: `rental-days:${slug}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const guestId = new URL(req.url).searchParams.get('guestId')
  const parsedGuest = guestIdSchema.safeParse(guestId)
  if (!parsedGuest.success) {
    return NextResponse.json({ error: 'Missing or invalid guestId' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify guest belongs to this trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id')
    .eq('id', parsedGuest.data)
    .is('deleted_at', null)
    .single()

  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id, trip_date, duration_days, operator_id')
    .eq('id', guest.trip_id)
    .eq('slug', slug)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  const durationDays = (trip.duration_days as number | null) ?? 1

  if (durationDays <= 1) {
    return NextResponse.json({ data: [], multiDay: false })
  }

  // Fetch existing day records
  let { data: days } = await supabase
    .from('rental_days')
    .select('id, day_number, day_date, status, notes_in, notes_out, fuel_level_in, fuel_level_out, issues_reported, check_in_at, check_out_at, submitted_by_guest_id')
    .eq('trip_id', trip.id)
    .order('day_number')

  // Auto-create day records if none exist
  if (!days || days.length === 0) {
    const tripDate = new Date(trip.trip_date + 'T12:00:00')
    const newDays = Array.from({ length: durationDays }, (_, i) => {
      const dayDate = new Date(tripDate)
      dayDate.setDate(dayDate.getDate() + i)
      return {
        trip_id:    trip.id,
        operator_id: trip.operator_id,
        day_number: i + 1,
        day_date:   dayDate.toISOString().slice(0, 10),
        status:     'pending' as const,
      }
    })

    const { data: created } = await supabase
      .from('rental_days')
      .insert(newDays)
      .select('id, day_number, day_date, status, notes_in, notes_out, fuel_level_in, fuel_level_out, issues_reported, check_in_at, check_out_at, submitted_by_guest_id')

    days = created ?? []
  }

  return NextResponse.json({ data: days, multiDay: true, durationDays })
}
