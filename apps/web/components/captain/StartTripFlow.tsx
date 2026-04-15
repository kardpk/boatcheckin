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

  // Texas Party Boat Act: Dynamic trigger based on state, length, and guest count
  const complianceRules = useMemo(
    () => getComplianceRules(snapshot.stateCode, snapshot.boatType, snapshot.charterType),
    [snapshot.stateCode, snapshot.boatType, snapshot.charterType]
  )
  const partyBoatTriggered = useMemo(
    () => isPartyBoatTriggered(complianceRules, snapshot.lengthFt, snapshot.guests.length),
    [complianceRules, snapshot.lengthFt, snapshot.guests.length]
  )
  // Block departure if party boat triggered but captain hasn't attested
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
      const res = await fetch(
        `/api/trips/${snapshot.slug}/start`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            snapshotToken: token,
            captainName: snapshot.captainName,
            confirmedGuestCount: snapshot.guests.length,
            checklistConfirmed: true,
            briefingAttestation: briefingAttestation ?? undefined,
          }),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        setStartError(json.error ?? 'Failed to start trip')
        setSliderComplete(false)
        setShowConfirm(false)
        return
      }

      onStarted({
        startedAt: json.data.startedAt,
        buoyPolicyId: json.data.buoyPolicyId,
      })

    } catch {
      setStartError('Connection error. Please try again.')
      setSliderComplete(false)
      setShowConfirm(false)
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">

      {/* Header */}
      <div className="bg-teal px-5 pt-6 pb-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onCancel}
            className="text-white/70 hover:text-white text-[14px]"
          >
            ← Back
          </button>
          <span className="text-[13px] font-bold tracking-wider opacity-70">
            PRE-DEPARTURE
          </span>
        </div>
        <h1 className="text-[24px] font-bold">Ready to depart?</h1>
        <p className="text-white/80 text-[14px] mt-1">
          {snapshot.boatName} · {formatTripDate(snapshot.tripDate)} · {formatTime(snapshot.departureTime)}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Unsigned waiver warning */}
        {unsignedGuests.length > 0 && (
          <div className="p-4 bg-warn-dim rounded-[14px] border border-[#E5910A] border-opacity-30">
            <p className="text-[14px] font-semibold text-warn mb-2">
              {unsignedGuests.length} guest{unsignedGuests.length !== 1 ? 's' : ''} has not signed the waiver
            </p>
            <div className="space-y-1">
              {unsignedGuests.map(g => (
                <p key={g.id} className="text-[13px] text-navy">
                  · {g.fullName}
                </p>
              ))}
            </div>
            <p className="text-[12px] text-text-mid mt-2">
              You may still proceed. Record this in your log.
            </p>
          </div>
        )}

        {/* Pre-departure checklist */}
        <div className="bg-bg rounded-[14px] p-5">
          <h2 className="text-[16px] font-semibold text-navy mb-4">
            Pre-departure checklist
          </h2>
          <p className="text-[13px] text-text-mid mb-4">
            Confirm each item before sliding to start.
          </p>
          <div className="space-y-1">
            {CHECKLIST_ITEMS.map(item => (
              <label
                key={item.id}
                className="flex items-center gap-3 py-3 cursor-pointer min-h-[48px]
                           border-b border-border last:border-0"
              >
                <div
                  onClick={() => toggleCheck(item.id)}
                  className={cn(
                    'w-6 h-6 rounded-[6px] border-2 flex items-center justify-center',
                    'transition-all duration-150 flex-shrink-0',
                    checked.has(item.id)
                      ? 'bg-teal border-[#1D9E75]'
                      : 'bg-white border-border'
                  )}
                >
                  {checked.has(item.id) && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className={cn(
                  'text-[15px] leading-tight',
                  checked.has(item.id)
                    ? 'text-text-mid line-through'
                    : 'text-navy'
                )}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <span className="text-[13px] text-text-mid">
              {checked.size} / {CHECKLIST_ITEMS.length} confirmed
            </span>
            {allChecked && (
              <span className="text-[13px] font-semibold text-teal">
                All confirmed
              </span>
            )}
          </div>
        </div>

        {/* Guest count */}
        <div className="bg-[#EBF0F7] rounded-[14px] px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[15px] font-semibold text-navy">
              Passengers on board
            </p>
            <span className="text-[22px] font-black text-[var(--color-navy)]">
              {snapshot.guests.length}
            </span>
          </div>
        </div>

        {/* ── Texas Party Boat Act Attestation ────────────────────── */}
        {partyBoatTriggered && (
          <div className="p-5 bg-[#FFFBEB] rounded-[14px] border-2 border-[#F59E0B] border-opacity-40">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[20px]">🤠</span>
              <h4 className="text-[14px] font-bold text-[#92400E] uppercase tracking-wider">
                Texas Party Boat Act Triggered
              </h4>
            </div>
            <p className="text-[13px] text-[#78350F] leading-relaxed mb-4">
              This vessel exceeds 30ft and is carrying more than 6 passengers.
              Texas Water Safety Act requires an annual TPWD inspection and a licensed operator.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="mt-0.5 flex-shrink-0">
                <div
                  onClick={() => setHasPartyBoatLicense(!hasPartyBoatLicense)}
                  className={cn(
                    'w-6 h-6 rounded-[6px] border-2 flex items-center justify-center',
                    'transition-all duration-150',
                    hasPartyBoatLicense
                      ? 'bg-[#F59E0B] border-[#F59E0B]'
                      : 'bg-white border-[#D97706]'
                  )}
                >
                  {hasPartyBoatLicense && (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2"
                            strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[13px] text-[#78350F] leading-relaxed">
                I certify under penalty of law that I hold a valid Texas Party Boat
                Operator License and this vessel displays a current TPWD inspection decal.
              </span>
            </label>
          </div>
        )}

        {/* Error */}
        {startError && (
          <div className="p-4 bg-error-dim rounded-[12px]">
            <p className="text-[14px] text-error font-medium">
              {startError}
            </p>
          </div>
        )}
      </div>

      {/* Slider CTA */}
      <div className="px-5 pb-10 pt-4 bg-white border-t border-border">
        {canSlide ? (
          <SlideToConfirm
            label="SLIDE TO START TRIP"
            onComplete={handleSliderComplete}
            disabled={isStarting}
            color="teal"
          />
        ) : (
          <div className="
            w-full h-[64px] rounded-[14px]
            bg-border flex items-center justify-center
          ">
            <span className="text-[15px] font-semibold text-text-mid">
              {!allChecked
                ? 'Complete checklist to continue'
                : 'Complete compliance attestation above'}
            </span>
          </div>
        )}
      </div>

      {/* Confirmation overlay */}
      {showConfirm && (
        <div className="
          fixed inset-0 z-50 bg-[rgba(12,68,124,0.5)]
          flex items-end
        ">
          <div className="
            w-full bg-white rounded-t-[24px]
            px-6 py-6 pb-10
          ">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />

            <h2 className="text-[22px] font-bold text-navy mb-2">
              Starting trip
            </h2>
            <p className="text-[15px] text-text-mid mb-1">
              {snapshot.boatName}
            </p>
            <p className="text-[14px] text-text-mid mb-5">
              {formatTripDate(snapshot.tripDate)} · {formatTime(snapshot.departureTime)} · {snapshot.guests.length} passengers
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-2 text-[13px] text-text-mid">
                <span className="text-teal">✓</span>
                <span>Trip status set to Active</span>
              </div>
              <div className="flex items-start gap-2 text-[13px] text-text-mid">
                <span className="text-teal">✓</span>
                <span>Insurance policy activated via Buoy API</span>
              </div>
              <div className="flex items-start gap-2 text-[13px] text-text-mid">
                <span className="text-teal">✓</span>
                <span>Departure timestamp logged (USCG)</span>
              </div>
              <div className="flex items-start gap-2 text-[13px] text-text-mid">
                <span className="text-teal">✓</span>
                <span>Guests notified on their phones</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowConfirm(false)
                  setSliderComplete(false)
                }}
                disabled={isStarting}
                className="
                  flex-1 h-[56px] rounded-[12px]
                  border border-border text-text-mid
                  font-semibold text-[15px]
                  hover:bg-bg transition-colors
                  disabled:opacity-40
                "
              >
                Cancel
              </button>
              <button
                onClick={confirmStart}
                disabled={isStarting}
                className="
                  flex-1 h-[56px] rounded-[12px]
                  bg-teal text-white
                  font-bold text-[16px]
                  flex items-center justify-center gap-2
                  hover:bg-[#178a64] transition-colors
                  disabled:opacity-40
                "
              >
                {isStarting ? (
                  <AnchorLoader size="sm" color="white" />
                ) : (
                  'Start now'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
