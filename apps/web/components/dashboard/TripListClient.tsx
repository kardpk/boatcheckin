'use client'

import { useState, useEffect } from 'react'
import { LayoutGrid, AlignJustify, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { DashTile, type TileStatus } from '@/components/ui/DashTile'

const PREF_KEY = 'dockpass:trip-list-mode'

interface TripData {
  id:             string
  slug:           string
  trip_code:      string
  trip_date:      string
  departure_time: string
  duration_hours: number
  max_guests:     number
  status:         string
  requires_approval: boolean
  boat_name:      string
  marina_name:    string
  slip_number:    string | null
  guest_count:    number
  waivers_signed: number
}

interface GroupedDate {
  dateKey:   string
  dateLabel: string
  trips:     TripData[]
}

interface Props {
  groups:         GroupedDate[]
  defaultCompact: boolean
}

function getTripTileStatus(trip: TripData): TileStatus {
  if (trip.status === 'active') return 'ok'
  if (trip.waivers_signed < trip.guest_count) return 'warn'
  return 'brass'
}

function getTripPill(trip: TripData): string {
  if (trip.status === 'active') return 'ACTIVE'
  if (trip.waivers_signed < trip.guest_count) return 'PENDING'
  return 'UPCOMING'
}

function formatTime(t: string) {
  // "09:00:00" → "09:00"
  return t?.slice(0, 5) ?? ''
}

function formatDuration(h: number) {
  if (!h) return ''
  if (h >= 24) return `${Math.round(h / 24)}d`
  return `${h}h`
}

export function TripListClient({ groups, defaultCompact }: Props) {
  const [compact, setCompact]   = useState(defaultCompact)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(PREF_KEY)
    if (saved !== null) setCompact(saved === 'compact')
    setHydrated(true)
  }, [])

  function toggle() {
    const next = !compact
    setCompact(next)
    localStorage.setItem(PREF_KEY, next ? 'compact' : 'grid')
  }

  if (!hydrated) return null

  return (
    <div>
      {/* ── View toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button
          onClick={toggle}
          title={compact ? 'Switch to tile grid' : 'Switch to compact list'}
          className="font-mono"
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        5,
            padding:    '6px 12px',
            fontSize:   10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            border:     '1px solid var(--color-line-soft)',
            borderRadius: 'var(--r-1)',
            background: 'var(--color-paper)',
            color:      'var(--color-ink-muted)',
            cursor:     'pointer',
            transition: 'background 140ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bone)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-paper)')}
        >
          {compact
            ? <><LayoutGrid size={12} strokeWidth={2} /> Grid</>
            : <><AlignJustify size={12} strokeWidth={2} /> List</>}
        </button>
      </div>

      {/* ── Date groups ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 'var(--s-3)' : 'var(--s-6)' }}>
        {groups.map(({ dateKey, dateLabel, trips }) => (
          <section key={dateKey}>
            {/* Date kicker */}
            <div
              className="font-mono"
              style={{
                fontSize:      'var(--t-mono-xs)',
                fontWeight:    700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color:         'var(--color-ink-muted)',
                paddingBottom: 'var(--s-2)',
                borderBottom:  '1px solid var(--color-line-soft)',
                marginBottom:  compact ? 0 : 'var(--s-3)',
              }}
            >
              {dateLabel} · {trips.length} trip{trips.length !== 1 ? 's' : ''}
            </div>

            {/* ── GRID mode ── */}
            {!compact && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: 'var(--s-3)',
                marginTop: 'var(--s-3)',
              }}>
                {trips.map(trip => {
                  const status = getTripTileStatus(trip)
                  const metaParts = [
                    formatTime(trip.departure_time),
                    formatDuration(trip.duration_hours),
                    `${trip.guest_count}/${trip.max_guests} guests`,
                    trip.slip_number ? `Slip ${trip.slip_number}` : null,
                  ].filter(Boolean).join(' · ')

                  return (
                    <DashTile
                      key={trip.id}
                      variant="vessel"
                      status={status}
                      eyebrow={trip.trip_code}
                      title={trip.boat_name}
                      meta={metaParts}
                      pill={{ label: getTripPill(trip) }}
                      bars={[
                        {
                          label: 'Waivers',
                          value: trip.waivers_signed,
                          max:   trip.max_guests,
                          color: trip.waivers_signed === trip.max_guests ? '#059669' : '#D97706',
                        },
                      ]}
                      href={`/dashboard/trips/${trip.id}`}
                    />
                  )
                })}
              </div>
            )}

            {/* ── COMPACT LIST mode ── */}
            {compact && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {trips.map(trip => {
                  const status = getTripTileStatus(trip)
                  const metaParts = [
                    formatTime(trip.departure_time),
                    formatDuration(trip.duration_hours),
                    `${trip.guest_count}/${trip.max_guests}`,
                    trip.slip_number ? `Slip ${trip.slip_number}` : null,
                  ].filter(Boolean).join(' · ')

                  return (
                    <DashTile
                      key={trip.id}
                      variant="row"
                      status={status}
                      eyebrow={trip.trip_code}
                      title={trip.boat_name}
                      meta={metaParts}
                      pill={{ label: getTripPill(trip) }}
                      rightSlot={
                        <ChevronRight size={15} strokeWidth={2} style={{ color: 'var(--color-ink-muted)' }} />
                      }
                      href={`/dashboard/trips/${trip.id}`}
                    />
                  )
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
