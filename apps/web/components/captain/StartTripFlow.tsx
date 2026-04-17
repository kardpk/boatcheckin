'use client'

import { useState, useMemo } from 'react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import { formatTripDate, formatTime } from '@/lib/utils/format'
import { SlideToConfirm } from '@/components/ui/SlideToConfirm'
import { getComplianceRules, isPartyBoatTriggered } from '@/lib/compliance/rules'
import type { CaptainSnapshotData } from '@/types'
import type { BriefingAttestation } from './SafetyBriefingGate'

interface StartTripFlowProps {
  snapshot: CaptainSnapshotData
  token: string
  onStarted: (result: { startedAt: string; buoyPolicyId: string | null }) => void
  onCancel: () => void
  briefingAttestation?: BriefingAttestation | null
}

const CHECKLIST_ITEMS = [
  { id: 'guests', label: 'All guests accounted for' },
  { id: 'jackets', label: 'Life jackets accessible and located' },
  { id: 'weather', label: 'Weather conditions are acceptable' },
  { id: 'manifest', label: 'Passenger manifest downloaded or accessible' },
] as const

type ChecklistId = typeof CHECKLIST_ITEMS[number]['id']

export function StartTripFlow({
  snapshot, token, onStarted, onCancel, briefingAttestation,
}: StartTripFlowProps) {
  const [checked, setChecked] = useState<Set<ChecklistId>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [sliderComplete, setSliderComplete] = useState(false)
  const [hasPartyBoatLicense, setHasPartyBoatLicense] = useState(false)

  const unsignedGuests = snapshot.guests.filter(g => !g.waiverSigned)
  const allChecked = checked.size === CHECKLIST_ITEMS.length

  const complianceRules = useMemo(
    () => getComplianceRules(snapshot.stateCode, snapshot.boatType, snapshot.charterType),
    [snapshot.stateCode, snapshot.boatType, snapshot.charterType]
  )
  const partyBoatTriggered = useMemo(
    () => isPartyBoatTriggered(complianceRules, snapshot.lengthFt, snapshot.guests.length),
    [complianceRules, snapshot.lengthFt, snapshot.guests.length]
  )
  const canSlide = allChecked && (!partyBoatTriggered || hasPartyBoatLicense)

  function toggleCheck(id: ChecklistId) {
    setChecked(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleSliderComplete() {
    if (!canSlide) return
    setSliderComplete(true)
    setShowConfirm(true)
  }

  async function confirmStart() {
    setIsStarting(true)
    setStartError('')
    try {
      const res = await fetch(`/api/trips/${snapshot.slug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          snapshotToken: token,
          captainName: snapshot.captainName,
          confirmedGuestCount: snapshot.guests.length,
          checklistConfirmed: true,
          briefingAttestation: briefingAttestation ?? undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        setStartError(json.error ?? 'Failed to start trip')
        setSliderComplete(false)
        setShowConfirm(false)
        return
      }
      onStarted({ startedAt: json.data.startedAt, buoyPolicyId: json.data.buoyPolicyId })
    } catch {
      setStartError('Connection error. Please try again.')
      setSliderComplete(false)
      setShowConfirm(false)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-paper)' }}>

      {/* Header — ink bg matching captain snapshot */}
      <div style={{ background: 'var(--color-ink)', padding: 'var(--s-6) var(--s-5) var(--s-5)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--s-3)' }}>
          <button
            onClick={onCancel}
            className="btn btn--ghost btn--sm"
            style={{ color: 'rgba(244,239,230,0.7)', paddingLeft: 0 }}
          >
            ← Back
          </button>
          <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', letterSpacing: '0.15em', color: 'rgba(244,239,230,0.4)', textTransform: 'uppercase', fontWeight: 600 }}>
            Pre-Departure
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: 'var(--t-card)', fontWeight: 500, letterSpacing: '-0.025em', color: 'var(--color-bone)', marginBottom: 'var(--s-1)' }}>
          Ready to depart?
        </h1>
        <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'rgba(244,239,230,0.6)' }}>
          {snapshot.boatName} · {formatTripDate(snapshot.tripDate)} · {formatTime(snapshot.departureTime)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--s-5)', display: 'flex', flexDirection: 'column', gap: 'var(--s-5)' }}>

        {/* Unsigned waiver warning */}
        {unsignedGuests.length > 0 && (
          <div className="alert alert--warn" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <strong style={{ fontSize: 'var(--t-body-sm)' }}>
              {unsignedGuests.length} guest{unsignedGuests.length !== 1 ? 's' : ''} {unsignedGuests.length !== 1 ? 'have' : 'has'} not signed the waiver
            </strong>
            <ul style={{ margin: 'var(--s-2) 0 0', paddingLeft: 'var(--s-4)', listStyle: 'disc' }}>
              {unsignedGuests.map(g => (
                <li key={g.id} className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink)' }}>{g.fullName}</li>
              ))}
            </ul>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginTop: 'var(--s-2)' }}>
              You may still proceed. Record this in your log.
            </p>
          </div>
        )}

        {/* Pre-departure checklist */}
        <div className="tile" style={{ padding: 'var(--s-5)' }}>
          <h2 style={{ fontSize: 'var(--t-body-lg)', fontWeight: 600, color: 'var(--color-ink)', marginBottom: 'var(--s-1)' }}>
            Pre-departure checklist
          </h2>
          <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', marginBottom: 'var(--s-4)' }}>
            Confirm each item before sliding to start.
          </p>
          <div>
            {CHECKLIST_ITEMS.map(item => (
              <label
                key={item.id}
                className="flex items-center"
                style={{ gap: 'var(--s-3)', padding: 'var(--s-3) 0', cursor: 'pointer', minHeight: 48, borderBottom: '1px dashed var(--color-line-soft)' }}
              >
                <div
                  onClick={() => toggleCheck(item.id)}
                  className={cn(
                    'check-box flex-shrink-0',
                    checked.has(item.id) && 'bg-[var(--color-rust)] border-[var(--color-rust)]'
                  )}
                  style={checked.has(item.id) ? { background: 'var(--color-rust)', borderColor: 'var(--color-rust)' } : {}}
                >
                  {checked.has(item.id) && (
                    <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span style={{
                  fontSize: 'var(--t-body-md)',
                  lineHeight: 1.35,
                  color: checked.has(item.id) ? 'var(--color-ink-muted)' : 'var(--color-ink)',
                  textDecoration: checked.has(item.id) ? 'line-through' : 'none',
                }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between" style={{ marginTop: 'var(--s-4)' }}>
            <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', letterSpacing: '0.08em' }}>
              {checked.size} / {CHECKLIST_ITEMS.length} confirmed
            </span>
            {allChecked && (
              <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, color: 'var(--color-status-ok)', letterSpacing: '0.08em' }}>
                All confirmed
              </span>
            )}
          </div>
        </div>

        {/* Passenger count KPI */}
        <div className="kpi tile" style={{ textAlign: 'center', padding: 'var(--s-5)' }}>
          <p className="kpi-label">Passengers on board</p>
          <p className="kpi-value" style={{ fontSize: 'var(--t-sub)' }}>{snapshot.guests.length}</p>
        </div>

        {/* Texas Party Boat Act Attestation */}
        {partyBoatTriggered && (
          <div className="alert alert--warn" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <h4 className="mono" style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-status-warn)', marginBottom: 'var(--s-2)' }}>
              Texas Party Boat Act Triggered
            </h4>
            <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.6, marginBottom: 'var(--s-4)' }}>
              This vessel exceeds 30ft and is carrying more than 6 passengers.
              Texas Water Safety Act requires an annual TPWD inspection and a licensed operator.
            </p>
            <label className="flex items-start" style={{ gap: 'var(--s-3)', cursor: 'pointer' }}>
              <div className="mt-0.5 flex-shrink-0">
                <div
                  onClick={() => setHasPartyBoatLicense(!hasPartyBoatLicense)}
                  className="check-box"
                  style={hasPartyBoatLicense ? { background: 'var(--color-brass)', borderColor: 'var(--color-brass)' } : {}}
                >
                  {hasPartyBoatLicense && (
                    <svg width="10" height="8" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.6 }}>
                I certify under penalty of law that I hold a valid Texas Party Boat
                Operator License and this vessel displays a current TPWD inspection decal.
              </span>
            </label>
          </div>
        )}

        {/* Error */}
        {startError && (
          <div className="alert alert--err">
            <span>{startError}</span>
          </div>
        )}
      </div>

      {/* Slider CTA */}
      <div style={{ padding: 'var(--s-4) var(--s-5) var(--s-10)', background: 'var(--color-paper)', borderTop: '1px solid var(--color-line-soft)' }}>
        {canSlide ? (
          <SlideToConfirm
            label="SLIDE TO START TRIP"
            onComplete={handleSliderComplete}
            disabled={isStarting}
            color="teal"
          />
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: '100%', height: 64,
              borderRadius: 'var(--r-1)',
              background: 'var(--color-bone)',
              border: '1px solid var(--color-line)',
            }}
          >
            <span className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', fontWeight: 600 }}>
              {!allChecked ? 'Complete checklist to continue' : 'Complete compliance attestation above'}
            </span>
          </div>
        )}
      </div>

      {/* Confirmation bottom sheet */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(11,30,45,0.55)' }}>
          <div style={{ width: '100%', background: 'var(--color-paper)', borderTopLeftRadius: 'var(--r-1)', borderTopRightRadius: 'var(--r-1)', padding: 'var(--s-6) var(--s-6) var(--s-10)' }}>
            <div style={{ width: 40, height: 3, background: 'var(--color-line)', borderRadius: 2, margin: '0 auto var(--s-5)' }} />

            <h2 className="font-display" style={{ fontSize: 'var(--t-tile)', fontWeight: 500, color: 'var(--color-ink)', marginBottom: 'var(--s-2)' }}>
              Starting trip
            </h2>
            <p style={{ fontSize: 'var(--t-body-md)', color: 'var(--color-ink)', fontWeight: 500 }}>{snapshot.boatName}</p>
            <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)', margin: 'var(--s-1) 0 var(--s-5)' }}>
              {formatTripDate(snapshot.tripDate)} · {formatTime(snapshot.departureTime)} · {snapshot.guests.length} passengers
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)', marginBottom: 'var(--s-6)' }}>
              {[
                'Trip status set to Active',
                'Insurance policy activated via Buoy API',
                'Departure timestamp logged (USCG)',
                'Guests notified on their phones',
              ].map(item => (
                <div key={item} className="flex items-center" style={{ gap: 'var(--s-2)' }}>
                  <span style={{ color: 'var(--color-status-ok)', fontWeight: 700, fontSize: '13px' }}>✓</span>
                  <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)' }}>{item}</span>
                </div>
              ))}
            </div>

            <div className="flex" style={{ gap: 'var(--s-3)' }}>
              <button
                onClick={() => { setShowConfirm(false); setSliderComplete(false) }}
                disabled={isStarting}
                className="btn flex-1"
                style={{ height: 56, justifyContent: 'center' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                disabled={isStarting}
                className="btn btn--rust flex-1"
                style={{ height: 56, justifyContent: 'center', fontSize: 'var(--t-body-md)', fontWeight: 600 }}
              >
                {isStarting ? <AnchorLoader size="sm" color="white" /> : 'Start now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
