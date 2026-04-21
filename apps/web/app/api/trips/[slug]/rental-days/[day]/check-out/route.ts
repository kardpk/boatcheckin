import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

const checkOutSchema = z.object({
  guestId:         z.string().uuid(),
  notes:           z.string().max(500).optional(),
  fuelLevel:       z.enum(['full', '3/4', '1/2', '1/4', 'empty']).optional(),
  issuesReported:  z.string().max(500).optional(),
})

/**
 * POST /api/trips/[slug]/rental-days/[day]/check-out
 *
 * Guest seals vessel condition at end of day.
 * Validates status = 'active' (must have checked in first).
 * If issuesReported is non-empty: status = 'issue'; else 'complete'.
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

  const limited = await rateLimit(req, { max: 10, window: 300, key: `checkout:${slug}:${dayNumber}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = checkOutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const { guestId, notes, fuelLevel, issuesReported } = parsed.data
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

  const { data: rentalDay } = await supabase
    .from('rental_days')
    .select('id, status')
    .eq('trip_id', trip.id)
    .eq('day_number', dayNumber)
    .single()

  if (!rentalDay) return NextResponse.json({ error: 'Day record not found' }, { status: 404 })

  if (rentalDay.status !== 'active') {
    return NextResponse.json(
      { error: rentalDay.status === 'pending' ? 'Day not yet checked in' : 'Day already sealed' },
      { status: 409 }
    )
  }

  const hasIssue = !!(issuesReported?.trim())
  const now      = new Date().toISOString()

  const { data: updated, error } = await supabase
    .from('rental_days')
    .update({
      check_out_at:    now,
      notes_out:       notes ?? null,
      fuel_level_out:  fuelLevel ?? null,
      issues_reported: issuesReported?.trim() || null,
      status:          hasIssue ? 'issue' : 'complete',
      condition_out: {
        submittedAt:    now,
        notes:          notes ?? null,
        fuelLevel:      fuelLevel ?? null,
        issuesReported: issuesReported ?? null,
      },
    })
    .eq('id', rentalDay.id)
    .select('id, day_number, status, check_out_at, notes_out, fuel_level_out, issues_reported')
    .single()

  if (error || !updated) return NextResponse.json({ error: 'Check-out failed' }, { status: 500 })

  auditLog({
    action: 'multi_day_check_out',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'rental_day',
    entityId: rentalDay.id,
    changes: { dayNumber, fuelLevel, hasIssue, tripId: trip.id },
  })

  return NextResponse.json({ data: updated })
}
