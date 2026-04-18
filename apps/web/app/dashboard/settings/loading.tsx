import { ShimmerLine, ShimmerCard } from '@/components/dashboard/TabSkeleton'

/** Instant skeleton while settings page loads */
export default function SettingsLoading() {
  return (
    <div className="px-page py-[16px]">
      <ShimmerLine width={120} height={22} style={{ marginBottom: 'var(--s-4)' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
        <ShimmerCard lines={2} hasIcon />
        <ShimmerCard lines={2} hasIcon />
        <ShimmerCard lines={2} hasIcon />
        <ShimmerCard lines={1} hasIcon />
      </div>
    </div>
  )
}
