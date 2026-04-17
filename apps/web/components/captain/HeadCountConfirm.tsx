'use client'

import { useState, useCallback } from 'react'
import { Users, AlertTriangle, CheckCircle2, Minus, Plus } from 'lucide-react'

interface HeadCountConfirmProps {
  token: string
  digitalGuestCount: number
  onConfirmed?: (count: number) => void
}

export function HeadCountConfirm({
  token,
  digitalGuestCount,
  onConfirmed,
}: HeadCountConfirmProps) {
  const [count, setCount] = useState<string>(String(digitalGuestCount))
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{
    mismatch: boolean
    physicalCount: number
    digitalCount: number
  } | null>(null)

  const numericCount = parseInt(count, 10) || 0
  const mismatch = numericCount !== digitalGuestCount && count !== ''

  const handleConfirm = useCallback(async () => {
    if (numericCount <= 0 || confirming) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/captain/${token}/headcount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: numericCount }),
      })
      if (res.ok) {
        const json = await res.json()
        setResult(json.data)
        setConfirmed(true)
        onConfirmed?.(numericCount)
      }
    } catch {
      // Silent fail
    } finally {
      setConfirming(false)
    }
  }, [numericCount, confirming, token, onConfirmed])

  // Confirmed result state
  if (confirmed && result) {
    return result.mismatch ? (
      <div className="alert alert--warn">
        <AlertTriangle size={18} strokeWidth={2} aria-hidden="true" />
        <div className="alert__body">
          <strong style={{ fontSize: 'var(--t-body-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Head Count Mismatch</strong>
          <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
            {result.physicalCount} aboard · {result.digitalCount} registered · Operator notified
          </p>
        </div>
      </div>
    ) : (
      <div className="alert alert--ok">
        <CheckCircle2 size={18} strokeWidth={2} aria-hidden="true" />
        <div className="alert__body">
          <strong style={{ fontSize: 'var(--t-body-sm)' }}>Head count confirmed</strong>
          <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', margin: '2px 0 0' }}>
            {result.physicalCount} aboard · {result.digitalCount} registered
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header row */}
      <div
        className="flex items-center"
        style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--color-line-soft)', gap: 'var(--s-2)' }}
      >
        <Users size={16} strokeWidth={2} style={{ color: 'var(--color-ink-muted)' }} aria-hidden="true" />
        <h2 className="mono" style={{ fontSize: 'var(--t-mono-sm)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>
          Head Count Verification
        </h2>
      </div>

      <div style={{ padding: 'var(--s-4) var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', fontWeight: 500 }}>
          Digital count:{' '}
          <span style={{ fontWeight: 700, color: 'var(--color-ink)' }}>{digitalGuestCount} guests</span>{' '}
          registered
        </p>

        {/* Stepper */}
        <div className="flex items-center" style={{ gap: 'var(--s-3)' }}>
          <label style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', flexShrink: 0, fontWeight: 500 }}>
            Actual count aboard:
          </label>
          <div
            className="flex items-center overflow-hidden"
            style={{ border: '1px solid var(--color-line)', borderRadius: 'var(--r-1)' }}
          >
            <button
              type="button"
              onClick={() => setCount(String(Math.max(0, numericCount - 1)))}
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, color: 'var(--color-ink)', background: 'none', border: 'none', cursor: 'pointer', transition: 'background var(--dur-fast) var(--ease)' }}
            >
              <Minus size={16} strokeWidth={2} />
            </button>
            <input
              type="number"
              min="0"
              max="500"
              value={count}
              onChange={e => setCount(e.target.value)}
              className="w-16 text-center bg-transparent border-none outline-none"
              style={{ height: 44, fontSize: 'var(--t-tile)', fontWeight: 600, color: 'var(--color-ink)', fontFamily: 'var(--font-display)' }}
            />
            <button
              type="button"
              onClick={() => setCount(String(numericCount + 1))}
              className="flex items-center justify-center"
              style={{ width: 44, height: 44, color: 'var(--color-ink)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={16} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Mismatch warning */}
        {mismatch && (
          <div className="alert alert--warn">
            <AlertTriangle size={16} strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden="true" />
            <p style={{ fontSize: 'var(--t-body-sm)', margin: 0 }}>
              Mismatch: {numericCount} aboard vs {digitalGuestCount} registered. You can still confirm — the operator will be notified.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={numericCount <= 0 || confirming}
          className="btn btn--rust w-full"
          style={{ height: 48, justifyContent: 'center', gap: 'var(--s-2)' }}
        >
          <CheckCircle2 size={16} strokeWidth={2} aria-hidden="true" />
          {confirming ? 'Confirming...' : `Confirm ${numericCount} aboard`}
        </button>
      </div>
    </div>
  )
}
