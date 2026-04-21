import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { EmptyDashboard } from '@/components/dashboard/EmptyDashboard'
import { VesselCard } from '@/components/dashboard/VesselCard'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Metadata } from 'next'
import type { FleetTodayRow } from '@/lib/webhooks/types'

export const metadata: Metadata = { title: 'Today — BoatCheckin' }

/**
 * /dashboard — Fleet Today Board
 * Replaces old home (TodayTripCard + greeting + stats).
 *
 * Shows every vessel for this operator with today's trip status.
 * Vessels without a trip show grey "No trip" card.
 */
export default async function DashboardPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // Check boats exist
  const { count: boatCount } = await supabase
    .from('boats')
    .select('id', { count: 'exact', head: true })
    .eq('operator_id', operator.id)
    .eq('is_active', true)

  if (!boatCount) {
    return (
      <EmptyDashboard
        operatorName={operator.full_name?.split(' ')[0] ?? 'there'}
      />
    )
  }

  // Query v_fleet_today
  const { data: rawRows } = await supabase
    .from('v_fleet_today')
    .select('*')
    .eq('operator_id', operator.id)
    .order('departure_time', { ascending: true, nullsFirst: false })

  const rows: FleetTodayRow[] = (rawRows ?? []).map(r => ({
    boatId:                r.boat_id as string,
    operatorId:            r.operator_id as string,
    boatName:              r.boat_name as string,
    slipNumber:            (r.slip_number as string | null) ?? null,
    tripId:                (r.trip_id as string | null) ?? null,
    tripType:              (r.trip_type as FleetTodayRow['tripType']) ?? null,
    departureTime:         (r.departure_time as string | null) ?? null,
    durationHours:         (r.duration_hours as number | null) ?? null,
    durationDays:          (r.duration_days as number | null) ?? null,
    tripStatus:            (r.trip_status as FleetTodayRow['tripStatus']) ?? null,
    tripCode:              (r.trip_code as string | null) ?? null,
    tripSlug:              (r.trip_slug as string | null) ?? null,
    requiresQualification: (r.requires_qualification as boolean | null) ?? null,
    totalGuests:           Number(r.total_guests) || 0,
    waiversSigned:         Number(r.waivers_signed) || 0,
    checkedIn:             Number(r.checked_in) || 0,
    flags:                 Number(r.flags) || 0,
    addonsPendingPrep:     Number(r.addons_pending_prep) || 0,
    addonRevenueCents:     (r.addon_revenue_cents as number | null) ?? null,
  }))

  const activeCount = rows.filter(r => r.tripId !== null).length

  // Tomorrow's fleet grid (lazy-loaded in client, but SSR the data)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowIso = tomorrow.toISOString().slice(0, 10)

  // We can't filter v_fleet_today by date (it uses CURRENT_DATE) — query trips directly
  const { data: tomorrowTrips } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, trip_type,
      boats ( id, boat_name, slip_number ),
      guests ( id, waiver_signed )
    `)
    .eq('operator_id', operator.id)
    .eq('trip_date', tomorrowIso)
    .neq('status', 'cancelled')
    .is('guests.deleted_at', null)
    .order('departure_time')

  const tomorrowFormatted = tomorrow.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).toUpperCase()

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  return (
    <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s-3)' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: 0, lineHeight: 1.2 }}>
            Today
          </h1>
          <p className="font-mono" style={{
            fontSize: 'var(--t-mono-xs)',
            color: 'var(--color-ink-muted)',
            marginTop: 4,
            letterSpacing: '0.05em',
          }}>
            {todayFormatted}
            {activeCount > 0 && (
              <span style={{ marginLeft: 8, color: 'var(--color-teal)', fontWeight: 700 }}>
                · {activeCount} boat{activeCount !== 1 ? 's' : ''} active
              </span>
            )}
          </p>
        </div>

        {/* Quick add trip */}
        <Link
          href="/dashboard/trips/new"
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            6,
            padding:        '8px 14px',
            background:     'var(--color-rust)',
            color:          'var(--color-bone)',
            borderRadius:   'var(--r-1)',
            textDecoration: 'none',
            fontSize:       13,
            fontWeight:     600,
            flexShrink:     0,
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          New trip
        </Link>
      </div>

      {/* Fleet grid — 2 col mobile, fills content width */}
      {rows.length > 0 ? (
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap:                 'var(--s-3)',
          }}
        >
          {rows.map(row => (
            <VesselCard key={row.boatId} row={row} />
          ))}
        </div>
      ) : (
        <div
          className="tile"
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            padding:        'var(--s-10)',
            gap:            'var(--s-3)',
            borderStyle:    'dashed',
            textAlign:      'center',
          }}
        >
          <p style={{ fontSize: 'var(--t-body-md)', color: 'var(--color-ink-muted)', margin: 0 }}>
            No boats in your fleet yet.
          </p>
          <Link href="/dashboard/boats/new" className="btn btn--rust">
            Add your first boat
          </Link>
        </div>
      )}

      {/* Link to full trip list */}
      {rows.length > 0 && (
        <div style={{ textAlign: 'center' }}>
          <Link
            href="/dashboard/trips"
            className="font-mono"
            style={{
              fontSize:      'var(--t-mono-xs)',
              color:         'var(--color-ink-muted)',
              textDecoration: 'none',
              letterSpacing: '0.06em',
            }}
          >
            All trips →
          </Link>
        </div>
      )}
      {/* Tomorrow section — collapsed expand */}
      {(tomorrowTrips ?? []).length > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{
            cursor:       'pointer',
            fontSize:     12,
            fontWeight:   700,
            color:        'var(--color-ink-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            padding:      '8px 0',
            listStyle:    'none',
            display:      'flex',
            alignItems:   'center',
            gap:          6,
            userSelect:   'none',
          }}>
            Tomorrow — {tomorrowFormatted} · {tomorrowTrips!.length} trip{tomorrowTrips!.length !== 1 ? 's' : ''}
          </summary>
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap:                 'var(--s-3)',
            marginTop:           12,
          }}>
            {tomorrowTrips!.map(t => {
              const boat = t.boats as { id: string; boat_name: string; slip_number: string | null } | null
              const guestArr = (t.guests as { id: string; waiver_signed: boolean }[] | null) ?? []
              const waivers  = guestArr.filter(g => g.waiver_signed).length
              // Construct a minimal FleetTodayRow for VesselCard
              const miniRow: FleetTodayRow = {
                boatId:                boat?.id ?? t.id,
                operatorId:            operator.id,
                boatName:              boat?.boat_name ?? '',
                slipNumber:            boat?.slip_number ?? null,
                tripId:                t.id,
                tripType:              (t.trip_type as FleetTodayRow['tripType']) ?? 'captained',
                departureTime:         t.departure_time as string | null,
                durationHours:         t.duration_hours as number | null,
                durationDays:          null,
                tripStatus:            t.status as FleetTodayRow['tripStatus'],
                tripCode:              t.trip_code as string | null,
                tripSlug:              t.slug as string | null,
                requiresQualification: null,
                totalGuests:           guestArr.length,
                waiversSigned:         waivers,
                checkedIn:             0,
                flags:                 0,
                addonsPendingPrep:     0,
                addonRevenueCents:     null,
              }
              return <VesselCard key={t.id} row={miniRow} />
            })}
          </div>
        </details>
      )}
    </div>
  )
}
