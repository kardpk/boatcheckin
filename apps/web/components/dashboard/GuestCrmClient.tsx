'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import { Users, Search, FileSignature, Check, X, ChevronDown, ChevronUp, ExternalLink, Filter } from 'lucide-react'
import Link from 'next/link'
import { DashTile } from '@/components/ui/DashTile'

type TripRow = { id: string; slug: string; trip_date: string; departure_time: string; status: string; boats: { boat_name: string } | null }
type GuestRow = {
  id: string; full_name: string
  dietary_requirements: string | null
  language_preference: string | null
  waiver_signed: boolean; waiver_signed_at: string | null
  approval_status: string | null; checked_in_at: string | null
  created_at: string
  trips: TripRow | null
}

interface GuestCrmClientProps {
  initialGuests: GuestRow[]
  totalGuests: number
  signedWaivers: number
  uniqueTrips: number
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso.slice(0, 10) }
}

export function GuestCrmClient({ initialGuests, totalGuests, signedWaivers, uniqueTrips }: GuestCrmClientProps) {
  const [guests, setGuests]     = useState(initialGuests)
  const [search, setSearch]     = useState('')
  const [waiver, setWaiver]     = useState<'' | 'signed' | 'unsigned'>('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [hasMore, setHasMore]   = useState(initialGuests.length === 50)
  const [offset, setOffset]     = useState(50)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchGuests = useCallback((q: string, w: string, off: number, append = false) => {
    startTransition(async () => {
      const params = new URLSearchParams({ limit: '50', offset: String(off) })
      if (q) params.set('q', q)
      if (w) params.set('waiver', w)

      const res = await fetch(`/api/dashboard/guests?${params}`)
      if (!res.ok) return
      const json = await res.json()
      const rows = (json.data ?? []) as GuestRow[]

      setGuests(prev => append ? [...prev, ...rows] : rows)
      setHasMore(rows.length === 50)
      setOffset(off + rows.length)
    })
  }, [])

  function handleSearch(val: string) {
    setSearch(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setOffset(0)
      fetchGuests(val, waiver, 0)
    }, 350)
  }

  function handleWaiverFilter(val: '' | 'signed' | 'unsigned') {
    setWaiver(val)
    setOffset(0)
    fetchGuests(search, val, 0)
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px' }}>

      {/* Header */}
      <div style={{ marginBottom: 'var(--s-5)' }}>
        <div className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Records
        </div>
        <h1 className="font-display" style={{ fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.0, margin: 0 }}>
          Guest Records
        </h1>
      </div>

      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--s-3)', marginBottom: 'var(--s-5)' }}>
        <DashTile variant="kpi" status="info" label="Total Guests" value={totalGuests.toString()} sub="all time" icon={<Users size={13} strokeWidth={1.5} />} />
        <DashTile variant="kpi" status="ok" label="Waivers Signed" value={signedWaivers.toString()} sub="all time" icon={<Check size={13} strokeWidth={2} />} />
        <DashTile variant="kpi" status="brass" label="Unique Trips" value={uniqueTrips.toString()} sub="with guests" icon={<FileSignature size={13} strokeWidth={1.5} />} />
      </div>

      {/* Search + Filter row */}
      <div style={{ display: 'flex', gap: 'var(--s-3)', marginBottom: 'var(--s-4)', alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={15} strokeWidth={2} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by name…"
            style={{
              width: '100%', height: 40, paddingLeft: 36, paddingRight: 12,
              border: '1px solid var(--color-line)', borderRadius: 'var(--r-1)',
              background: 'var(--color-paper)', fontSize: 14, color: 'var(--color-ink)',
              fontFamily: 'inherit', outline: 'none',
            }}
          />
        </div>
        {/* Waiver filter */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Filter size={13} strokeWidth={2} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-muted)', pointerEvents: 'none' }} />
          <select
            value={waiver}
            onChange={e => handleWaiverFilter(e.target.value as '' | 'signed' | 'unsigned')}
            style={{
              height: 40, paddingLeft: 28, paddingRight: 12,
              border: '1px solid var(--color-line)', borderRadius: 'var(--r-1)',
              background: 'var(--color-paper)', fontSize: 13, color: 'var(--color-ink)',
              fontFamily: 'var(--font-mono)', cursor: 'pointer', outline: 'none', appearance: 'none',
            }}
          >
            <option value="">All</option>
            <option value="signed">Signed</option>
            <option value="unsigned">Unsigned</option>
          </select>
        </div>
      </div>

      {/* Guest list */}
      {guests.length === 0 && !isPending ? (
        <div className="tile" style={{ padding: 'var(--s-10)', textAlign: 'center', borderStyle: 'dashed' }}>
          <Users size={28} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: 'var(--color-ink-muted)' }}>
            {search || waiver ? 'No guests match these filters.' : 'No guests yet.'}
          </p>
        </div>
      ) : (
        <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
          {guests.map((guest, idx) => {
            const trip = guest.trips
            const boatName = trip?.boats?.boat_name ?? '—'
            const isExpanded = expanded === guest.id
            const isLast = idx === guests.length - 1

            let accentColor = 'var(--color-line-soft)'
            if (guest.waiver_signed) accentColor = 'var(--color-status-ok)'
            else if (guest.approval_status === 'declined') accentColor = 'var(--color-status-err)'

            return (
              <div key={guest.id} style={{ borderLeft: `4px solid ${accentColor}`, borderBottom: isLast ? 'none' : '1px solid var(--color-line-soft)', transition: 'border-left-color 0.2s' }}>
                <div
                  style={{ padding: 'var(--s-3) var(--s-4)', display: 'flex', alignItems: 'center', gap: 'var(--s-3)', cursor: 'pointer' }}
                  onClick={() => setExpanded(isExpanded ? null : guest.id)}
                >
                  {/* Avatar */}
                  <div style={{ width: 34, height: 34, borderRadius: 'var(--r-1)', background: 'var(--color-ink)', color: 'var(--color-bone)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                    {initials(guest.full_name)}
                  </div>

                  {/* Name + trip */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {guest.full_name}
                    </p>
                    <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 1 }}>
                      {boatName} · {trip?.trip_date ? formatDate(trip.trip_date) : '—'}
                    </p>
                  </div>

                  {/* Waiver pill */}
                  {guest.waiver_signed
                    ? <span className="pill pill--ok" style={{ flexShrink: 0 }}><Check size={9} strokeWidth={2.5} /> Signed</span>
                    : <span className="pill pill--warn" style={{ flexShrink: 0 }}>Unsigned</span>
                  }

                  {/* Expand toggle */}
                  {isExpanded
                    ? <ChevronUp size={13} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
                    : <ChevronDown size={13} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
                  }
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div style={{ padding: '0 var(--s-4) var(--s-3)', paddingLeft: 'calc(var(--s-4) + 34px + var(--s-3))', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', borderTop: '1px dashed var(--color-line-soft)', marginTop: 0, paddingTop: 'var(--s-3)' }}>
                    {guest.dietary_requirements && (
                      <p style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Dietary: </span>
                        {guest.dietary_requirements}
                      </p>
                    )}
                    {guest.language_preference && guest.language_preference !== 'en' && (
                      <p style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-ink)' }}>Language: </span>
                        {guest.language_preference.toUpperCase()}
                      </p>
                    )}
                    {guest.waiver_signed_at && (
                      <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
                        Waiver signed: {new Date(guest.waiver_signed_at).toLocaleString()}
                      </p>
                    )}
                    {guest.checked_in_at && (
                      <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
                        Boarded: {new Date(guest.checked_in_at).toLocaleString()}
                      </p>
                    )}
                    {trip && (
                      <Link
                        href={`/dashboard/trips/${trip.id}`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-ink)', fontWeight: 500, textDecoration: 'underline', textDecorationColor: 'var(--color-line)' }}
                      >
                        <ExternalLink size={11} strokeWidth={2} />
                        View trip
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => fetchGuests(search, waiver, offset, true)}
          disabled={isPending}
          className="btn"
          style={{ width: '100%', height: 44, justifyContent: 'center', marginTop: 'var(--s-4)', opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? 'Loading…' : 'Load more guests'}
        </button>
      )}

      {/* Pending indicator */}
      {isPending && guests.length > 0 && (
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', textAlign: 'center', marginTop: 'var(--s-3)' }}>
          Searching…
        </p>
      )}
    </div>
  )
}
