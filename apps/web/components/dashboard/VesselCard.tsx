'use client'

import Link from 'next/link'
import type { FleetTodayRow } from '@/lib/webhooks/types'

/**
 * VesselCard — Fleet Today Board card.
 *
 * Status dot logic (priority order):
 *   Red    = qualification flags > 0
 *   Amber  = waivers incomplete when trip is active, or partial check-in
 *   Green  = all waivers signed + 0 flags
 *   Grey   = no trip today (tripId is null)
 */

function getStatusDot(row: FleetTodayRow): {
  color: string
  label: string
  bg: string
} {
  if (!row.tripId) return { color: '#9CA3AF', label: 'NO TRIP', bg: '#F3F4F6' }
  if (row.flags > 0) return { color: '#DC2626', label: 'FLAGGED', bg: '#FEF2F2' }
  if (row.waiversSigned < row.totalGuests && row.tripStatus === 'active') {
    return { color: '#DC2626', label: 'UNSIGNED', bg: '#FEF2F2' }
  }
  if (row.waiversSigned < row.totalGuests) {
    return { color: '#D97706', label: 'PENDING', bg: '#FFFBEB' }
  }
  if (row.checkedIn < row.totalGuests && row.tripStatus !== 'completed') {
    return { color: '#D97706', label: 'PARTIAL', bg: '#FFFBEB' }
  }
  return { color: '#059669', label: 'READY', bg: '#ECFDF5' }
}

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number
  max: number
  color: string
}) {
  const pct = max === 0 ? 100 : Math.min(100, (value / max) * 100)
  return (
    <div
      style={{
        height: 4,
        background: 'var(--color-line-soft)',
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 4,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: 2,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}

export function VesselCard({ row }: { row: FleetTodayRow }) {
  const dot = getStatusDot(row)

  const card = (
    <div
      style={{
        background:   'var(--color-paper)',
        border:       `1px solid var(--color-line-soft)`,
        borderRadius: 'var(--r-2)',
        overflow:     'hidden',
        cursor:       row.tripId ? 'pointer' : 'default',
        transition:   'box-shadow var(--dur-fast) var(--ease)',
      }}
    >
      {/* Status bar top */}
      <div
        style={{
          height:     3,
          background: dot.color,
        }}
      />

      <div style={{ padding: '14px 16px' }}>
        {/* Header row */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'flex-start',
            marginBottom:   8,
          }}
        >
          <div>
            <p
              style={{
                fontSize:   15,
                fontWeight: 600,
                color:      'var(--color-ink)',
                lineHeight: 1.2,
                margin:     0,
              }}
            >
              {row.boatName}
            </p>
            <p
              className="font-mono"
              style={{
                fontSize:     'var(--t-mono-xs)',
                color:        'var(--color-ink-muted)',
                marginTop:    3,
                letterSpacing: '0.05em',
              }}
            >
              {[
                row.slipNumber ? `Slip ${row.slipNumber}` : null,
                row.departureTime ?? null,
                row.tripType === 'self_drive' ? 'SELF-DRIVE' : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>

          {/* Status pill */}
          <span
            className="font-mono"
            style={{
              fontSize:      'var(--t-mono-xs)',
              fontWeight:    700,
              color:         dot.color,
              background:    dot.bg,
              padding:       '3px 8px',
              borderRadius:  'var(--r-1)',
              letterSpacing: '0.08em',
              whiteSpace:    'nowrap',
              flexShrink:    0,
            }}
          >
            {dot.label}
          </span>
        </div>

        {/* Only show detail rows if there's a trip */}
        {row.tripId && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Waivers */}
            <div>
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'center',
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color:    'var(--color-ink-muted)',
                  }}
                >
                  Waivers
                </span>
                <span
                  className="font-mono"
                  style={{
                    fontSize:   12,
                    fontWeight: 600,
                    color:
                      row.waiversSigned === row.totalGuests
                        ? 'var(--color-teal)'
                        : 'var(--color-ink)',
                  }}
                >
                  {row.waiversSigned}/{row.totalGuests}
                </span>
              </div>
              <ProgressBar
                value={row.waiversSigned}
                max={row.totalGuests}
                color={
                  row.waiversSigned === row.totalGuests
                    ? '#059669'
                    : '#D97706'
                }
              />
            </div>

            {/* Boarded */}
            <div>
              <div
                style={{
                  display:        'flex',
                  justifyContent: 'space-between',
                  alignItems:     'center',
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                  Boarded
                </span>
                <span
                  className="font-mono"
                  style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-ink)' }}
                >
                  {row.checkedIn}/{row.totalGuests}
                </span>
              </div>
              <ProgressBar
                value={row.checkedIn}
                max={row.totalGuests}
                color="#0C447C"
              />
            </div>

            {/* Flags + Addons row */}
            {(row.flags > 0 || row.addonsPendingPrep > 0) && (
              <div
                style={{
                  display:   'flex',
                  gap:       6,
                  marginTop: 2,
                  flexWrap:  'wrap',
                }}
              >
                {row.flags > 0 && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize:     'var(--t-mono-xs)',
                      color:        '#DC2626',
                      background:   '#FEF2F2',
                      borderRadius: 'var(--r-1)',
                      padding:      '2px 6px',
                      fontWeight:   600,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {row.flags} FLAG{row.flags !== 1 ? 'S' : ''}
                  </span>
                )}
                {row.addonsPendingPrep > 0 && (
                  <span
                    className="font-mono"
                    style={{
                      fontSize:     'var(--t-mono-xs)',
                      color:        '#D97706',
                      background:   '#FFFBEB',
                      borderRadius: 'var(--r-1)',
                      padding:      '2px 6px',
                      fontWeight:   600,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {row.addonsPendingPrep} ADD-ON{row.addonsPendingPrep !== 1 ? 'S' : ''} PENDING
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* No trip today */}
        {!row.tripId && (
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', margin: '8px 0 0' }}>
            No trip scheduled
          </p>
        )}
      </div>
    </div>
  )

  if (!row.tripId) return card

  return (
    <Link href={`/dashboard/trips/${row.tripId}`} style={{ textDecoration: 'none' }}>
      {card}
    </Link>
  )
}
