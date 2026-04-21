'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AddonFulfillmentCard } from '@/components/dashboard/AddonFulfillmentCard'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { FulfillmentOrderRow, FulfillmentStatus } from '@/lib/webhooks/types'

interface FulfillmentBoardClientProps {
  initialDate: string
  grouped: Record<string, FulfillmentOrderRow[]>
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    })
  } catch { return dateStr }
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function FulfillmentBoardClient({ initialDate, grouped }: FulfillmentBoardClientProps) {
  const router      = useRouter()
  const [date, setDate]     = useState(initialDate)
  const [orders, setOrders] = useState<Record<string, FulfillmentOrderRow[]>>(grouped)
  const [loading, setLoading] = useState(false)

  const navigateDate = useCallback(async (newDate: string) => {
    setLoading(true)
    setDate(newDate)
    try {
      const res  = await fetch(`/api/dashboard/fulfillment?date=${newDate}`)
      const json = await res.json()
      setOrders((json as { grouped: Record<string, FulfillmentOrderRow[]> }).grouped ?? {})
    } catch {
      setOrders({})
    } finally {
      setLoading(false)
    }
  }, [])

  const handleAdvance = useCallback(async (
    orderId: string,
    newStatus: FulfillmentStatus
  ) => {
    const res = await fetch(`/api/dashboard/fulfillment/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (!res.ok) throw new Error('Failed to update')

    // Update local state optimistically already handled in card,
    // but also update our grouped map so date navigation preserves updates
    setOrders(prev => {
      const next = { ...prev }
      for (const time of Object.keys(next)) {
        next[time] = (next[time] ?? []).map(o =>
          o.orderId === orderId ? { ...o, fulfillmentStatus: newStatus } : o
        )
      }
      return next
    })
  }, [])

  const departureTimes = Object.keys(orders).sort()
  const isToday        = date === new Date().toISOString().slice(0, 10)
  const totalOrders    = Object.values(orders).flat().length

  return (
    <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>

      {/* Date navigation */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px' }}>
          Fulfillment
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => navigateDate(offsetDate(date, -1))}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--color-paper)',
              border: '1px solid var(--color-line-soft)', borderRadius: 'var(--r-1)',
              cursor: 'pointer', color: 'var(--color-ink)',
            }}
            aria-label="Previous day"
          >
            <ChevronLeft size={16} />
          </button>

          <p className="font-mono" style={{
            fontSize: 'var(--t-mono-xs)', fontWeight: 600,
            color: 'var(--color-ink)', letterSpacing: '0.05em',
            flex: 1, textAlign: 'center',
          }}>
            {isToday ? 'TODAY · ' : ''}{formatDate(date)}
          </p>

          <button
            onClick={() => navigateDate(offsetDate(date, 1))}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--color-paper)',
              border: '1px solid var(--color-line-soft)', borderRadius: 'var(--r-1)',
              cursor: 'pointer', color: 'var(--color-ink)',
            }}
            aria-label="Next day"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 'var(--s-8)', color: 'var(--color-ink-muted)' }}>
          Loading...
        </div>
      )}

      {!loading && totalOrders === 0 && (
        <div
          className="tile"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: 'var(--s-10)', gap: 'var(--s-3)', borderStyle: 'dashed', textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 'var(--t-body-md)', color: 'var(--color-ink-muted)', margin: 0 }}>
            No add-on orders to fulfill on this date.
          </p>
        </div>
      )}

      {!loading && departureTimes.map(time => {
        const timeOrders = orders[time] ?? []
        const boatGroups: Record<string, FulfillmentOrderRow[]> = {}

        for (const o of timeOrders) {
          const key = `${o.boatName}||${o.slipNumber ?? ''}`
          if (!boatGroups[key]) boatGroups[key] = []
          boatGroups[key]!.push(o)
        }

        return (
          <section key={time}>
            {/* Departure time header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
              marginBottom: 'var(--s-3)',
              paddingBottom: 'var(--s-2)',
              borderBottom: '1.5px solid var(--color-ink)',
            }}>
              <span className="font-mono" style={{
                fontSize: 'var(--t-mono-sm)', letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--color-ink)',
                fontWeight: 700,
              }}>
                {time} Departures
              </span>
            </div>

            {/* Boat sub-sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
              {Object.entries(boatGroups).map(([boatKey, boatOrders]) => {
                const firstOrder = boatOrders[0]!
                return (
                  <div
                    key={boatKey}
                    className="tile"
                    style={{ padding: 0, overflow: 'hidden' }}
                  >
                    {/* Boat header */}
                    <div style={{
                      padding: '10px 14px',
                      background: 'var(--color-bg)',
                      borderBottom: '1px solid var(--color-line-soft)',
                    }}>
                      <p className="font-mono" style={{
                        margin: 0, fontSize: 'var(--t-mono-xs)',
                        fontWeight: 700, color: 'var(--color-ink)',
                        letterSpacing: '0.06em',
                      }}>
                        {firstOrder.boatName}
                        {firstOrder.slipNumber && ` · Slip ${firstOrder.slipNumber}`}
                        <span style={{ color: 'var(--color-ink-muted)', fontWeight: 400 }}>
                          {' '}· {boatOrders.length} order{boatOrders.length !== 1 ? 's' : ''}
                        </span>
                      </p>
                    </div>

                    {/* Order cards */}
                    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {boatOrders.map(order => (
                        <AddonFulfillmentCard
                          key={order.orderId}
                          order={order}
                          onAdvance={handleAdvance}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
