import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { GuestCrmClient } from '@/components/dashboard/GuestCrmClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Guest Records — BoatCheckin' }

export default async function GuestsPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // SSR first 50 guests
  const { data: guests } = await supabase
    .from('guests')
    .select(`
      id, full_name, dietary_requirements, language_preference,
      waiver_signed, waiver_signed_at, approval_status,
      checked_in_at, created_at,
      trips!inner (
        id, slug, trip_date, departure_time, status,
        boats ( boat_name )
      )
    `)
    .eq('operator_id', operator.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // Total count for KPI tile
  const { count: totalCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operator.id)
    .is('deleted_at', null)

  // Signed waiver count for KPI tile
  const { count: signedCount } = await supabase
    .from('guests')
    .select('*', { count: 'exact', head: true })
    .eq('operator_id', operator.id)
    .eq('waiver_signed', true)
    .is('deleted_at', null)

  // Number of unique trips with guests
  const { data: uniqueTrips } = await supabase
    .from('guests')
    .select('trip_id')
    .eq('operator_id', operator.id)
    .is('deleted_at', null)
  const uniqueTripCount = new Set((uniqueTrips ?? []).map(r => r.trip_id)).size

  return (
    <GuestCrmClient
      initialGuests={(guests ?? []) as Parameters<typeof GuestCrmClient>[0]['initialGuests']}
      totalGuests={totalCount ?? 0}
      signedWaivers={signedCount ?? 0}
      uniqueTrips={uniqueTripCount}
    />
  )
}
