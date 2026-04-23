'use client'

import { useState, useTransition } from 'react'
import { ChevronLeft, Check, Info } from 'lucide-react'
import Link from 'next/link'

interface Prefs {
  default_requires_approval:  boolean
  review_request_delay_hours: number
  review_redirect_threshold:  number
  notify_on_guest_register:   boolean
  notify_on_trip_start:       boolean
  notify_on_trip_end:         boolean
  notify_on_weather_alert:    boolean
}

interface PreferencesClientProps {
  initialPrefs: Prefs
}

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      style={{
        width: 44, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
        background: checked ? 'var(--color-rust)' : 'var(--color-line)',
        position: 'relative', flexShrink: 0, transition: 'background 200ms',
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: checked ? 21 : 3,
        width: 20, height: 20, borderRadius: '50%',
        background: 'white',
        transition: 'left 200ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  )
}

function ToggleRow({ label, desc, checked, onChange, id }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--s-4)', padding: '13px 0', borderBottom: '1px solid var(--color-line-soft)' }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.2 }}>{label}</p>
        {desc && <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 2 }}>{desc}</p>}
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  )
}

function SectionKicker({ label }: { label: string }) {
  return (
    <div style={{ paddingBottom: 'var(--s-2)', marginBottom: 0, borderBottom: '1px solid var(--color-line-soft)', marginTop: 'var(--s-4)' }}>
      <span className="font-mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: 'var(--color-ink-muted)' }}>
        {label}
      </span>
    </div>
  )
}

export function PreferencesClient({ initialPrefs }: PreferencesClientProps) {
  const [prefs, setPrefs] = useState(initialPrefs)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function updatePref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function save() {
    setSaved(false)
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/dashboard/operators/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs),
        })
        const json = await res.json()
        if (!res.ok) { setError(json.error ?? 'Failed to save'); return }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch {
        setError('Connection error')
      }
    })
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px' }}>

      {/* Header */}
      <Link href="/dashboard/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--s-2)', color: 'var(--color-ink-muted)', fontSize: 13, textDecoration: 'none' }}>
        <ChevronLeft size={14} strokeWidth={2} /> More
      </Link>
      <h1 className="font-display" style={{ fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.0, marginBottom: 'var(--s-6)' }}>
        Platform Preferences
      </h1>

      {/* ── Trips ── */}
      <SectionKicker label="Trips" />
      <ToggleRow
        id="pref-requires-approval"
        label="Require guest approval by default"
        desc="New trips will require you to approve each guest before they can join"
        checked={prefs.default_requires_approval}
        onChange={v => updatePref('default_requires_approval', v)}
      />

      {/* ── Reviews ── */}
      <SectionKicker label="Reviews" />
      <div style={{ padding: '13px 0', borderBottom: '1px solid var(--color-line-soft)' }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', display: 'block', marginBottom: 6 }}>
          Review request delay
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
          <input
            type="number"
            min={0} max={48}
            value={prefs.review_request_delay_hours}
            onChange={e => updatePref('review_request_delay_hours', Math.max(0, Math.min(48, parseInt(e.target.value, 10) || 0)))}
            style={{ width: 72, height: 38, padding: '0 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--r-1)', background: 'var(--color-paper)', fontSize: 14, color: 'var(--color-ink)', fontFamily: 'inherit', outline: 'none' }}
          />
          <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>hours after trip ends</span>
        </div>
      </div>

      <div style={{ padding: '13px 0', borderBottom: '1px solid var(--color-line-soft)' }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-ink)', display: 'block', marginBottom: 6 }}>
          Redirect to external review platform when rating is at least
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
          <select
            value={prefs.review_redirect_threshold}
            onChange={e => updatePref('review_redirect_threshold', parseInt(e.target.value, 10))}
            style={{ height: 38, padding: '0 12px', border: '1px solid var(--color-line)', borderRadius: 'var(--r-1)', background: 'var(--color-paper)', fontSize: 13, color: 'var(--color-ink)', fontFamily: 'var(--font-mono)', outline: 'none', cursor: 'pointer' }}
          >
            {[4, 5].map(v => (
              <option key={v} value={v}>{v} star{v !== 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6 }}>
          <Info size={12} strokeWidth={2} style={{ color: 'var(--color-ink-muted)', flexShrink: 0, marginTop: 1 }} />
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)' }}>
            Configure the redirect URLs per boat in the Reviews section.
          </p>
        </div>
      </div>

      {/* ── Notifications ── */}
      <SectionKicker label="Notifications" />
      <ToggleRow id="pref-notify-register" label="Guest registers" desc="When a new guest joins a trip" checked={prefs.notify_on_guest_register} onChange={v => updatePref('notify_on_guest_register', v)} />
      <ToggleRow id="pref-notify-start"    label="Trip started"    desc="When captain starts a trip"    checked={prefs.notify_on_trip_start}     onChange={v => updatePref('notify_on_trip_start', v)} />
      <ToggleRow id="pref-notify-end"      label="Trip ended"      desc="When captain ends a trip"      checked={prefs.notify_on_trip_end}       onChange={v => updatePref('notify_on_trip_end', v)} />
      <ToggleRow id="pref-notify-weather"  label="Weather alerts"  desc="Severe weather near active trips" checked={prefs.notify_on_weather_alert} onChange={v => updatePref('notify_on_weather_alert', v)} />

      {error && (
        <div className="alert alert--err" style={{ marginTop: 'var(--s-4)' }}>
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={save}
        disabled={isPending}
        className="btn btn--rust"
        style={{ width: '100%', height: 48, justifyContent: 'center', marginTop: 'var(--s-6)', opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? 'Saving…' : saved ? <><Check size={15} strokeWidth={2.5} /> Saved</> : 'Save Preferences'}
      </button>
    </div>
  )
}
