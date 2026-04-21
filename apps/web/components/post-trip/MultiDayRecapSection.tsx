import type { RentalDaySummaryItem } from '@/types'

interface ReturnCondition {
  inspectedAt: string
  hasIssues:   boolean
  fuelLevel:   string | null
}

interface Props {
  boatName:        string
  durationDays:    number
  days:            RentalDaySummaryItem[]
  returnCondition: ReturnCondition | null
}

function StatusDot({ status }: { status: RentalDaySummaryItem['status'] }) {
  const configs = {
    complete: { bg: 'var(--color-green)',     label: '✓' },
    issue:    { bg: 'var(--color-amber)',     label: '!' },
    active:   { bg: 'var(--color-rust)',      label: '~' },
    pending:  { bg: 'var(--color-ink-faint)', label: '–' },
  }
  const { bg, label } = configs[status] ?? configs.pending
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 4,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 11, fontWeight: 700, color: '#fff',
      flexShrink: 0,
    }}>
      {label}
    </div>
  )
}

function formatShortDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    })
  } catch { return iso }
}

export function MultiDayRecapSection({ boatName, durationDays, days, returnCondition }: Props) {
  if (!days || days.length === 0) return null

  const issueCount = days.filter(d => d.status === 'issue').length

  return (
    <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '16px 20px' }}>
      <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--color-ink-secondary)', fontWeight: 600, marginBottom: 4 }}>
        {boatName}
      </p>
      <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-ink)', marginBottom: 14 }}>
        {durationDays}-day rental recap
      </p>

      {/* Day pills — horizontal scroll on mobile */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, marginBottom: 14 }}>
        {days.map(day => (
          <div
            key={day.dayNumber}
            style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            4,
              flexShrink:     0,
            }}
          >
            <StatusDot status={day.status} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--color-ink-secondary)', letterSpacing: '.06em' }}>
              D{day.dayNumber}
            </span>
            <span style={{ fontSize: 9, color: 'var(--color-ink-secondary)' }}>
              {formatShortDate(day.dayDate)}
            </span>
            {/* Photo count hint */}
            {(day.photosIn.length + day.photosOut.length) > 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--color-ink-faint)', letterSpacing: '.04em' }}>
                {day.photosIn.length + day.photosOut.length} ph
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Issue summary */}
      {issueCount > 0 && (
        <p style={{ fontSize: 12, color: 'var(--color-amber)', fontWeight: 600, marginBottom: 12 }}>
          {issueCount} day{issueCount > 1 ? 's' : ''} had reported issues
        </p>
      )}

      {/* Return condition */}
      {returnCondition && (
        <div style={{
          borderTop: '1px solid var(--color-line-soft)',
          paddingTop: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--color-ink-secondary)', fontWeight: 600, margin: 0 }}>Return</p>
            <p style={{ fontSize: 13, color: 'var(--color-ink)', margin: '2px 0 0' }}>
              {returnCondition.fuelLevel ? `Fuel: ${returnCondition.fuelLevel}` : 'Fuel not recorded'}
              {' · '}
              {returnCondition.hasIssues
                ? <span style={{ color: 'var(--color-amber)', fontWeight: 600 }}>Issues logged</span>
                : <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>All clear</span>
              }
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
