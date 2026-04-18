import { ShimmerLine } from '@/components/dashboard/TabSkeleton'

/**
 * Login page loading skeleton — shows the form shape instantly
 * while the server component (searchParams parsing) resolves.
 * Matches the auth layout dark theme.
 */
export default function LoginLoading() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>
      {/* Kicker shimmer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
        <div style={{ width: 24, height: 1, background: 'rgba(196,172,128,0.3)' }} />
        <ShimmerLine width={120} height={10} style={{ background: 'linear-gradient(90deg, rgba(196,172,128,0.15) 25%, rgba(196,172,128,0.08) 50%, rgba(196,172,128,0.15) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
      </div>

      {/* Heading shimmer */}
      <ShimmerLine width={220} height={34} style={{ background: 'linear-gradient(90deg, rgba(244,239,230,0.08) 25%, rgba(244,239,230,0.04) 50%, rgba(244,239,230,0.08) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
      <ShimmerLine width={300} height={14} style={{ background: 'linear-gradient(90deg, rgba(244,239,230,0.06) 25%, rgba(244,239,230,0.03) 50%, rgba(244,239,230,0.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite', marginBottom: 'var(--s-4)' }} />

      {/* Email field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ShimmerLine width={100} height={11} style={{ background: 'linear-gradient(90deg, rgba(244,239,230,0.06) 25%, rgba(244,239,230,0.03) 50%, rgba(244,239,230,0.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
        <ShimmerLine width="100%" height={48} style={{ background: 'rgba(244,239,230,0.06)', borderRadius: 'var(--r-1)', border: '1px solid rgba(244,239,230,0.1)' }} />
      </div>

      {/* Password field */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <ShimmerLine width={70} height={11} style={{ background: 'linear-gradient(90deg, rgba(244,239,230,0.06) 25%, rgba(244,239,230,0.03) 50%, rgba(244,239,230,0.06) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
        <ShimmerLine width="100%" height={48} style={{ background: 'rgba(244,239,230,0.06)', borderRadius: 'var(--r-1)', border: '1px solid rgba(244,239,230,0.1)' }} />
      </div>

      {/* Submit button */}
      <ShimmerLine width="100%" height={52} style={{ background: 'rgba(191,87,56,0.3)', borderRadius: 'var(--r-1)', marginTop: 'var(--s-4)' }} />
    </div>
  )
}
