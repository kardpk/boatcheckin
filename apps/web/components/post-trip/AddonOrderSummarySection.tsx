import type { PostTripAddonSummaryItem } from '@/types'

interface Props {
  items: PostTripAddonSummaryItem[]
}

export function AddonOrderSummarySection({ items }: Props) {
  if (!items || items.length === 0) return null

  function statusLabel(s: string) {
    if (s === 'delivered') return { label: 'Delivered', color: 'var(--color-green)' }
    if (s === 'loaded')    return { label: 'Loaded',    color: 'var(--color-rust)' }
    return                        { label: 'Ordered',   color: 'var(--color-ink-secondary)' }
  }

  return (
    <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '16px 20px' }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--color-ink-secondary)', fontWeight: 600, marginBottom: 12 }}>
        What was on your boat
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, i) => {
          const { label, color } = statusLabel(item.fulfillmentStatus)
          return (
            <div
              key={i}
              style={{
                display:       'flex',
                alignItems:    'center',
                justifyContent:'space-between',
                paddingTop:    10,
                paddingBottom: 10,
                borderBottom:  i < items.length - 1 ? '1px solid var(--color-line-soft)' : 'none',
                gap:           12,
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, color: 'var(--color-ink)', margin: 0 }}>
                  {item.name}
                  {item.quantity > 1 && (
                    <span style={{ fontSize: 12, color: 'var(--color-ink-secondary)', marginLeft: 6 }}>
                      × {item.quantity}
                    </span>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-secondary)' }}>
                  ${(item.totalCents / 100).toFixed(2)}
                </span>
                <span style={{
                  fontFamily:    'var(--font-mono)',
                  fontSize:      10,
                  fontWeight:    700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color,
                }}>
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
