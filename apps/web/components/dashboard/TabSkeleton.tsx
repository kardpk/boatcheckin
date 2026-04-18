'use client'

/**
 * TabSkeleton — Shared shimmer primitives for dashboard loading states.
 * Uses CSS animation only — no JS runtime, no framer-motion dependency.
 * Follows MASTER_DESIGN: bone/line-soft palette, soft radius, mono typography.
 */

const shimmerStyle: React.CSSProperties = {
  background: 'linear-gradient(90deg, var(--color-bone) 25%, rgba(244,239,230,0.5) 50%, var(--color-bone) 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.4s ease-in-out infinite',
  borderRadius: 'var(--r-1)',
}

/** Pulsing line placeholder */
export function ShimmerLine({
  width = '100%',
  height = 14,
  style,
}: {
  width?: string | number
  height?: number
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width,
        height,
        ...style,
      }}
      aria-hidden="true"
    />
  )
}

/** Pulsing circle placeholder (avatar) */
export function ShimmerCircle({ size = 42 }: { size?: number }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
      }}
      aria-hidden="true"
    />
  )
}

/** Card-shaped placeholder with optional number of inner lines */
export function ShimmerCard({
  lines = 2,
  hasIcon = false,
  style,
}: {
  lines?: number
  hasIcon?: boolean
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s-3)',
        padding: 'var(--s-4)',
        background: 'var(--color-paper)',
        border: 'var(--border-w) solid var(--color-line-soft)',
        borderRadius: 'var(--r-2)',
        ...style,
      }}
      aria-hidden="true"
    >
      {hasIcon && <ShimmerCircle />}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ShimmerLine width="60%" height={14} />
        {lines >= 2 && <ShimmerLine width="40%" height={11} />}
        {lines >= 3 && <ShimmerLine width="80%" height={11} />}
      </div>
    </div>
  )
}

/** Full-width stat box shimmer */
export function ShimmerStat() {
  return (
    <div
      style={{
        flex: 1,
        padding: 'var(--s-4)',
        background: 'var(--color-paper)',
        border: 'var(--border-w) solid var(--color-line-soft)',
        borderRadius: 'var(--r-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
      aria-hidden="true"
    >
      <ShimmerLine width="50%" height={10} />
      <ShimmerLine width="70%" height={20} />
    </div>
  )
}

/** Header row: title shimmer + button shimmer */
export function ShimmerHeader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-4)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <ShimmerLine width={160} height={22} />
        <ShimmerLine width={100} height={12} />
      </div>
      <ShimmerLine width={90} height={42} style={{ borderRadius: 'var(--r-1)' }} />
    </div>
  )
}
