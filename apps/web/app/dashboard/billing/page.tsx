import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'
import { CreditCard, CheckCircle, AlertCircle, Zap, Ship } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Billing — BoatCheckin' }

function planLabel(tier: string | null | undefined) {
  const map: Record<string, string> = {
    solo: 'Solo', captain: 'Captain', fleet: 'Fleet', marina: 'Marina',
  }
  return map[tier ?? ''] ?? 'Solo'
}

function statusProps(status: string | null | undefined) {
  if (status === 'active')    return { label: 'Active', cls: 'pill pill--ok' }
  if (status === 'trial')     return { label: 'Trial', cls: 'pill pill--warn' }
  if (status === 'paused')    return { label: 'Paused', cls: 'pill pill--ghost' }
  if (status === 'cancelled') return { label: 'Cancelled', cls: 'pill pill--err' }
  return { label: 'Free', cls: 'pill' }
}

export default async function BillingPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: opRow } = await supabase
    .from('operators')
    .select('subscription_tier, subscription_status, trial_ends_at, max_boats, stripe_connect_onboarded, stripe_connect_account_id')
    .eq('id', operator.id)
    .single()

  const tier      = (opRow?.subscription_tier as string | null) ?? 'solo'
  const status    = (opRow?.subscription_status as string | null) ?? 'trial'
  const trialEnd  = opRow?.trial_ends_at as string | null
  const maxBoats  = (opRow?.max_boats as number | null) ?? 1
  const stripeConnected = !!(opRow?.stripe_connect_onboarded)

  const { label: statusLabel, cls: statusCls } = statusProps(status)

  let trialDays: number | null = null
  if (status === 'trial' && trialEnd) {
    trialDays = Math.ceil((new Date(trialEnd).getTime() - Date.now()) / 86_400_000)
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

      {/* Header */}
      <div>
        <div className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Account
        </div>
        <h1 className="font-display" style={{ fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.0, margin: 0 }}>
          Subscription &amp; Billing
        </h1>
      </div>

      {/* Trial banner */}
      {status === 'trial' && trialDays !== null && trialDays > 0 && (
        <div className="alert alert--warn">
          <AlertCircle size={16} strokeWidth={2} />
          <div>
            <strong style={{ fontSize: 13 }}>{trialDays} day{trialDays !== 1 ? 's' : ''} left on your trial.</strong>
            <p style={{ fontSize: 12, marginTop: 2 }}>Upgrade to continue using BoatCheckin after your trial ends.</p>
          </div>
        </div>
      )}
      {status === 'trial' && (trialDays === null || trialDays <= 0) && (
        <div className="alert alert--err">
          <AlertCircle size={16} strokeWidth={2} />
          <strong style={{ fontSize: 13 }}>Your trial has expired.</strong>
        </div>
      )}

      {/* Plan tile */}
      <div className="tile" style={{ padding: 'var(--s-5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-4)' }}>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
            Current Plan
          </p>
          <span className={statusCls} style={{ fontSize: 'var(--t-mono-xs)' }}>{statusLabel}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--s-3)', marginBottom: 'var(--s-5)' }}>
          {[
            { label: 'Plan', value: planLabel(tier), icon: <Zap size={13} strokeWidth={1.5} /> },
            { label: 'Fleet limit', value: `${maxBoats} boat${maxBoats !== 1 ? 's' : ''}`, icon: <Ship size={13} strokeWidth={1.5} /> },
          ].map(item => (
            <div key={item.label} style={{ background: 'var(--color-bone)', borderRadius: 'var(--r-1)', padding: 'var(--s-3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--color-ink-muted)' }}>
                {item.icon}
                <span className="font-mono" style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{item.label}</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-ink)' }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Manage plan CTA */}
        <Link
          href="/api/billing"
          className="btn btn--rust"
          style={{ display: 'flex', height: 48, justifyContent: 'center', alignItems: 'center', gap: 'var(--s-2)', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}
        >
          <CreditCard size={16} strokeWidth={2} />
          {status === 'active' ? 'Manage Subscription' : 'Upgrade Plan'}
        </Link>
        <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', textAlign: 'center', marginTop: 'var(--s-2)' }}>
          Invoices, payment method, and plan changes handled securely by Stripe.
        </p>
      </div>

      {/* Stripe Connect for add-ons */}
      <div className="tile" style={{ padding: 'var(--s-5)', borderStyle: stripeConnected ? 'solid' : 'dashed' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-3)' }}>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)' }}>
            Add-on Payments
          </p>
          {stripeConnected
            ? <span className="pill pill--ok"><CheckCircle size={10} strokeWidth={2} /> Connected</span>
            : <span className="pill pill--ghost">Not connected</span>
          }
        </div>
        <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, marginBottom: stripeConnected ? 0 : 'var(--s-4)' }}>
          {stripeConnected
            ? 'Stripe Express is connected. Guests can pay for add-ons online and you receive payouts directly.'
            : 'Connect Stripe Express to accept online add-on payments from guests. Payouts are sent directly to your bank account.'
          }
        </p>
        {!stripeConnected && (
          <Link
            href="/api/dashboard/stripe/connect"
            className="btn"
            style={{ display: 'inline-flex', height: 40, alignItems: 'center', gap: 'var(--s-2)', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
          >
            Connect Stripe
          </Link>
        )}
      </div>
    </div>
  )
}
