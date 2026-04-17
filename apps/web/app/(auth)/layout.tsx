
import Link from "next/link";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col bg-[#07101C] relative overflow-hidden">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 30%, rgba(11,54,96,0.25) 0%, transparent 70%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-11 h-[62px] border-b border-white/[0.07] bg-[rgba(7,16,28,0.95)] backdrop-blur-[20px]">
        <Link href="/" className="flex items-center no-underline" style={{ gap: 'var(--s-3)' }}>
          {/* Anchor icon — brass stroke, sharp square */}
          <span
            style={{
              width: 26, height: 26,
              border: '1.5px solid var(--color-brass)',
              borderRadius: 'var(--r-1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="13" height="15" viewBox="0 0 20 26" fill="none" stroke="var(--color-brass)" strokeWidth="1.8">
              <circle cx="10" cy="4.5" r="3" />
              <line x1="10" y1="7.5" x2="10" y2="26" />
              <path d="M2 14 Q2 24 10 24 Q18 24 18 14" />
              <line x1="2" y1="12" x2="18" y2="12" />
            </svg>
          </span>
          {/* Wordmark — Fraunces per §4.1 */}
          <span
            className="font-display"
            style={{ fontSize: 19, fontWeight: 500, color: 'var(--color-bone)', letterSpacing: '0.02em' }}
          >
            BoatCheckin
          </span>
        </Link>
      </nav>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 md:py-20">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.07] px-6 md:px-11 py-5 flex items-center justify-between flex-wrap gap-3">
        <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.25)', letterSpacing: '0.05em' }}>
          Oakmont Logic LLC · Wyoming, USA
        </p>
        <div className="flex items-center flex-wrap" style={{ gap: 'var(--s-2)' }}>
          {["ESIGN Act 2000", "UETA 47 States", "46 CFR §185.502", "GDPR"].map(
            (badge) => (
              <span
                key={badge}
                className="mono"
                style={{
                  fontSize: 'var(--t-mono-xs)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'rgba(244,239,230,0.3)',
                  border: '1px solid rgba(244,239,230,0.1)',
                  padding: '3px 8px',
                  borderRadius: 'var(--r-1)',
                }}
              >
                {badge}
              </span>
            )
          )}
        </div>
      </footer>
    </main>
  );
}
