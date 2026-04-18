import { ShimmerHeader, ShimmerCard } from '@/components/dashboard/TabSkeleton'

/** Instant skeleton while crew roster loads */
export default function CaptainsLoading() {
  return (
    <div className="max-w-[640px] mx-auto px-5 pb-[100px] pt-4">
      <ShimmerHeader />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
        <ShimmerCard lines={3} hasIcon />
        <ShimmerCard lines={3} hasIcon />
      </div>
    </div>
  )
}
