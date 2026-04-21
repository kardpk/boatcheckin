'use client'

import { useState } from 'react'
import { Tag, Plus, Trash2 } from 'lucide-react'

interface CodeRow {
  id: string; code: string; description: string | null
  discount_type: string; discount_value: number
  applicable_categories: string[] | null
  valid_from: string | null; valid_until: string | null
  max_uses: number | null; use_count: number
  boat_id: string | null; is_active: boolean
}

interface BoatOption { id: string; boat_name: string }

interface Props {
  operatorId: string
  codes:      CodeRow[]
  boats:      BoatOption[]
}

const sty = {
  page:    { padding: '24px 16px 80px', fontFamily: 'var(--font-sans)', maxWidth: 640, margin: '0 auto' },
  heading: { fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' },
  kicker:  { fontSize: 12, color: 'var(--color-ink-secondary)', textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 4 },
  card:    { background: 'var(--color-surface)', border: '1px solid var(--color-border)', marginBottom: 8 },
  row:     { display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, padding: '14px 16px', gap: 12 },
  label:   { fontSize: 14, fontWeight: 600, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)' },
  sub:     { fontSize: 12, color: 'var(--color-ink-secondary)', marginTop: 3 },
  addBtn:  { display: 'flex' as const, alignItems: 'center' as const, gap: 8, padding: '12px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px dashed var(--color-border)', background: 'var(--color-bone)', color: 'var(--color-ink-secondary)', width: '100%' },
  input:   { width: '100%', padding: '10px 12px', border: '1px solid var(--color-border)', fontSize: 14, fontFamily: 'inherit', background: 'var(--color-bone)', outline: 'none', boxSizing: 'border-box' as const },
  btn:     (primary: boolean) => ({ padding: '10px 16px', fontSize: 12, fontWeight: primary ? 700 : 400, border: primary ? 'none' : '1px solid var(--color-border)', background: primary ? 'var(--color-ink)' : 'var(--color-bone)', color: primary ? 'var(--color-bone)' : 'var(--color-ink)', cursor: 'pointer' }),
}

const ADDON_CATEGORIES = ['food','beverage','gear','safety','experience','seasonal','other','general']

function discountLabel(type: string, value: number) {
  if (type === 'percent')       return `${value}% off`
  if (type === 'fixed_cents')   return `$${(value / 100).toFixed(2)} off`
  if (type === 'unlock_addons') return 'Unlocks special items'
  return `${value}`
}

export function PropertyCodesClient({ codes: initialCodes, boats }: Props) {
  const [codes, setCodes]       = useState<CodeRow[]>(initialCodes)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percent', discountValue: 10,
    validFrom: '', validUntil: '', maxUses: '', boatId: '',
    selectedCategories: [] as string[],
  })

  function toggleCategory(cat: string) {
    setForm(f => ({
      ...f,
      selectedCategories: f.selectedCategories.includes(cat)
        ? f.selectedCategories.filter(c => c !== cat)
        : [...f.selectedCategories, cat],
    }))
  }

  async function createCode() {
    if (!form.code.trim()) return
    setSaving(true)
    const res = await fetch('/api/dashboard/property-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code:                 form.code.toUpperCase().trim(),
        description:          form.description || undefined,
        discountType:         form.discountType,
        discountValue:        form.discountType === 'percent' ? Number(form.discountValue) : Math.round(Number(form.discountValue) * 100),
        validFrom:            form.validFrom || undefined,
        validUntil:           form.validUntil || undefined,
        maxUses:              form.maxUses ? Number(form.maxUses) : undefined,
        boatId:               form.boatId || undefined,
        applicableCategories: form.selectedCategories.length > 0 ? form.selectedCategories : undefined,
      }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setCodes(prev => [{ ...data, applicable_categories: form.selectedCategories.length > 0 ? form.selectedCategories : null, valid_from: form.validFrom || null, valid_until: form.validUntil || null, max_uses: form.maxUses ? Number(form.maxUses) : null, use_count: 0, boat_id: form.boatId || null, description: form.description || null, is_active: true }, ...prev])
      setShowForm(false)
      setForm({ code: '', description: '', discountType: 'percent', discountValue: 10, validFrom: '', validUntil: '', maxUses: '', boatId: '', selectedCategories: [] })
    }
    setSaving(false)
  }

  async function deleteCode(id: string) {
    if (!confirm('Delete this code?')) return
    await fetch(`/api/dashboard/property-codes/${id}`, { method: 'DELETE' })
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  async function toggleCode(id: string, currentActive: boolean) {
    await fetch(`/api/dashboard/property-codes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !currentActive }),
    })
    setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !currentActive } : c))
  }

  return (
    <div style={sty.page}>
      <p style={sty.kicker}>Settings</p>
      <h1 style={sty.heading}>Property Codes</h1>
      <p style={{ fontSize: 14, color: 'var(--color-ink-secondary)', margin: '4px 0 28px' }}>
        Hotel, marina, and loyalty codes that unlock discounts for guests at the add-on step.
        Category-scoped discounts apply only to the specified addon categories.
      </p>

      {codes.length === 0 && !showForm && (
        <div style={{ ...sty.card, padding: '24px 16px', textAlign: 'center' as const, color: 'var(--color-ink-secondary)', fontSize: 14, marginBottom: 16 }}>
          <Tag size={24} style={{ margin: '0 auto 8px', display: 'block' }} />
          No property codes yet.
        </div>
      )}

      {codes.map(c => (
        <div key={c.id} style={{ ...sty.card, opacity: c.is_active ? 1 : 0.5 }}>
          <div style={sty.row}>
            <div style={{ flex: 1 }}>
              <div style={sty.label}>{c.code}</div>
              <div style={sty.sub}>
                {discountLabel(c.discount_type, c.discount_value)}
                {c.description && ` · ${c.description}`}
                {c.applicable_categories?.length && ` · ${c.applicable_categories.join(', ')} only`}
                {c.valid_until && ` · Expires ${c.valid_until}`}
                {c.max_uses && ` · ${c.use_count}/${c.max_uses} uses`}
                {c.boat_id && ` · Specific boat`}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => toggleCode(c.id, c.is_active)} style={sty.btn(false)}>
                {c.is_active ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => deleteCode(c.id)} style={{ ...sty.btn(false), color: 'var(--color-rust)', borderColor: 'transparent' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {showForm ? (
        <div style={{ ...sty.card, padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--color-ink-secondary)', fontWeight: 700, marginBottom: 16 }}>New property code</p>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
            <div>
              <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Code (guest types this in)</label>
              <input style={sty.input} placeholder="e.g. HOTEL2026" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Description (internal)</label>
              <input style={sty.input} placeholder="Hotel guest rate, Marina member..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Discount type</label>
                <select style={sty.input} value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}>
                  <option value="percent">Percent off</option>
                  <option value="fixed_cents">Fixed amount off</option>
                  <option value="unlock_addons">Unlock special items</option>
                </select>
              </div>
              {form.discountType !== 'unlock_addons' && (
                <div style={{ flex: 1 }}>
                  <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>
                    {form.discountType === 'percent' ? 'Percent (1–100)' : 'Amount (USD)'}
                  </label>
                  <input style={sty.input} type="number" min="0" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} />
                </div>
              )}
            </div>

            {/* Category scope */}
            <div>
              <label style={{ ...sty.sub, display: 'block', marginBottom: 8 }}>Apply to categories (leave blank for all)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                {ADDON_CATEGORIES.map(cat => {
                  const active = form.selectedCategories.includes(cat)
                  return (
                    <button key={cat} onClick={() => toggleCategory(cat)} style={{
                      padding: '5px 10px', fontSize: 11, fontWeight: active ? 700 : 400,
                      border: active ? '1px solid var(--color-ink)' : '1px solid var(--color-border)',
                      background: active ? 'var(--color-ink)' : 'var(--color-bone)',
                      color: active ? 'var(--color-bone)' : 'var(--color-ink)',
                      cursor: 'pointer', textTransform: 'capitalize' as const,
                    }}>{cat}</button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Valid from</label>
                <input style={sty.input} type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Valid until</label>
                <input style={sty.input} type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Max uses (blank = unlimited)</label>
                <input style={sty.input} type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} />
              </div>
              {boats.length > 0 && (
                <div style={{ flex: 1 }}>
                  <label style={{ ...sty.sub, display: 'block', marginBottom: 4 }}>Limit to boat (optional)</label>
                  <select style={sty.input} value={form.boatId} onChange={e => setForm(f => ({ ...f, boatId: e.target.value }))}>
                    <option value="">All boats</option>
                    {boats.map(b => <option key={b.id} value={b.id}>{b.boat_name}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={createCode} disabled={saving} style={{ ...sty.btn(true), flex: 1, padding: '12px' }}>
                {saving ? 'Saving...' : 'Create code'}
              </button>
              <button onClick={() => setShowForm(false)} style={{ ...sty.btn(false), padding: '12px 20px' }}>Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <button style={sty.addBtn} onClick={() => setShowForm(true)}>
          <Plus size={16} /> Add property code
        </button>
      )}
    </div>
  )
}
