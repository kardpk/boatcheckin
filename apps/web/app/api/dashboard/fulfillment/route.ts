import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import type { FulfillmentOrderRow } from '@/lib/webhooks/types'

/**
 * GET /api/dashboard/fulfillment?date=YYYY-MM-DD
 *
 * Returns v_fulfillment_board for operator's boats.
 * Groups by departure_time.
 * Not cached — fulfillment status changes frequently.
 * No PII (no guest email/phone — only name for loading context).
 */

export async function GET(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 120, window: 60,
    key: `fulfillment:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_fulfillment_board')
    .select('*')
    .eq('operator_id', operator.id)
    .eq('trip_date', date)

  if (error) {
    console.error('[fulfillment] query error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch fulfillment data' }, { status: 500 })
  }

  const rows: FulfillmentOrderRow[] = (data ?? []).map(r => ({
    tripId:            r.trip_id as string,
    tripDate:          r.trip_date as string,
    departureTime:     r.departure_time as string,
    operatorId:        r.operator_id as string,
    boatName:          r.boat_name as string,
    slipNumber:        (r.slip_number as string | null) ?? null,
    addonId:           r.addon_id as string,
    addonName:         r.addon_name as string,
    category:          r.category as FulfillmentOrderRow['category'],
    prepTimeHours:     (r.prep_time_hours as number) ?? 0,
    orderId:           r.order_id as string,
    quantity:          (r.quantity as number) ?? 1,
    fulfillmentStatus: r.fulfillment_status as FulfillmentOrderRow['fulfillmentStatus'],
    fulfillmentNotes:  (r.fulfillment_notes as string | null) ?? null,
    totalCents:        (r.total_cents as number) ?? 0,
    notes:             (r.notes as string | null) ?? null,
    guestName:         r.guest_name as string,
  }))

  // Group by departure_time
  const grouped: Record<string, FulfillmentOrderRow[]> = {}
  for (const row of rows) {
    if (!grouped[row.departureTime]) grouped[row.departureTime] = []
    grouped[row.departureTime]!.push(row)
  }

  return NextResponse.json({ data: rows, grouped })
}
