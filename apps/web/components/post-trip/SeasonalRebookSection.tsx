import { ExternalLink } from 'lucide-react'

interface Props {
  operatorName: string | null
  promo: {
    label: string
    dates: string
    url:   string | null
  }
}

export function SeasonalRebookSection({ operatorName, promo }: Props) {
  if (!promo?.label) return null

  return (
    <section
      style={{
        background: 'var(--color-ink)',
        border:     '1px solid var(--color-ink)',
        padding:    '20px',
      }}
    >
      {operatorName && (
        <p style={{
          fontSize:      11,
          textTransform: 'uppercase',
          letterSpacing: '.12em',
          color:         'rgba(255,255,255,0.5)',
          fontWeight:    600,
          marginBottom:  6,
        }}>
          Coming up at {operatorName}
        </p>
      )}

      <p style={{
        fontSize:      22,
        fontWeight:    700,
        color:         '#fff',
        letterSpacing: '-0.02em',
        marginBottom:  4,
        lineHeight:    1.2,
      }}>
        {promo.label}
      </p>

      {promo.dates && (
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      13,
          color:         'rgba(255,255,255,0.65)',
          marginBottom:  16,
          letterSpacing: '.04em',
        }}>
          {promo.dates}
        </p>
      )}

      {promo.url ? (
        <a
          href={promo.url}
          target="_blank"
          rel="noreferrer"
          style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            6,
            padding:        '10px 18px',
            background:     '#fff',
            color:          'var(--color-ink)',
            fontWeight:     700,
            fontSize:       13,
            letterSpacing:  '.04em',
            textTransform:  'uppercase',
            textDecoration: 'none',
            border:         'none',
          }}
        >
          Book now
          <ExternalLink size={12} strokeWidth={2.5} />
        </a>
      ) : (
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontStyle: 'italic' }}>
          Ask your marina for availability
        </p>
      )}
    </section>
  )
}
