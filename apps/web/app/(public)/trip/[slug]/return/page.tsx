import { createServiceClient } from '@/lib/supabase/service'
import { notFound, redirect } from 'next/navigation'
import { ReturnInspectionClient } from '@/components/trip/ReturnInspectionClient'
import type { Metadata } from 'next'

interface Props {
  params:       Promise<{ slug: string }>
  searchParams: Promise<{ guestId?: string }>
}

export const metadata: Metadata = {
  title: 'Return Vessel Condition — BoatCheckin',
}

/**
 * /trip/[slug]/return
 *
 * Final return inspection page for multi-day rentals.
 * Accessed from boarding pass day-links block (final day) or StepBoarding.
 *
 * Guards:
 *   - Trip must be multi-day (duration_days > 1)
 *   - guestId must belong to trip
 *   - return_date must be today or past
 *   - If already inspected → redirect to /completed
 *   - If return date in future → show "not yet" message
 */
export default async function ReturnInspectionPage({ params, searchParams }: Props) {
  const { slug }    = await params
  const { guestId } = await searchParams

  if (!guestId) notFound()

  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, trip_date, duration_days, return_date, status,
      return_inspected_at,
      boats ( boat_name, marina_name, slip_number ),
      operators ( company_name )
    `)
    .eq('slug', slug)
    .neq('status', 'cancelled')
    .single()

  if (!trip) notFound()

  // Must be multi-day
  const durationDays = (trip.duration_days as number | null) ?? 1
  if (durationDays < 2) notFound()

  // Verify guest belongs to this trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id')
    .eq('id', guestId)
    .eq('trip_id', trip.id)
    .is('deleted_at', null)
    .single()

  if (!guest) notFound()

  // Already inspected → go to completed
  if (trip.return_inspected_at) {
    redirect(`/trip/${slug}/completed`)
  }

  const boat     = trip.boats as { boat_name?: string; marina_name?: string; slip_number?: string } | null
  const operator = trip.operators as { company_name?: string } | null

  // Check if we're at or past the return date
  const returnDateStr = (trip.return_date as string | null) ?? (() => {
    // Compute return date from trip_date + duration_days - 1
    try {
      const d = new Date((trip.trip_date as string) + 'T12:00:00')
      d.setDate(d.getDate() + durationDays - 1)
      return d.toISOString().slice(0, 10)
    } catch { return null }
  })()

  const today = new Date().toISOString().slice(0, 10)

  if (returnDateStr && today < returnDateStr) {
    // Too early — show friendly holding message
    const formatted = (() => {
      try { return new Date(returnDateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }
      catch { return returnDateStr }
    })()
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-bone)', padding: '48px 24px', fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <p style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-ink-secondary)', marginBottom: 8 }}>
          {boat?.boat_name ?? ''} · Return record
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 8 }}>Not yet</h1>
        <p style={{ fontSize: 14, color: 'var(--color-ink-secondary)', maxWidth: 280, lineHeight: 1.6 }}>
          Your rental runs until <strong style={{ color: 'var(--color-ink)' }}>{formatted}</strong>.
          Come back on that day to complete your return record.
        </p>
      </div>
    )
  }

  return (
    <ReturnInspectionClient
      slug={slug}
      tripSlug={slug}
      guestId={guestId}
      boatName={boat?.boat_name ?? ''}
      marinaName={boat?.marina_name ?? ''}
      slipNumber={boat?.slip_number ?? null}
      operatorName={operator?.company_name ?? ''}
      returnDate={returnDateStr ?? today}
      durationDays={durationDays}
    />
  )
}
