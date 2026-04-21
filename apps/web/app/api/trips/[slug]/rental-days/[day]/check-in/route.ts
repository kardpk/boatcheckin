import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

const checkInSchema = z.object({
  guestId:    z.string().uuid(),
  notes:      z.string().max(500).optional(),
  fuelLevel:  z.enum(['full', '3/4', '1/2', '1/4', 'empty']).optional(),
  photoUrls:  z.array(z.string().url()).max(3).optional(),  // up to 3 uploaded photo URLs
})

/**
 * POST /api/trips/[slug]/rental-days/[day]/check-in
 *
 * Guest confirms vessel condition at start of day.
 * Accepts optional photoUrls from upload-photo pre-upload step (Phase 4E).
 *
 * Validates:
 *   - Guest belongs to trip
 *   - Rental day exists and status = 'pending'
 *   - Cannot double check-in
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; day: string }> }
) {
  const { slug, day: dayStr } = await params
  const dayNumber = parseInt(dayStr, 10)

  if (isNaN(dayNumber) || dayNumber < 1) {
    return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
  }

  const limited = await rateLimit(req, { max: 10, window: 300, key: `checkin:${slug}:${dayNumber}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { guestId, notes, fuelLevel, photoUrls } = parsed.data
  const supabase = createServiceClient()

  // Verify guest belongs to this trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id')
    .eq('id', guestId)
    .is('deleted_at', null)
    .single()

  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', guest.trip_id)
    .eq('slug', slug)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // Fetch the rental day record
  const { data: rentalDay } = await supabase
    .from('rental_days')
    .select('id, status, day_date')
    .eq('trip_id', trip.id)
    .eq('day_number', dayNumber)
    .single()

  if (!rentalDay) return NextResponse.json({ error: 'Day record not found' }, { status: 404 })

  if (rentalDay.status !== 'pending') {
    return NextResponse.json({ error: 'Day already checked in' }, { status: 409 })
  }

  const now = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('rental_days')
    .update({
      check_in_at:           now,
      notes_in:              notes ?? null,
      fuel_level_in:         fuelLevel ?? null,
      status:                'active',
      submitted_by_guest_id: guestId,
      photos_in: (photoUrls ?? []).map(url => ({ url, uploadedAt: now })),
      condition_in: {
        submittedAt: now,
        notes:       notes ?? null,
        fuelLevel:   fuelLevel ?? null,
        photoCount:  (photoUrls ?? []).length,
      },
    })
    .eq('id', rentalDay.id)
    .select('id, day_number, status, check_in_at, notes_in, fuel_level_in, photos_in')
    .single()

  if (error || !updated) return NextResponse.json({ error: 'Check-in failed' }, { status: 500 })

  auditLog({
    action: 'multi_day_check_in',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'rental_day',
    entityId: rentalDay.id,
    changes: { dayNumber, fuelLevel, notes, photoCount: (photoUrls ?? []).length, tripId: trip.id },
  })

  return NextResponse.json({ data: updated })
}
