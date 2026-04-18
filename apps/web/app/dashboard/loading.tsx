import { ShimmerLine, ShimmerCard, ShimmerStat } from '@/components/dashboard/TabSkeleton'

/** Instant skeleton while dashboard home data streams from server */
export default function DashboardLoading() {
  return (
    <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
      {/* Greeting shimmer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ShimmerLine width={200} height={22} />
        <ShimmerLine width={140} height={14} />
      </div>

      {/* Today trip card shimmer */}
      <ShimmerCard lines={3} hasIcon style={{ minHeight: 90 }} />

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 'var(--s-3)' }}>
        <ShimmerStat />
        <ShimmerStat />
      </div>

      {/* Upcoming trips */}
      <ShimmerLine width={130} height={14} style={{ marginTop: 'var(--s-2)' }} />
      <ShimmerCard lines={2} hasIcon />
      <ShimmerCard lines={2} hasIcon />
    </div>
  )
}
