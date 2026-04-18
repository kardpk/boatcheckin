import { ShimmerHeader, ShimmerCard } from '@/components/dashboard/TabSkeleton'

/** Instant skeleton while boats list loads */
export default function BoatsLoading() {
  return (
    <div className="px-page py-[16px]">
      <ShimmerHeader />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <ShimmerCard lines={2} hasIcon />
        <ShimmerCard lines={2} hasIcon />
        <ShimmerCard lines={2} hasIcon />
      </div>
    </div>
  )
}
