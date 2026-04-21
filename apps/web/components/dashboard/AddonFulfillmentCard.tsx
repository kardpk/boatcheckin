'use client'

import { useState, useCallback, useOptimistic, startTransition } from 'react'
import type { FulfillmentOrderRow, FulfillmentStatus } from '@/lib/webhooks/types'

const STATUS_ORDER: FulfillmentStatus[] = [
  'ordered', 'prepping', 'ready', 'loaded', 'delivered',
]

const STATUS_LABEL: Record<FulfillmentStatus, string> = {
  ordered:   'ORDERED',
  prepping:  'PREPPING',
  ready:     'READY',
  loaded:    'LOADED',
  delivered: 'DELIVERED',
}

const STATUS_COLOR: Record<FulfillmentStatus, { color: string; bg: string }> = {
  ordered:   { color: '#6B7C93', bg: '#F5F8FC' },
  prepping:  { color: '#D97706', bg: '#FFFBEB' },
  ready:     { color: '#059669', bg: '#ECFDF5' },
  loaded:    { color: '#0C447C', bg: '#EFF6FF' },
  delivered: { color: '#7C3AED', bg: '#F5F3FF' },
}

function getNextStatus(current: FulfillmentStatus): FulfillmentStatus | null {
  const idx = STATUS_ORDER.indexOf(current)
  return idx < STATUS_ORDER.length - 1 ? STATUS_ORDER[idx + 1]! : null
}

interface AddonFulfillmentCardProps {
  order: FulfillmentOrderRow
  onAdvance: (orderId: string, newStatus: FulfillmentStatus) => Promise<void>
}

export function AddonFulfillmentCard({ order, onAdvance }: AddonFulfillmentCardProps) {
  const [status, setStatus] = useState<FulfillmentStatus>(order.fulfillmentStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextStatus = getNextStatus(status)
  const style = STATUS_COLOR[status]

  const handleTap = useCallback(async () => {
    if (!nextStatus || loading) return
    setError(null)
    setLoading(true)

    // Optimistic update
    const prev = status
    setStatus(nextStatus)

    try {
      await onAdvance(order.orderId, nextStatus)
    } catch {
      // Rollback
      setStatus(prev)
      setError('Failed to update. Tap to retry.')
    } finally {
      setLoading(false)
    }
  }, [nextStatus, loading, status, order.orderId, onAdvance])

  return (
    <div
      style={{
        border:       `1px solid var(--color-line-soft)`,
        borderRadius: 'var(--r-1)',
        padding:      '12px 14px',
        background:   'var(--color-paper)',
        display:      'flex',
        alignItems:   'center',
        gap:          12,
        opacity:      status === 'delivered' ? 0.6 : 1,
        transition:   'opacity 0.2s ease',
      }}
    >
      {/* Order info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' }}>
          {order.addonName}
          {order.quantity > 1 && (
            <span style={{ fontWeight: 400, color: 'var(--color-ink-muted)', marginLeft: 6 }}>
              × {order.quantity}
            </span>
          )}
        </p>
        <p className="font-mono" style={{
          margin:        '2px 0 0',
          fontSize:      'var(--t-mono-xs)',
          color:         'var(--color-ink-muted)',
          letterSpacing: '0.04em',
        }}>
          {order.guestName}
          {order.prepTimeHours > 0 && (
            <span style={{ marginLeft: 8 }}>· {order.prepTimeHours}h prep</span>
          )}
        </p>
        {error && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#DC2626' }}>{error}</p>
        )}
      </div>

      {/* Status pill — tap to advance */}
      <button
        onClick={handleTap}
        disabled={!nextStatus || loading || status === 'delivered'}
        style={{
          padding:       '5px 12px',
          borderRadius:  'var(--r-1)',
          border:        'none',
          background:    style.bg,
          color:         style.color,
          fontFamily:    'var(--font-mono)',
          fontSize:      'var(--t-mono-xs)',
          fontWeight:    700,
          letterSpacing: '0.08em',
          cursor:        nextStatus && !loading ? 'pointer' : 'default',
          flexShrink:    0,
          transition:    'all 0.15s ease',
          opacity:       loading ? 0.7 : 1,
        }}
        aria-label={nextStatus ? `Advance to ${STATUS_LABEL[nextStatus]}` : STATUS_LABEL[status]}
      >
        {loading ? '...' : `${STATUS_LABEL[status]}${nextStatus ? ' >' : ''}`}
      </button>
    </div>
  )
}
