'use client'

import { useState, useCallback, useTransition } from 'react'
import { Copy, Check, User, Building2, Phone, Mail, Link2 } from 'lucide-react'

interface AccountProfileFormProps {
  initialName: string
  initialCompany: string | null
  initialPhone: string | null
  referralCode: string | null
  email: string
}

export function AccountProfileForm({
  initialName, initialCompany, initialPhone,
  referralCode, email,
}: AccountProfileFormProps) {
  const [name, setName] = useState(initialName ?? '')
  const [company, setCompany] = useState(initialCompany ?? '')
  const [phone, setPhone] = useState(initialPhone ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const referralLink = referralCode
    ? `https://boatcheckin.com/signup?ref=${referralCode}`
    : null

  async function save() {
    setError('')
    setSaved(false)
    startTransition(async () => {
      try {
        const res = await fetch('/api/dashboard/operators/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: name.trim() || undefined,
            company_name: company.trim() || null,
            phone: phone.trim() || null,
          }),
        })
        const json = await res.json()
        if (!res.ok) {
          setError(json.error ?? 'Failed to save')
          return
        }
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch {
        setError('Connection error. Please try again.')
      }
    })
  }

  const copyReferral = useCallback(() => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }, [referralLink])

  const fieldStyle: React.CSSProperties = {
    width: '100%',
    height: 44,
    padding: '0 12px',
    background: 'var(--color-paper)',
    border: '1px solid var(--color-line)',
    borderRadius: 'var(--r-1)',
    fontSize: 14,
    color: 'var(--color-ink)',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 150ms',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 'var(--t-mono-xs)',
    fontWeight: 700,
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: 'var(--color-ink-muted)',
    marginBottom: 6,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-4)', paddingTop: 'var(--s-3)' }}>

      {/* Name */}
      <div>
        <label className="font-mono" style={labelStyle}>
          <User size={12} strokeWidth={2} /> Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          style={fieldStyle}
          maxLength={100}
          autoComplete="name"
        />
      </div>

      {/* Company */}
      <div>
        <label className="font-mono" style={labelStyle}>
          <Building2 size={12} strokeWidth={2} /> Company Name <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
        </label>
        <input
          type="text"
          value={company}
          onChange={e => setCompany(e.target.value)}
          style={fieldStyle}
          maxLength={100}
          placeholder="e.g. Miami Yacht Charters LLC"
          autoComplete="organization"
        />
      </div>

      {/* Phone */}
      <div>
        <label className="font-mono" style={labelStyle}>
          <Phone size={12} strokeWidth={2} /> Phone <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={fieldStyle}
          maxLength={30}
          placeholder="+1 305 000 0000"
          autoComplete="tel"
        />
      </div>

      {/* Email — read-only */}
      <div>
        <label className="font-mono" style={labelStyle}>
          <Mail size={12} strokeWidth={2} /> Email
        </label>
        <div
          style={{
            ...fieldStyle,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-bone)',
            color: 'var(--color-ink-muted)',
            cursor: 'not-allowed',
          }}
        >
          {email}
        </div>
        <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4 }}>
          Email changes require contacting support.
        </p>
      </div>

      {/* Referral code */}
      {referralLink && (
        <div>
          <label className="font-mono" style={labelStyle}>
            <Link2 size={12} strokeWidth={2} /> Referral Link
          </label>
          <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
            <div
              style={{
                ...fieldStyle,
                height: 44,
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                background: 'var(--color-bone)',
                color: 'var(--color-ink-muted)',
                fontSize: 12,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                cursor: 'default',
              }}
            >
              {referralLink}
            </div>
            <button
              onClick={copyReferral}
              className="btn btn--sm"
              style={{ flexShrink: 0, height: 44, minWidth: 44, justifyContent: 'center' }}
              title="Copy referral link"
            >
              {copied
                ? <Check size={14} strokeWidth={2.5} style={{ color: 'var(--color-status-ok)' }} />
                : <Copy size={14} strokeWidth={2} />
              }
            </button>
          </div>
          <p className="font-mono" style={{ fontSize: 11, color: 'var(--color-ink-muted)', marginTop: 4 }}>
            Share this link to invite other operators to BoatCheckin.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="alert alert--err">
          <span>{error}</span>
        </div>
      )}

      {/* Save */}
      <button
        onClick={save}
        disabled={isPending || !name.trim()}
        className="btn btn--rust"
        style={{ height: 44, justifyContent: 'center', opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save Profile'}
      </button>

    </div>
  )
}
