import { ShimmerHeader, ShimmerCard } from '@/components/dashboard/TabSkeleton'

/** Instant skeleton while trips list loads */
export default function TripsLoading() {
  return (
    <div className="px-page py-[16px]">
      <ShimmerHeader />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <ShimmerCard lines={3} hasIcon />
        <ShimmerCard lines={3} hasIcon />
        <ShimmerCard lines={3} hasIcon />
      </div>
    </div>
  )
}
