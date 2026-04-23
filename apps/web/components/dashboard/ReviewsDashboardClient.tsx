'use client'

import { useState, useTransition } from 'react'
import { Star, ExternalLink, ChevronLeft, MessageSquare } from 'lucide-react'
import Link from 'next/link'

type Review = {
  id: string; rating: number; feedback_text: string | null; is_public: boolean
  platform: string | null; ai_draft_response: string | null
  response_posted_at: string | null; created_at: string
  trips: { id: string; slug: string; trip_date: string; boats: { boat_name: string } | null } | null
  guests: { full_name: string } | null
}

type BoatRow = {
  id: string; boat_name: string
  google_review_url: string | null
  boatsetter_review_url: string | null
}

interface ReviewsDashboardClientProps {
  reviews: Review[]
  boats: BoatRow[]
  starDist: { star: number; count: number }[]
  avg: number | null
}

function StarRow({ count, star, max }: { count: number; star: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', width: 12, textAlign: 'right' }}>{star}</span>
      <div style={{ flex: 1, height: 6, background: 'var(--color-bone)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-brass)', borderRadius: 3, transition: 'width 500ms' }} />
      </div>
      <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', width: 18, textAlign: 'left' }}>{count}</span>
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={12}
          strokeWidth={1.5}
          style={{ color: i <= rating ? 'var(--color-brass)' : 'var(--color-line)', fill: i <= rating ? 'var(--color-brass)' : 'none' }}
        />
      ))}
    </div>
  )
}

export function ReviewsDashboardClient({ reviews, boats, starDist, avg }: ReviewsDashboardClientProps) {
  const [boatUrls, setBoatUrls] = useState<Record<string, { google: string; boatsetter: string }>>(
    Object.fromEntries(boats.map(b => [b.id, { google: b.google_review_url ?? '', boatsetter: b.boatsetter_review_url ?? '' }]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  void isPending

  const maxCount = Math.max(...starDist.map(s => s.count), 1)

  async function saveBoatUrls(boatId: string) {
    setSaving(boatId)
    startTransition(async () => {
      try {
        const urls = boatUrls[boatId]!
        await fetch(`/api/dashboard/boats/${boatId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            google_review_url: urls.google.trim() || null,
            boatsetter_review_url: urls.boatsetter.trim() || null,
          }),
        })
        setSaved(boatId)
        setTimeout(() => setSaved(null), 2500)
      } finally {
        setSaving(null)
      }
    })
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

      {/* Header */}
      <div>
        <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--s-2)', color: 'var(--color-ink-muted)', fontSize: 13, textDecoration: 'none' }}>
          <ChevronLeft size={14} strokeWidth={2} /> More
        </Link>
        <h1 className="font-display" style={{ fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.0, margin: 0 }}>
          Reviews
        </h1>
        <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 5 }}>
          Guest ratings &amp; feedback
        </p>
      </div>

      {/* Stats tile */}
      {reviews.length > 0 ? (
        <div className="tile" style={{ padding: 'var(--s-5)', display: 'flex', gap: 'var(--s-6)', alignItems: 'center' }}>
          {/* Average */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <p className="font-display" style={{ fontSize: 48, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--color-ink)', lineHeight: 1, margin: 0 }}>
              {avg ?? '—'}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <StarDisplay rating={Math.round(avg ?? 0)} />
            </div>
            <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4, letterSpacing: '0.04em' }}>
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>
          {/* Distribution */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            {[...starDist].reverse().map(s => (
              <StarRow key={s.star} star={s.star} count={s.count} max={maxCount} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Review list */}
      {reviews.length === 0 ? (
        <div className="tile" style={{ padding: 'var(--s-10)', textAlign: 'center', borderStyle: 'dashed' }}>
          <Star size={28} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: 'var(--color-ink-muted)' }}>No reviews yet.</p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 6 }}>
            Guests are invited to leave a review after their trip.
          </p>
        </div>
      ) : (
        <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
          {reviews.map((r, idx) => {
            const boatName = r.trips?.boats?.boat_name ?? '—'
            const tripDate = r.trips?.trip_date ? new Date(r.trips.trip_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
            const isLast = idx === reviews.length - 1

            return (
              <div key={r.id} style={{ padding: 'var(--s-4)', borderBottom: isLast ? 'none' : '1px solid var(--color-line-soft)', borderLeft: `4px solid ${r.rating >= 4 ? 'var(--color-status-ok)' : r.rating === 3 ? 'var(--color-brass)' : 'var(--color-status-err)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
                    <StarDisplay rating={r.rating} />
                    {r.platform && (
                      <span className="pill pill--ghost" style={{ fontSize: 10 }}>{r.platform}</span>
                    )}
                  </div>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
                    {tripDate}
                  </span>
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-ink)', marginBottom: 2 }}>
                  {r.guests?.full_name ?? 'Anonymous'}
                  <span style={{ fontWeight: 400, color: 'var(--color-ink-muted)' }}> · {boatName}</span>
                </p>
                {r.feedback_text && (
                  <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, marginTop: 4 }}>
                    {r.feedback_text}
                  </p>
                )}
                {r.trips && (
                  <Link href={`/dashboard/trips/${r.trips.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 6, textDecoration: 'none' }}>
                    <ExternalLink size={10} strokeWidth={2} /> View trip
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Review redirect config — per boat */}
      {boats.length > 0 && (
        <div className="tile" style={{ padding: 'var(--s-5)', borderStyle: 'dashed' }}>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-4)' }}>
            Review redirect URLs — per boat
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 'var(--s-4)', lineHeight: 1.5 }}>
            Guests who leave 5-star internal reviews are sent here automatically.
          </p>
          {boats.map(boat => (
            <div key={boat.id} style={{ marginBottom: 'var(--s-5)' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', marginBottom: 'var(--s-3)' }}>
                {boat.boat_name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
                {[
                  { key: 'google', label: 'Google Review URL', placeholder: 'https://g.page/r/...' },
                  { key: 'boatsetter', label: 'Boatsetter URL', placeholder: 'https://www.boatsetter.com/boats/...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      <MessageSquare size={10} strokeWidth={2} /> {label}
                    </label>
                    <input
                      type="url"
                      value={boatUrls[boat.id]?.[key as 'google' | 'boatsetter'] ?? ''}
                      onChange={e => setBoatUrls(prev => ({ ...prev, [boat.id]: { ...prev[boat.id]!, [key]: e.target.value } }))}
                      placeholder={placeholder}
                      style={{ width: '100%', height: 38, padding: '0 10px', border: '1px solid var(--color-line)', borderRadius: 'var(--r-1)', background: 'var(--color-paper)', fontSize: 13, color: 'var(--color-ink)', fontFamily: 'inherit', outline: 'none' }}
                    />
                  </div>
                ))}
                <button
                  onClick={() => saveBoatUrls(boat.id)}
                  disabled={saving === boat.id}
                  className="btn btn--sm"
                  style={{ alignSelf: 'flex-end', marginTop: 'var(--s-1)' }}
                >
                  {saved === boat.id ? <><Star size={10} strokeWidth={2} /> Saved</> : saving === boat.id ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
