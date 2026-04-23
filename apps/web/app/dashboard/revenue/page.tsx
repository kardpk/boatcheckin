import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { BarChart2, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react'
import { DashTile } from '@/components/ui/DashTile'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add-On Revenue — BoatCheckin' }

interface MonthRow {
  month:       string   // ISO month 'YYYY-MM-01'
  order_count: number
  gmv_cents:   number
  fee_cents:   number
}

interface CategoryRow {
  category:  string
  gmv_cents: number
}

function formatMoney(cents: number) {
  const safe = isNaN(cents) || !isFinite(cents) ? 0 : cents
  return `$${(safe / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function monthLabel(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  } catch { return iso.slice(0, 7) }
}

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food', beverage: 'Drinks', gear: 'Gear',
  safety: 'Safety', experience: 'Experience',
  seasonal: 'Seasonal', other: 'Other', general: 'General',
}

function safeMax(values: number[]): number {
  if (values.length === 0) return 1
  const filtered = values.filter(v => typeof v === 'number' && isFinite(v))
  return filtered.length === 0 ? 1 : Math.max(1, ...filtered)
}

export default async function RevenuePage() {
  const { operator } = await requireOperator()
  const supabase     = createServiceClient()

  // ── Monthly roll-up via RPC (optional — gracefully falls back to empty) ────
  // Uses try/catch because Supabase RPC resolves (not rejects) on errors,
  // so `.catch()` chaining does NOT work for missing functions.
  let monthlyRows: MonthRow[] = []
  try {
    const { data, error } = await supabase.rpc('addon_revenue_monthly', {
      p_operator_id: operator.id,
    })
    if (!error && Array.isArray(data)) {
      monthlyRows = (data as MonthRow[]).slice(0, 6)
    }
  } catch { /* RPC function may not exist yet — silently skip */ }

  // ── Order totals (current month) — simple direct query ───────────────────
  // NOTE: addons.category does not exist yet so we omit that join
  const thisMonth = new Date()
  thisMonth.setDate(1)
  const thisMonthIso = thisMonth.toISOString().slice(0, 10)

  let thisMonthOrders  = 0
  let thisMonthGmvCalc = 0

  try {
    const { data, error } = await supabase
      .from('guest_addon_orders')
      .select('total_cents, status')
      .eq('operator_id', operator.id)
      .gte('created_at', thisMonthIso)
      .limit(1000)

    if (!error && Array.isArray(data)) {
      const confirmed = data.filter(r => r.status === 'confirmed')
      thisMonthOrders  = confirmed.length
      thisMonthGmvCalc = confirmed.reduce((s, r) => s + (Number(r.total_cents) || 0), 0)
    }
  } catch { /* non-fatal */ }

  // ── All-time totals for context ───────────────────────────────────────────
  let allTimeGmv    = 0
  let allTimeOrders = 0
  try {
    const { data, error } = await supabase
      .from('guest_addon_orders')
      .select('total_cents')
      .eq('operator_id', operator.id)
      .eq('status', 'confirmed')
      .limit(5000)

    if (!error && Array.isArray(data)) {
      allTimeOrders = data.length
      allTimeGmv    = data.reduce((s, r) => s + (Number(r.total_cents) || 0), 0)
    }
  } catch { /* non-fatal */ }

  // ── KPI derivations ───────────────────────────────────────────────────────
  const currentMonthIsoKey = new Date().toISOString().slice(0, 7)
  const thisMonthRow = monthlyRows.find(r => r.month?.startsWith(currentMonthIsoKey))

  const thisMonthGmv    = thisMonthRow?.gmv_cents    ?? thisMonthGmvCalc
  const avgOrderValue   = thisMonthOrders > 0 ? Math.round(thisMonthGmv / thisMonthOrders) : 0
  const thisMonthFee    = thisMonthRow?.fee_cents     ?? Math.round(thisMonthGmv * 0.03)

  const categoryRows: CategoryRow[] = [] // category column not yet in schema — show empty

  const maxGmv = safeMax(monthlyRows.map(r => Number(r.gmv_cents) || 0))

  return (
    <div style={{ padding: 'var(--s-4)', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

      {/* ── Header ── */}
      <div>
        <h1
          className="font-display"
          style={{ fontSize: 'clamp(22px, 4vw, 30px)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-ink)', lineHeight: 1.1, margin: 0 }}
        >
          Add-On Revenue
        </h1>
        <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginTop: 5 }}>
          Monthly GMV and transaction report
        </p>
      </div>

      {/* ── KPI strip (2×2 grid) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--s-3)' }}>
        <DashTile
          variant="kpi"
          status="ok"
          label="Revenue this month"
          value={formatMoney(thisMonthGmv)}
          sub="confirmed orders"
          icon={<DollarSign size={14} strokeWidth={1.5} />}
        />
        <DashTile
          variant="kpi"
          status="brass"
          label="Orders this month"
          value={thisMonthOrders.toString()}
          sub="confirmed"
          icon={<ShoppingBag size={14} strokeWidth={1.5} />}
        />
        <DashTile
          variant="kpi"
          status="info"
          label="Avg order value"
          value={formatMoney(avgOrderValue)}
          sub="per order"
          icon={<TrendingUp size={14} strokeWidth={1.5} />}
        />
        <DashTile
          variant="kpi"
          status="grey"
          label="All-time revenue"
          value={formatMoney(allTimeGmv)}
          sub={`${allTimeOrders} orders`}
          icon={<BarChart2 size={14} strokeWidth={1.5} />}
        />
      </div>

      {/* 6-month bar chart — only if RPC is available */}
      {monthlyRows.length > 0 && (
        <div className="tile" style={{ padding: 'var(--s-5)', marginBottom: 'var(--s-6)' }}>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 16 }}>
            Last 6 months
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
            {[...monthlyRows].reverse().map(row => {
              const gmv     = Number(row.gmv_cents) || 0
              const pct     = maxGmv > 0 ? Math.round((gmv / maxGmv) * 100) : 0
              const current = row.month?.startsWith(currentMonthIsoKey)
              return (
                <div key={row.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 9, color: current ? 'var(--color-ink)' : 'var(--color-ink-muted)', fontWeight: 700 }}>
                    {formatMoney(gmv).split('.')[0]}
                  </span>
                  <div
                    style={{
                      width:        '100%',
                      height:       `${Math.max(4, pct)}%`,
                      background:   current ? 'var(--color-rust)' : 'var(--color-ink)',
                      opacity:      current ? 1 : 0.18,
                      borderRadius: '2px 2px 0 0',
                      transition:   'height 500ms',
                    }}
                  />
                  <span className="font-mono" style={{ fontSize: 9, color: current ? 'var(--color-ink)' : 'var(--color-ink-muted)', letterSpacing: '0.06em', fontWeight: current ? 700 : 400 }}>
                    {monthLabel(row.month ?? '').split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Category breakdown — only shown once addons.category column exists */}
      {categoryRows.length > 0 && (
        <div className="tile" style={{ padding: 'var(--s-5)' }}>
          <p className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 16 }}>
            By category — this month
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {categoryRows.map(row => {
              const maxCat = safeMax(categoryRows.map(r => r.gmv_cents))
              const pct = Math.round((row.gmv_cents / maxCat) * 100)
              return (
                <div key={row.category}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: 'var(--color-ink)' }}>
                      {CATEGORY_LABELS[row.category] ?? row.category}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-ink)' }}>
                      {formatMoney(row.gmv_cents)}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--color-bone)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-rust)', transition: 'width 500ms' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {thisMonthGmv === 0 && thisMonthOrders === 0 && allTimeOrders === 0 && (
        <div className="tile" style={{ padding: 'var(--s-10)', textAlign: 'center', borderStyle: 'dashed' }}>
          <BarChart2 size={28} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: 'var(--color-ink-muted)' }}>
            No confirmed add-on revenue yet.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 6 }}>
            Revenue appears here once guests place and pay for add-on orders.
          </p>
        </div>
      )}
    </div>
  )
}
