import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import type { FulfillmentStatus } from '@/lib/webhooks/types'

/**
 * PATCH /api/dashboard/fulfillment/[orderId]
 *
 * Advance fulfillment_status on a guest_addon_order (forward-only).
 * Status chain: ordered → prepping → ready → loaded → delivered
 *
 * Validates:
 *   - Operator owns the order (via trip → boat → operator)
 *   - Transition is forward-only (no rollback)
 *   - Records fulfilled_at + fulfilled_by on loaded/delivered
 */

const STATUS_ORDER: FulfillmentStatus[] = [
  'ordered', 'prepping', 'ready', 'loaded', 'delivered',
]

const patchSchema = z.object({
  status:      z.enum(['ordered', 'prepping', 'ready', 'loaded', 'delivered']),
  fulfilledBy: z.string().max(100).optional(),
  notes:       z.string().max(500).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 120, window: 60,
    key: `fulfillment-patch:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify operator owns this order (via trip → boat → operator)
  const { data: order } = await supabase
    .from('guest_addon_orders')
    .select(`
      id, fulfillment_status, trip_id,
      trips!inner ( boat_id, boats!inner ( operator_id ) )
    `)
    .eq('id', orderId)
    .single() as { data: {
      id: string
      fulfillment_status: FulfillmentStatus
      trip_id: string
      trips: { boat_id: string; boats: { operator_id: string } }
    } | null }

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.trips.boats.operator_id !== operator.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Validate forward-only transition
  const currentIdx = STATUS_ORDER.indexOf(order.fulfillment_status)
  const newIdx     = STATUS_ORDER.indexOf(parsed.data.status)

  if (newIdx <= currentIdx) {
    return NextResponse.json(
      { error: `Cannot move from '${order.fulfillment_status}' to '${parsed.data.status}' (forward-only)` },
      { status: 422 }
    )
  }

  const updates: Record<string, unknown> = {
    fulfillment_status: parsed.data.status,
  }

  if (parsed.data.notes) {
    updates.fulfillment_notes = parsed.data.notes
  }

  // Record timestamp + staff name on loaded/delivered
  if (parsed.data.status === 'loaded' || parsed.data.status === 'delivered') {
    updates.fulfilled_at = new Date().toISOString()
    if (parsed.data.fulfilledBy) updates.fulfilled_by = parsed.data.fulfilledBy
  }

  const { data: updated, error } = await supabase
    .from('guest_addon_orders')
    .update(updates)
    .eq('id', orderId)
    .select('id, fulfillment_status, fulfilled_at, fulfilled_by')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  auditLog({
    action:          'fulfillment_advanced',
    operatorId:      operator.id,
    actorType:       'operator',
    actorIdentifier: operator.id,
    entityType:      'addon_order',
    entityId:        orderId,
    changes: {
      from:        order.fulfillment_status,
      to:          parsed.data.status,
      fulfilledBy: parsed.data.fulfilledBy ?? null,
    },
  })

  return NextResponse.json({ data: updated })
}
