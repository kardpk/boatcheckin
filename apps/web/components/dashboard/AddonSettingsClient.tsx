'use client'

import { useState, useTransition } from 'react'
import { Package, Plus, Check, X, CreditCard, Landmark, Gift } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  food: 'Food', beverage: 'Beverage', gear: 'Gear', safety: 'Safety',
  experience: 'Experience', seasonal: 'Seasonal', other: 'Other', general: 'General',
}

const PAYMENT_MODES = [
  { value: 'external', label: 'External billing', desc: 'Log order + notify resort. No Stripe charge.', icon: Landmark },
  { value: 'stripe',   label: 'Stripe',           desc: 'Collect payment now. 3% platform fee.', icon: CreditCard },
  { value: 'free',     label: 'Complimentary',    desc: 'No charge. Addons included.', icon: Gift },
] as const

interface AddonRow {
  id: string; name: string; description: string | null; price_cents: number
  max_quantity: number; is_active: boolean; category: string
  prep_time_hours: number; cutoff_hours: number; is_seasonal: boolean
  seasonal_from: string | null; seasonal_until: string | null
  requires_staff_confirmation: boolean
}

interface Props {
  operatorId:   string
  addons:       AddonRow[]
  paymentMode:  string
  stripeConnected: boolean
}

const sty = {
  page:    { padding: '24px 16px 80px', fontFamily: 'var(--font-sans)', maxWidth: 640, margin: '0 auto' },
  heading: { fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' },
  kicker:  { fontSize: 12, color: 'var(--color-ink-secondary)', textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 4 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--color-ink-secondary)', fontWeight: 700, marginBottom: 12 },
  card:    { background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: 8 },
  row:     { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, padding: '14px 16px', gap: 12 },
  label:   { fontSize: 14, fontWeight: 600, color: 'var(--color-ink)' },
  sub:     { fontSize: 12, color: 'var(--color-ink-secondary)', marginTop: 2 },
  btn:     (active: boolean) => ({
    padding: '8px 14px', fontSize: 12, fontWeight: active ? 700 : 400,
    border: active ? '2px solid var(--color-rust)' : '1px solid var(--color-border)',
    background: active ? 'var(--color-rust)' : 'var(--color-bone)',
    color: active ? '#fff' : 'var(--color-ink)',
    cursor: 'pointer',
  }),
  addBtn: {
    display: 'flex' as const, alignItems: 'center' as const, gap: 8,
    padding: '12px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
    border: '1px dashed var(--color-border)', background: 'var(--color-bone)',
    color: 'var(--color-ink-secondary)', width: '100%',
  },
  input: {
    width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)',
    fontSize: 14, fontFamily: 'inherit', background: 'var(--color-bone)', outline: 'none',
    boxSizing: 'border-box' as const,
  },
}

export function AddonSettingsClient({ operatorId, addons: initialAddons, paymentMode: initialMode, stripeConnected }: Props) {
  const [addons, setAddons]       = useState<AddonRow[]>(initialAddons)
  const [mode, setMode]           = useState(initialMode)
  const [showForm, setShowForm]   = useState(false)
  const [, startTransition]       = useTransition()
  const [saving, setSaving]       = useState(false)

  // New addon form state
  const [form, setForm] = useState({ name: '', priceCents: 0, category: 'general', cutoffHours: 2, prepTimeHours: 0, isSeasonal: false, seasonalFrom: '', seasonalUntil: '' })

  async function savePaymentMode(newMode: string) {
    setMode(newMode)
    await fetch(`/api/dashboard/operators/payment-mode`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addonPaymentMode: newMode }),
    })
  }

  async function toggleAddon(id: string, currentActive: boolean) {
    await fetch(`/api/dashboard/addons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive }),
    })
    setAddons(prev => prev.map(a => a.id === id ? { ...a, is_active: !currentActive } : a))
  }

  async function createAddon() {
    if (!form.name.trim() || form.priceCents < 0) return
    setSaving(true)
    const res = await fetch('/api/dashboard/addons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:          form.name.trim(),
        priceCents:    Math.round(form.priceCents * 100),
        category:      form.category,
        cutoffHours:   form.cutoffHours,
        prepTimeHours: form.prepTimeHours,
        isSeasonal:    form.isSeasonal,
        seasonalFrom:  form.isSeasonal ? form.seasonalFrom : undefined,
        seasonalUntil: form.isSeasonal ? form.seasonalUntil : undefined,
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setAddons(prev => [...prev, { ...data, is_active: true, description: null, max_quantity: 4, prep_time_hours: form.prepTimeHours, cutoff_hours: form.cutoffHours, is_seasonal: form.isSeasonal, seasonal_from: form.seasonalFrom || null, seasonal_until: form.seasonalUntil || null, requires_staff_confirmation: false }])
      setShowForm(false)
      setForm({ name: '', priceCents: 0, category: 'general', cutoffHours: 2, prepTimeHours: 0, isSeasonal: false, seasonalFrom: '', seasonalUntil: '' })
    }
    setSaving(false)
  }

  return (
    <div style={sty.page}>
      <p style={sty.kicker}>Settings</p>
      <h1 style={sty.heading}>Add-On Menu</h1>
      <p style={{ fontSize: 14, color: 'var(--color-ink-secondary)', margin: '4px 0 28px' }}>
        Manage pre-trip add-ons available to guests, set categories, cutoff times, and seasonal windows.
      </p>

      {/* ── Payment mode ─────────────────────────────────────────────────── */}
      <div style={sty.section}>
        <p style={sty.sectionTitle}>Payment collection</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {PAYMENT_MODES.map(({ value, label, desc, icon: Icon }) => (
            <button key={value} onClick={() => savePaymentMode(value)} style={{
              ...sty.btn(mode === value),
              display: 'flex', alignItems: 'center', gap: 6, flexDirection: 'column' as const,
              padding: '12px 14px', minWidth: 130, textAlign: 'center' as const,
            }}>
              <Icon size={16} />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{label}</span>
              <span style={{ fontSize: 10, fontWeight: 400, opacity: .75 }}>{desc}</span>
            </button>
          ))}
        </div>
        {mode === 'stripe' && !stripeConnected && (
          <div style={{ background: '#fffbe6', border: '1px solid #e6c300', padding: '12px 16px', fontSize: 13, marginTop: 12 }}>
            Stripe account not connected. Add-on payments will not be collected until you link your Stripe account.{' '}
            <a href="/api/dashboard/stripe/connect" style={{ color: 'var(--color-rust)', fontWeight: 600 }}>Connect Stripe</a>
          </div>
        )}
      </div>

      {/* ── Addon list ─────────────────────────────────────────────────────── */}
      <div style={sty.section}>
        <p style={sty.sectionTitle}>Add-ons ({addons.length})</p>

        {addons.length === 0 && (
          <div style={{ ...sty.card, padding: '24px 16px', textAlign: 'center' as const, color: 'var(--color-ink-secondary)', fontSize: 14 }}>
            <Package size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
            No add-ons yet. Create your first one below.
          </div>
        )}

        {addons.map(addon => (
          <div key={addon.id} style={{ ...sty.card, opacity: addon.is_active ? 1 : 0.5 }}>
            <div style={sty.row}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={sty.label}>{addon.name}</div>
                <div style={sty.sub}>
                  {CATEGORY_LABELS[addon.category] ?? addon.category} &middot;{' '}
                  ${(addon.price_cents / 100).toFixed(2)}{' '}
                  {addon.cutoff_hours > 0 && `· ${addon.cutoff_hours}hr cutoff`}
                  {addon.is_seasonal && ' · SEASONAL'}
                  {!addon.is_active && ' · DISABLED'}
                </div>
              </div>
              <button
                onClick={() => startTransition(() => { toggleAddon(addon.id, addon.is_active) })}
                style={{
                  padding: '6px 12px', fontSize: 11, fontWeight: 700,
                  border: '1px solid var(--color-border)',
                  background: addon.is_active ? 'var(--color-bone)' : 'var(--color-surface)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                  color: addon.is_active ? 'var(--color-rust)' : 'var(--color-green)',
                }}
              >
                {addon.is_active ? <><X size={12} /> Disable</> : <><Check size={12} /> Enable</>}
              </button>
            </div>
          </div>
        ))}

        {/* Create form */}
        {showForm ? (
          <div style={{ ...sty.card, padding: 16 }}>
            <p style={{ ...sty.sectionTitle, marginBottom: 16 }}>New add-on</p>
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
              <input style={sty.input} placeholder="Name (e.g. Snorkel Package)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Price (USD)</label>
                  <input style={sty.input} type="number" min="0" step="0.01" value={form.priceCents} onChange={e => setForm(f => ({ ...f, priceCents: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Category</label>
                  <select style={sty.input} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Order cutoff (hours before dep.)</label>
                  <input style={sty.input} type="number" min="0" value={form.cutoffHours} onChange={e => setForm(f => ({ ...f, cutoffHours: Number(e.target.value) }))} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Prep time (hours)</label>
                  <input style={sty.input} type="number" min="0" value={form.prepTimeHours} onChange={e => setForm(f => ({ ...f, prepTimeHours: Number(e.target.value) }))} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="seasonal" checked={form.isSeasonal} onChange={e => setForm(f => ({ ...f, isSeasonal: e.target.checked }))} />
                <label htmlFor="seasonal" style={{ fontSize: 13, cursor: 'pointer' }}>Seasonal item</label>
              </div>
              {form.isSeasonal && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Available from</label>
                    <input style={sty.input} type="date" value={form.seasonalFrom} onChange={e => setForm(f => ({ ...f, seasonalFrom: e.target.value }))} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Available until</label>
                    <input style={sty.input} type="date" value={form.seasonalUntil} onChange={e => setForm(f => ({ ...f, seasonalUntil: e.target.value }))} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={createAddon} disabled={saving} style={{ ...sty.btn(true), flex: 1, padding: '12px' }}>
                  {saving ? 'Saving...' : 'Create add-on'}
                </button>
                <button onClick={() => setShowForm(false)} style={{ ...sty.btn(false), padding: '12px 20px' }}>Cancel</button>
              </div>
            </div>
          </div>
        ) : (
          <button style={sty.addBtn} onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add new item
          </button>
        )}
      </div>
    </div>
  )
}
