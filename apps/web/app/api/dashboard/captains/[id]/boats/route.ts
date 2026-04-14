import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

const linkBoatSchema = z.object({
  boatId: z.string().uuid(),
})

// ═══════════════════════════════════════════════════════════════
// GET /api/dashboard/captains/[id]/boats
// List boats linked to a captain
// ═══════════════════════════════════════════════════════════════
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: captainId } = await params

  const limited = await rateLimit(req, { max: 60, window: 60, key: `captain-boats:list:${captainId}` })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const { data: links, error } = await supabase
    .from('captain_boat_links')
    .select('id, boat_id, boats ( id, boat_name, boat_type )')
    .eq('captain_id', captainId)
    .eq('operator_id', user.id)

  if (error) {
    console.error('[captain-boats:list]', error.message)
    return NextResponse.json({ error: 'Failed to load linked boats' }, { status: 500 })
  }

  const boats = (links ?? []).map(l => {
    const boat = l.boats as unknown as { id: string; boat_name: string; boat_type: string } | null
    return {
      linkId: l.id,
      boatId: l.boat_id,
      boatName: boat?.boat_name ?? 'Unknown',
      boatType: boat?.boat_type ?? '',
    }
  })

  return NextResponse.json({ data: boats })
}


// ═══════════════════════════════════════════════════════════════
// POST /api/dashboard/captains/[id]/boats
// Link a boat to a captain
// ═══════════════════════════════════════════════════════════════
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: captainId } = await params

  const limited = await rateLimit(req, { max: 20, window: 3600, key: `captain-boats:link:${captainId}` })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const body = await req.json().catch(() => null)
  const parsed = linkBoatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { boatId } = parsed.data

  // Verify captain belongs to operator
  const { data: captain } = await supabase
    .from('captains')
    .select('id, full_name')
    .eq('id', captainId)
    .eq('operator_id', user.id)
    .single()

  if (!captain) {
    return NextResponse.json({ error: 'Captain not found' }, { status: 404 })
  }

  // Verify boat belongs to operator
  const { data: boat } = await supabase
    .from('boats')
    .select('id, boat_name')
    .eq('id', boatId)
    .eq('operator_id', user.id)
    .eq('is_active', true)
    .single()

  if (!boat) {
    return NextResponse.json({ error: 'Boat not found' }, { status: 404 })
  }

  // Create link
  const { data: link, error } = await supabase
    .from('captain_boat_links')
    .insert({
      captain_id: captainId,
      boat_id: boatId,
      operator_id: user.id,
    })
    .select('id, boat_id')
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'This crew member is already linked to this boat' },
        { status: 409 }
      )
    }
    console.error('[captain-boats:link]', error.message)
    return NextResponse.json({ error: 'Failed to link boat' }, { status: 500 })
  }

  await auditLog({
    action: 'captain_boat_linked',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.email ?? user.id,
    entityType: 'captain',
    entityId: captainId,
    changes: { boatId, boatName: boat.boat_name, captainName: captain.full_name },
  })

  return NextResponse.json({
    data: {
      linkId: link.id,
      boatId: link.boat_id,
      boatName: boat.boat_name,
    },
  }, { status: 201 })
}


// ═══════════════════════════════════════════════════════════════
// DELETE /api/dashboard/captains/[id]/boats
// Unlink a boat from a captain
// ═══════════════════════════════════════════════════════════════
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: captainId } = await params

  const { user } = await requireOperator()
  const supabase = createServiceClient()

  const body = await req.json().catch(() => null)
  const parsed = linkBoatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { boatId } = parsed.data

  // Check for active trip assignment on this boat
  const { data: activeTrip } = await supabase
    .from('trip_assignments')
    .select('id, trips!inner ( id, status, boat_id )')
    .eq('captain_id', captainId)
    .eq('operator_id', user.id)
    .in('trips.status', ['upcoming', 'active'])
    .limit(1)
    .maybeSingle()

  if (activeTrip) {
    const trip = activeTrip.trips as unknown as { boat_id: string }
    if (trip?.boat_id === boatId) {
      return NextResponse.json(
        { error: 'Cannot unlink — this crew member is assigned to an active trip on this boat' },
        { status: 409 }
      )
    }
  }

  const { error } = await supabase
    .from('captain_boat_links')
    .delete()
    .eq('captain_id', captainId)
    .eq('boat_id', boatId)
    .eq('operator_id', user.id)

  if (error) {
    console.error('[captain-boats:unlink]', error.message)
    return NextResponse.json({ error: 'Failed to unlink boat' }, { status: 500 })
  }

  await auditLog({
    action: 'captain_boat_unlinked',
    operatorId: user.id,
    actorType: 'operator',
    actorIdentifier: user.email ?? user.id,
    entityType: 'captain',
    entityId: captainId,
    changes: { boatId, unlinked: true },
  })

  return NextResponse.json({ data: { captainId, boatId, unlinked: true } })
}
