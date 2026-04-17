'use client'

import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { SlideToConfirm } from '@/components/ui/SlideToConfirm'

interface EndTripFlowProps {
  boatName: string
  startedAt: string | null
  token: string
  tripSlug: string
  onEnded: () => void
  onCancel: () => void
}

export function EndTripFlow({
  boatName, startedAt, token, tripSlug, onEnded, onCancel,
}: EndTripFlowProps) {
  const [elapsed, setElapsed] = useState('')
  const [isEnding, setIsEnding] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!startedAt) return
    function update() {
      const ms = Date.now() - new Date(startedAt!).getTime()
      const hours = Math.floor(ms / 3600000)
      const mins = Math.floor((ms % 3600000) / 60000)
      setElapsed(`${hours}hr ${mins}min`)
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [startedAt])

  async function confirmEnd() {
    setIsEnding(true)
    setError('')
    try {
      const res = await fetch(`/api/trips/${tripSlug}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotToken: token }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Failed to end trip')
        setShowConfirm(false)
        return
      }
      onEnded()
    } catch {
      setError('Connection error. Please try again.')
      setShowConfirm(false)
    } finally {
      setIsEnding(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-paper)' }}>

      {/* Header — danger red bg */}
      <div style={{ background: 'var(--color-status-err)', padding: 'var(--s-6) var(--s-5) var(--s-5)' }}>
        <button
          onClick={onCancel}
          className="btn btn--ghost btn--sm"
          style={{ color: 'rgba(244,239,230,0.7)', paddingLeft: 0, marginBottom: 'var(--s-3)' }}
        >
          ← Back
        </button>
        <h1 className="font-display" style={{ fontSize: 'var(--t-card)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-bone)' }}>
          End this charter?
        </h1>
        <p style={{ fontSize: 'var(--t-body-sm)', color: 'rgba(244,239,230,0.7)', marginTop: 'var(--s-1)' }}>{boatName}</p>
      </div>

      <div className="flex-1" style={{ padding: 'var(--s-6) var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

        {/* Elapsed time KPI */}
        {elapsed && (
          <div className="kpi tile" style={{ textAlign: 'center', padding: 'var(--s-5)' }}>
            <p className="kpi-label">Time since departure</p>
            <p className="kpi-value" style={{ fontSize: 'var(--t-sub)' }}>{elapsed}</p>
          </div>
        )}

        {/* What happens tile */}
        <div className="tile" style={{ padding: 'var(--s-5)' }}>
          <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 600, color: 'var(--color-ink)', marginBottom: 'var(--s-3)' }}>
            On ending:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            {[
              'Trip marked as completed',
              'Insurance policy deactivated',
              'Guests sent review request (2hr delay)',
              'Trip postcards unlocked for guests',
            ].map(item => (
              <div key={item} className="flex items-center" style={{ gap: 'var(--s-2)' }}>
                <Check size={14} strokeWidth={2.5} style={{ color: 'var(--color-status-ok)', flexShrink: 0 }} />
                <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="alert alert--err"><span>{error}</span></div>
        )}
      </div>

      {/* Slider */}
      <div style={{ padding: 'var(--s-4) var(--s-5) var(--s-10)', background: 'var(--color-paper)', borderTop: '1px solid var(--color-line-soft)' }}>
        <SlideToConfirm
          label="SLIDE TO END TRIP"
          onComplete={() => setShowConfirm(true)}
          color="coral"
        />
      </div>

      {/* Confirm overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(11,30,45,0.55)' }}>
          <div style={{ width: '100%', background: 'var(--color-paper)', borderTopLeftRadius: 'var(--r-1)', borderTopRightRadius: 'var(--r-1)', padding: 'var(--s-5) var(--s-5) var(--s-8)' }}>
            <div style={{ width: 40, height: 3, background: 'var(--color-line)', borderRadius: 2, margin: '0 auto var(--s-4)' }} />
            <h2 className="font-display" style={{ fontSize: 'var(--t-tile)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--s-2)' }}>
              End charter?
            </h2>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-6)' }}>
              This cannot be undone. The trip will be marked as completed.
            </p>
            <div className="flex" style={{ gap: 'var(--s-3)' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isEnding}
                className="btn flex-1"
                style={{ height: 56, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmEnd}
                disabled={isEnding}
                className="btn btn--danger flex-1"
                style={{ height: 56, justifyContent: 'center', fontSize: 'var(--t-body-md)', fontWeight: 600 }}
              >
                {isEnding ? <AnchorLoader size="sm" color="white" /> : 'End trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
