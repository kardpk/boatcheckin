import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { FulfillmentBoardClient } from '@/components/dashboard/FulfillmentBoardClient'
import type { Metadata } from 'next'
import type { FulfillmentOrderRow } from '@/lib/webhooks/types'

export const metadata: Metadata = { title: 'Fulfillment — BoatCheckin' }

export default async function FulfillmentPage() {
  const { operator } = await requireOperator()
  const supabase     = createServiceClient()
  const today        = new Date().toISOString().slice(0, 10)

  const { data: rows } = await supabase
    .from('v_fulfillment_board')
    .select('*')
    .eq('operator_id', operator.id)
    .eq('trip_date', today)

  const shaped: FulfillmentOrderRow[] = (rows ?? []).map(r => ({
    tripId:            r.trip_id as string,
    tripDate:          r.trip_date as string,
    departureTime:     r.departure_time as string,
    operatorId:        r.operator_id as string,
    boatName:          r.boat_name as string,
    slipNumber:        (r.slip_number as string | null) ?? null,
    addonId:           r.addon_id as string,
    addonName:         r.addon_name as string,
    category:          r.category as FulfillmentOrderRow['category'],
    prepTimeHours:     Number(r.prep_time_hours) || 0,
    orderId:           r.order_id as string,
    quantity:          Number(r.quantity) || 1,
    fulfillmentStatus: r.fulfillment_status as FulfillmentOrderRow['fulfillmentStatus'],
    fulfillmentNotes:  (r.fulfillment_notes as string | null) ?? null,
    totalCents:        Number(r.total_cents) || 0,
    notes:             (r.notes as string | null) ?? null,
    guestName:         r.guest_name as string,
  }))

  // Group by departure_time for SSR initial render
  const grouped: Record<string, FulfillmentOrderRow[]> = {}
  for (const row of shaped) {
    if (!grouped[row.departureTime]) grouped[row.departureTime] = []
    grouped[row.departureTime]!.push(row)
  }

  return (
    <FulfillmentBoardClient
      initialDate={today}
      grouped={grouped}
    />
  )
}
