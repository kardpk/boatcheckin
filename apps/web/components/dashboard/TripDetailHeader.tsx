import Link from 'next/link'
import { ChevronLeft, MapPin } from 'lucide-react'
import { formatTripDate, formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import type { OperatorTripDetail } from '@/types'

/**
 * TripDetailHeader — MASTER_DESIGN editorial header
 *
 * Fraunces boat name, mono trip metadata, proper status pill,
 * rust-colored trip code. Back navigation with ChevronLeft.
 */
export function TripDetailHeader({ trip }: { trip: OperatorTripDetail }) {
  return (
    <div style={{ marginBottom: 'var(--s-6)' }}>
      {/* ── Back nav + kicker ─────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--s-4) 0',
          borderBottom: 'var(--border-w) solid var(--color-line-soft)',
        }}
      >
        <Link
          href="/dashboard/trips"
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
            color: 'var(--color-ink)', textDecoration: 'none',
            fontSize: 'var(--t-body-sm)', fontWeight: 500,
          }}
        >
          <ChevronLeft size={16} strokeWidth={2.5} />
          All trips
        </Link>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* ── Boat name + trip info ──────────────────────────── */}
      <div style={{ paddingTop: 'var(--s-5)' }}>
        <h1
          className="font-display"
          style={{
            fontSize: 'clamp(24px, 4vw, 30px)',
            fontWeight: 500,
            letterSpacing: '-0.025em',
            color: 'var(--color-ink)',
            lineHeight: 1.1,
          }}
        >
          {trip.boat.boatName}
        </h1>

        {/* Trip meta row */}
        <div
          className="font-mono"
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--color-ink-soft)',
            letterSpacing: '0.04em',
            marginTop: 'var(--s-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--s-2)',
          }}
        >
          {formatTripDate(trip.tripDate)} · {trip.departureTime.slice(0, 5)} · {formatDuration(trip.durationHours)}
        </div>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
            marginTop: 'var(--s-1)',
            fontSize: 'var(--t-body-sm)',
            color: 'var(--color-ink-muted)',
          }}
        >
          <MapPin size={13} strokeWidth={2} />
          {trip.boat.marinaName}
          {trip.boat.slipNumber ? ` · Slip ${trip.boat.slipNumber}` : ''}
        </div>
      </div>

      {/* ── Trip code ──────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
          marginTop: 'var(--s-4)',
          paddingTop: 'var(--s-4)',
          borderTop: '1px dashed var(--color-line-soft)',
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: '12px', fontWeight: 600,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
          }}
        >
          Code
        </span>
        <span
          className="font-mono"
          style={{
            fontSize: '22px', fontWeight: 900,
            letterSpacing: '0.15em',
            color: 'var(--color-rust)',
          }}
        >
          {trip.tripCode}
        </span>
      </div>

      {/* ── Insurance notice (if active) ───────────────────── */}
      {trip.buoyPolicyId && trip.status === 'active' && (
        <div
          className="alert alert--ok"
          style={{ marginTop: 'var(--s-4)' }}
        >
          <div>
            Insurance active · Policy {trip.buoyPolicyId}
          </div>
        </div>
      )}
    </div>
  )
}
