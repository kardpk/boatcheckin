'use client'

import Link from 'next/link'
import { MapPin, ChevronRight } from 'lucide-react'
import { formatTripDate, formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import type { TripStatus } from '@/types'

interface TripCardProps {
  tripId: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  boatName: string
  marinaName: string
  slipNumber: string | null
  guestCount: number
  waiversSigned: number
  requiresApproval: boolean
}

/**
 * TripCard — Editorial trip row tile (MASTER_DESIGN §9.3)
 *
 * Layout: departure time on the left, trip info on the right.
 * Uses .tile border system, mono data, proper pill status.
 */
export function TripCard({
  tripId,
  tripCode,
  tripDate,
  departureTime,
  durationHours,
  maxGuests,
  status,
  boatName,
  marinaName,
  slipNumber,
  guestCount,
  waiversSigned,
  requiresApproval,
}: TripCardProps) {
  return (
    <Link
      href={`/dashboard/trips/${tripId}`}
      className="tile"
      style={{
        display: 'flex',
        gap: 'var(--s-4)',
        padding: 'var(--s-4) var(--s-5)',
        textDecoration: 'none',
        transition: 'background var(--dur-fast) var(--ease)',
        cursor: 'pointer',
      }}
    >
      {/* ── Departure time (left column) ──────────────────────── */}
      <div
        className="font-mono"
        style={{
          flexShrink: 0,
          width: 56,
          paddingTop: 2,
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--color-ink)',
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        {departureTime.slice(0, 5)}
        <div
          style={{
            fontSize: '10px',
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            letterSpacing: '0.06em',
            marginTop: 'var(--s-1)',
          }}
        >
          {formatDuration(durationHours)}
        </div>
      </div>

      {/* ── Trip info (main column) ───────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Row 1: Boat name + status */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s-3)' }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2 }}>
              {boatName}
            </p>
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
                marginTop: 'var(--s-1)',
                fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)',
              }}
            >
              <MapPin size={12} strokeWidth={2} />
              <span>{marinaName}{slipNumber ? ` · Slip ${slipNumber}` : ''}</span>
            </div>
          </div>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
            <TripStatusBadge status={status} />
            <ChevronRight size={16} strokeWidth={2} style={{ color: 'var(--color-ink-muted)' }} />
          </div>
        </div>

        {/* Row 2: Guest stats (separated by soft divider) */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 'var(--s-3)',
            paddingTop: 'var(--s-3)',
            borderTop: '1px dashed var(--color-line-soft)',
          }}
        >
          <div className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-4)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)', letterSpacing: '0.04em' }}>
              {guestCount}
              <span style={{ color: 'var(--color-ink-muted)', fontWeight: 500 }}>/{maxGuests}</span>
              {' '}
              <span style={{ color: 'var(--color-ink-muted)', fontWeight: 500 }}>checked in</span>
            </span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}>
              {waiversSigned} waiver{waiversSigned !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Row 3: Trip code + approval badge */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
            marginTop: 'var(--s-2)',
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
          >
            Code
          </span>
          <span
            className="font-mono"
            style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-rust)', letterSpacing: '0.1em' }}
          >
            {tripCode}
          </span>
          {requiresApproval && (
            <span className="pill pill--warn" style={{ marginLeft: 'auto' }}>
              Manual approval
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
