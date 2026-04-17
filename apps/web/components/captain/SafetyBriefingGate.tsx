'use client'

import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import type { BriefingTopic } from '@/types'

// ─── Types ───────────────────────────────────────────────────────────────────

export type BriefingType =
  | 'full_verbal'
  | 'abbreviated_with_cards'
  | 'pa_announcement'
  | 'reduced_private'

export interface BriefingAttestation {
  type: BriefingType
  topicsCovered: string[]
  signature: string
  confirmedAt: string
}

interface SafetyBriefingGateProps {
  boatName: string
  captainName: string
  tripDate: string
  guestCount: number
  briefingTopics: BriefingTopic[]
  complianceLevel: string
  token: string
  onConfirmed: (attestation: BriefingAttestation) => void
  onCancel: () => void
  /** Grace period: allow skipping with warning */
  allowSkip?: boolean
  onSkip?: () => void
}

const BRIEFING_TYPES: { id: BriefingType; icon: string; label: string; desc: string }[] = [
  {
    id: 'full_verbal',
    icon: '🎤',
    label: 'Full Verbal Briefing',
    desc: 'Spoke directly to all passengers',
  },
  {
    id: 'abbreviated_with_cards',
    icon: 'clipboard',
    label: 'Abbreviated + Cards',
    desc: 'Distributed safety cards with brief announcement',
  },
  {
    id: 'pa_announcement',
    icon: '📢',
    label: 'PA Announcement',
    desc: 'Safety announcement via PA system',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function SafetyBriefingGate({
  boatName,
  captainName,
  tripDate,
  guestCount,
  briefingTopics,
  complianceLevel,
  token,
  onConfirmed,
  onCancel,
  allowSkip = false,
  onSkip,
}: SafetyBriefingGateProps) {
  const [selectedType, setSelectedType] = useState<BriefingType | null>(null)
  const [checkedTopics, setCheckedTopics] = useState<Set<string>>(new Set())
  const [signature, setSignature] = useState(captainName)
  const [isSaving, setIsSaving] = useState(false)
  const [showSkipWarning, setShowSkipWarning] = useState(false)

  const requiredTopics = useMemo(
    () => briefingTopics.filter(t => t.required),
    [briefingTopics]
  )

  const allRequiredChecked = useMemo(
    () => requiredTopics.every(t => checkedTopics.has(t.id)),
    [requiredTopics, checkedTopics]
  )

  const canConfirm = selectedType && allRequiredChecked && signature.trim().length >= 2

  function toggleTopic(id: string) {
    setCheckedTopics(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = useCallback(async () => {
    if (!canConfirm || isSaving) return
    setIsSaving(true)

    const attestation: BriefingAttestation = {
      type: selectedType!,
      topicsCovered: Array.from(checkedTopics),
      signature: signature.trim(),
      confirmedAt: new Date().toISOString(),
    }

    // Pre-save to API (non-blocking on failure)
    try {
      await fetch(`/api/captain/${token}/briefing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attestation),
      })
    } catch {
      // Non-fatal — attestation will be sent again with trip start
    }

    setIsSaving(false)
    onConfirmed(attestation)
  }, [canConfirm, isSaving, selectedType, checkedTopics, signature, token, onConfirmed])

  // ─── Skip Warning Overlay ─────────────────────────────────────
  if (showSkipWarning) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-paper)' }}>
        <div style={{ background: 'var(--color-status-err)', padding: 'var(--s-6) var(--s-5) var(--s-5)' }}>
          <h1 className="font-display" style={{ fontSize: 'var(--t-card)', fontWeight: 500, color: 'var(--color-bone)', letterSpacing: '-0.025em' }}>
            Skip Safety Briefing?
          </h1>
        </div>
        <div className="flex-1" style={{ padding: 'var(--s-6) var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-4)' }}>
          <div className="alert alert--warn" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <p style={{ fontWeight: 700, fontSize: 'var(--t-body-md)', marginBottom: 'var(--s-2)', color: 'var(--color-status-warn)' }}>
              Legal Exposure Warning
            </p>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.6 }}>
              By skipping the safety briefing confirmation, you acknowledge that:
            </p>
            <ul className="list" style={{ marginTop: 'var(--s-2)' }}>
              <li>No digital record will exist proving a safety orientation was given</li>
              <li>The USCG manifest will show &quot;Safety Briefing: NOT CONFIRMED&quot;</li>
              <li>This may affect insurance claims in the event of an incident</li>
            </ul>
            <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginTop: 'var(--s-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              This skip option will be removed in a future update.
            </p>
          </div>

          <div className="flex" style={{ gap: 'var(--s-3)' }}>
            <button
              onClick={() => setShowSkipWarning(false)}
              className="btn flex-1"
              style={{ height: '52px', justifyContent: 'center' }}
            >
              ← Go Back
            </button>
            <button
              onClick={() => onSkip?.()}
              className="btn btn--danger flex-1"
              style={{ height: '52px', justifyContent: 'center' }}
            >
              Skip Anyway
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── Main UI ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-paper)' }}>

      {/* Header */}
      <div style={{ background: 'var(--color-ink)', padding: 'var(--s-6) var(--s-5) var(--s-5)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--s-3)' }}>
          <button
            onClick={onCancel}
            className="btn btn--ghost btn--sm"
            style={{ color: 'rgba(244,239,230,0.7)', paddingLeft: 0 }}
          >
            ← Back
          </button>
          <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', letterSpacing: '0.15em', color: 'rgba(244,239,230,0.4)', fontWeight: 600, textTransform: 'uppercase' }}>
            46 CFR §185.506
          </span>
        </div>
        <div className="flex items-center" style={{ gap: 'var(--s-3)', marginBottom: 'var(--s-2)' }}>
          <span style={{ color: 'var(--color-brass)' }}><svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg></span>
          <div>
            <h1 className="font-display" style={{ fontSize: 'var(--t-card)', fontWeight: 500, color: 'var(--color-bone)', letterSpacing: '-0.025em' }}>
              Safety Briefing Confirmation
            </h1>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'rgba(244,239,230,0.65)', marginTop: '2px' }}>
              Confirm you&apos;ve verbally briefed all {guestCount} passenger{guestCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'rgba(244,239,230,0.4)' }}>
          {boatName} · {tripDate}
          {complianceLevel === 'full' && ' · FULL COMPLIANCE'}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

        {/* Step 1: Briefing Type */}
        <div>
          <h2 className="mono" style={{ fontSize: 'var(--t-mono-sm)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-3)' }}>
            Step 1 — How did you brief?
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
            {BRIEFING_TYPES.map(bt => (
              <button
                key={bt.id}
                onClick={() => setSelectedType(bt.id)}
                className={cn(
                  'tile tile--hover text-left',
                  selectedType === bt.id && 'tile--featured'
                )}
                style={selectedType === bt.id ? {
                  borderColor: 'var(--color-rust)',
                  background: 'var(--color-bone-warm)',
                } : {}}
              >
                <div className="flex items-center" style={{ gap: 'var(--s-3)' }}>
                  <div>
                    <p style={{
                      fontSize: 'var(--t-body-sm)',
                      fontWeight: 600,
                      color: selectedType === bt.id ? 'var(--color-rust)' : 'var(--color-ink)',
                    }}>
                      {bt.label}
                    </p>
                    <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: '2px' }}>{bt.desc}</p>
                  </div>
                  {selectedType === bt.id && (
                    <span style={{ marginLeft: 'auto', color: 'var(--color-rust)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Topic Checklist */}
        <div>
          <h2 className="mono" style={{ fontSize: 'var(--t-mono-sm)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-3)' }}>
            Step 2 — Topics Covered
          </h2>
          <div style={{ background: 'var(--color-bone)', borderRadius: 'var(--r-1)', border: '1px solid var(--color-line-soft)', padding: 'var(--s-4)' }}>
            {briefingTopics.map(topic => (
              <label
                key={topic.id}
                className="check"
                style={{ padding: 'var(--s-3) 0', borderBottom: '1px dashed var(--color-line-soft)', display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)', cursor: 'pointer' }}
              >
                <div
                  onClick={() => toggleTopic(topic.id)}
                  className={cn(
                    'check-box',
                    checkedTopics.has(topic.id) && 'bg-[var(--color-rust)] border-[var(--color-rust)]'
                  )}
                  style={checkedTopics.has(topic.id) ? { background: 'var(--color-rust)', borderColor: 'var(--color-rust)' } : {}}
                >
                  {checkedTopics.has(topic.id) && (
                    <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: 'var(--t-body-sm)',
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: checkedTopics.has(topic.id) ? 'var(--color-ink-muted)' : 'var(--color-ink)',
                    textDecoration: checkedTopics.has(topic.id) ? 'line-through' : 'none',
                  }}>
                    {topic.label}
                    {topic.required && <span style={{ color: 'var(--color-status-err)', marginLeft: '4px' }}>*</span>}
                  </p>
                  <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: '2px' }}>{topic.description}</p>
                </div>
                <span className="badge badge--brass" style={{ flexShrink: 0, marginTop: '2px' }}>
                  {topic.cfrRef}
                </span>
              </label>
            ))}
            <div className="flex items-center justify-between" style={{ marginTop: 'var(--s-3)' }}>
              <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.08em' }}>
                {checkedTopics.size} / {briefingTopics.length} confirmed
              </span>
              {allRequiredChecked && (
                <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, color: 'var(--color-status-ok)', letterSpacing: '0.08em' }}>
                  All required topics covered
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Step 3: Captain Attestation */}
        <div>
          <h2 className="mono" style={{ fontSize: 'var(--t-mono-sm)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-3)' }}>
            Step 3 — Captain Attestation
          </h2>
          <div style={{ background: 'var(--color-bone)', borderRadius: 'var(--r-1)', border: '1px solid var(--color-line-soft)', padding: 'var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-3)' }}>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.7, fontStyle: 'italic' }}>
              &ldquo;I, <strong>{signature || '___'}</strong>, attest that I have verbally
              delivered the required safety orientation to all{' '}
              <strong>{guestCount} passenger{guestCount !== 1 ? 's' : ''}</strong>{' '}
              aboard <strong>{boatName}</strong> prior to departure, in
              compliance with 46 CFR §185.506.&rdquo;
            </p>

            <div className="field">
              <label className="field-label">Your signature (type your name)</label>
              <input
                type="text"
                value={signature}
                onChange={e => setSignature(e.target.value)}
                placeholder="Captain name"
                className="field-input"
                style={{ fontFamily: 'var(--font-satisfy, var(--font-display))', fontSize: '20px', color: 'var(--color-ink)' }}
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="form-actions" style={{ flexDirection: 'column', gap: 'var(--s-2)' }}>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm || isSaving}
          className={cn(
            'btn w-full',
            canConfirm ? 'btn--rust' : ''
          )}
          style={{ height: '56px', justifyContent: 'center', fontSize: 'var(--t-body-md)', fontWeight: 600 }}
        >
          {isSaving ? (
            <AnchorLoader size="sm" color="white" />
          ) : canConfirm ? (
            'Confirm Briefing & Proceed'
          ) : (
            'Complete all steps above'
          )}
        </button>

        {/* Grace period skip */}
        {allowSkip && (
          <button
            onClick={() => setShowSkipWarning(true)}
            className="btn btn--ghost w-full"
            style={{ fontSize: 'var(--t-body-sm)', justifyContent: 'center' }}
          >
            Skip for now (not recommended)
          </button>
        )}
      </div>
    </div>
  )
}
