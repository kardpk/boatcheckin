import { createServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { DayConditionClient } from '@/components/trip/DayConditionClient'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ slug: string; n: string }>
  searchParams: Promise<{ guestId?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { n } = await params
  return { title: `Day ${n} Condition — BoatCheckin` }
}

/**
 * /trip/[slug]/day/[n]
 *
 * Public multi-day condition page. Accessed from guest's trip link.
 * Not part of the join-flow sheet — this is a separate page used
 * during an active multi-day rental.
 *
 * Shows: check-in form (pending), check-out form (active), or sealed record (complete/issue).
 */
export default async function DayConditionPage({ params, searchParams }: Props) {
  const { slug, n: dayStr } = await params
  const dayNumber = parseInt(dayStr, 10)

  if (isNaN(dayNumber) || dayNumber < 1) notFound()

  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, trip_date, duration_days, status,
      boats ( boat_name, marina_name, slip_number ),
      operators ( company_name )
    `)
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .single()

  if (!trip || (trip.duration_days as number | null ?? 1) < 2) notFound()
  if (dayNumber > (trip.duration_days as number)) notFound()

  const { guestId } = await searchParams
  if (!guestId) notFound()

  // Verify guest belongs to this trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, full_name')
    .eq('id', guestId)
    .eq('trip_id', trip.id)
    .is('deleted_at', null)
    .single()

  if (!guest) notFound()

  // Fetch the rental day record
  const { data: rentalDay } = await supabase
    .from('rental_days')
    .select('id, day_number, day_date, status, notes_in, notes_out, fuel_level_in, fuel_level_out, issues_reported, check_in_at, check_out_at, photos_in, photos_out')
    .eq('trip_id', trip.id)
    .eq('day_number', dayNumber)
    .maybeSingle()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boat = trip.boats as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operator = trip.operators as any

  return (
    <DayConditionClient
      slug={slug}
      dayNumber={dayNumber}
      guestId={guestId}
      guestName={guest.full_name as string}
      boatName={boat?.boat_name ?? ''}
      marinaName={boat?.marina_name ?? ''}
      slipNumber={boat?.slip_number ?? null}
      operatorName={operator?.company_name ?? ''}
      tripDate={trip.trip_date as string}
      durationDays={trip.duration_days as number}
      rentalDay={rentalDay}
    />
  )
}
