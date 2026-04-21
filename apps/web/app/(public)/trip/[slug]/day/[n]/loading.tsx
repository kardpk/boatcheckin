export default function DayConditionLoading() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--color-bone)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      gap: '16px',
    }}>
      {/* Header skeleton */}
      <div style={{ height: 14, width: 140, background: 'var(--color-ink-faint)', borderRadius: 4 }} />
      <div style={{ height: 28, width: 220, background: 'var(--color-ink-faint)', borderRadius: 4, marginBottom: 8 }} />

      {/* Form skeleton */}
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          padding: '16px',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <div style={{ height: 12, width: 80, background: 'var(--color-ink-faint)', borderRadius: 3 }} />
          <div style={{ height: 44, background: 'var(--color-bone)', borderRadius: 0 }} />
        </div>
      ))}
    </div>
  )
}
