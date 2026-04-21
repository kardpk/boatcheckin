import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

/**
 * POST /api/trips/[slug]/return-inspection
 *
 * Seals the final return vessel condition at end of multi-day rental.
 * Also usable for any trip where the operator wants a documented return.
 *
 * Body:
 *   guestId        : UUID
 *   notes          : string (optional)
 *   fuelLevel      : 'full' | '3/4' | '1/2' | '1/4' | 'empty' (optional)
 *   photoUrls      : string[] max 6 (optional — from upload-photo pre-upload)
 *   issuesReported : string (optional)
 *   attested       : boolean (required — guest ticked attestation checkbox)
 *
 * Side effects:
 *   - Updates trips.return_inspected_at, return_condition_notes, return_condition_photos,
 *     return_fuel_level, return_has_issues
 *   - Audit log
 *   - Operator push notification (fire-and-forget)
 */

const returnSchema = z.object({
  guestId:        z.string().uuid(),
  notes:          z.string().max(500).optional(),
  fuelLevel:      z.enum(['full', '3/4', '1/2', '1/4', 'empty']).optional(),
  photoUrls:      z.array(z.string().url()).max(6).optional(),
  issuesReported: z.string().max(500).optional(),
  attested:       z.literal(true),   // attestation checkbox must be checked
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, { max: 5, window: 300, key: `return-inspection:${slug}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = returnSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { guestId, notes, fuelLevel, photoUrls, issuesReported } = parsed.data
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
    .select('id, operator_id, status, return_inspected_at, boats(boat_name)')
    .eq('id', guest.trip_id)
    .eq('slug', slug)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
  if (trip.status === 'cancelled') return NextResponse.json({ error: 'Trip is cancelled' }, { status: 409 })

  // Prevent double submission
  if (trip.return_inspected_at) {
    return NextResponse.json({ data: { sealed: true, alreadyDone: true } })
  }

  const now      = new Date().toISOString()
  const hasIssue = !!(issuesReported?.trim())

  const { error } = await supabase
    .from('trips')
    .update({
      return_inspected_at:     now,
      return_condition_notes:  notes?.trim() || null,
      return_condition_photos: (photoUrls ?? []).map(url => ({ url, uploadedAt: now })),
      return_fuel_level:       fuelLevel ?? null,
      return_has_issues:       hasIssue,
    })
    .eq('id', trip.id)

  if (error) {
    console.error('[return-inspection] update error:', error)
    return NextResponse.json({ error: 'Failed to seal return record' }, { status: 500 })
  }

  auditLog({
    action: 'return_inspection',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'trip',
    entityId: trip.id,
    changes: { fuelLevel, hasIssue, photoCount: (photoUrls ?? []).length },
  })

  // ── Operator push notification (fire-and-forget) ──────────────────────────
  const boat = trip.boats as { boat_name?: string } | null
  const boatName = boat?.boat_name ?? 'vessel'
  const pushMsg  = hasIssue
    ? `${boatName} returned — issues reported. Please review.`
    : `${boatName} has been returned. Condition: all clear.`

  fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/api/workers/push-trip-update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      operatorId: trip.operator_id,
      tripId:     trip.id,
      message:    pushMsg,
      eventType:  'return_inspection',
    }),
  }).catch(() => { /* non-fatal */ })

  return NextResponse.json({
    data: { sealed: true, hasIssues: hasIssue },
  })
}
