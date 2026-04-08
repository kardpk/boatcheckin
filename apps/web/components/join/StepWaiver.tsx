'use client'

import { useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { JoinFlowState } from '@/types'

interface StepWaiverProps {
  waiverText: string
  waiverHash: string
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  tripSlug: string
  onNext: (requiresCourse: boolean) => void
  onBack: () => void
}

export function StepWaiver({
  waiverText, waiverHash, state, onUpdate,
  tripSlug, onNext, onBack,
}: StepWaiverProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget
    const progress = el.scrollTop / Math.max(el.scrollHeight - el.clientHeight, 1)
    setScrollProgress(Math.min(progress, 1))
    if (progress >= 0.98) {
      onUpdate({ waiverScrolled: true })
    }
  }

  async function handleSign() {
    if (!state.waiverAgreed || !state.signatureText.trim() || !state.waiverScrolled) return
    onUpdate({ isSubmitting: true, submitError: '' })

    try {
      const res = await fetch(`/api/trips/${tripSlug}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripSlug,
          tripCode: state.tripCode,
          fullName: state.fullName,
          emergencyContactName: state.emergencyContactName,
          emergencyContactPhone: state.emergencyContactPhone,
          dietaryRequirements: state.dietaryRequirements || undefined,
          languagePreference: state.languagePreference,
          dateOfBirth: state.dateOfBirth || undefined,
          isNonSwimmer: state.isNonSwimmer,
          isSeaSicknessProne: state.isSeaSicknessProne,
          gdprConsent: state.gdprConsent,
          marketingConsent: state.marketingConsent,
          safetyAcknowledgments: state.safetyAcks,
          waiverSignatureText: state.signatureText,
          waiverAgreed: true,
          waiverTextHash: waiverHash,
          // In production Turnstile provides this; dev bypasses server-side
          turnstileToken: 'dev-bypass',
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        onUpdate({ isSubmitting: false, submitError: json.error ?? 'Registration failed' })
        return
      }

      const { guestId, qrToken, requiresCourse } = json.data

      // Persist guest session to localStorage
      try {
        localStorage.setItem(`dp-guest-${tripSlug}`, JSON.stringify({
          guestId,
          tripSlug,
          qrToken,
          guestName: state.fullName,
          checkedInAt: new Date().toISOString(),
          addonOrderIds: [],
        }))
      } catch { /* Private mode — silently ignore */ }

      onUpdate({ isSubmitting: false, guestId, qrToken, requiresCourse, waiverTextHash: waiverHash })
      onNext(requiresCourse)
    } catch {
      onUpdate({ isSubmitting: false, submitError: 'Connection error. Please try again.' })
    }
  }

  const canSign = state.waiverScrolled && state.waiverAgreed && state.signatureText.trim().length >= 2

  return (
    <div className="pt-2">
      <button
        onClick={onBack}
        disabled={state.isSubmitting}
        className="flex items-center gap-1 text-[13px] text-[#6B7C93] -ml-1 mb-4 min-h-[44px]"
      >
        <ChevronLeft size={16} /> Back
      </button>

      <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
        Sign the liability waiver
      </h2>
      <p className="text-[14px] text-[#6B7C93] mb-4">Please read carefully before signing</p>

      {/* Scroll progress bar */}
      <div className="w-full h-1 bg-[#E8F2FB] rounded-full mb-3 overflow-hidden">
        <div
          className="h-full bg-[#0C447C] rounded-full transition-all"
          style={{ width: `${scrollProgress * 100}%` }}
        />
      </div>
      {!state.waiverScrolled && (
        <p className="text-[12px] text-[#6B7C93] mb-3 text-center">
          ↓ Scroll to read the full waiver
        </p>
      )}

      {/* Waiver text — scrollable box */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="h-56 overflow-y-auto rounded-[12px] border border-[#D0E2F3] bg-[#F5F8FC] p-4 mb-4 text-[13px] text-[#0D1B2A] leading-relaxed whitespace-pre-wrap"
        tabIndex={0}
        role="region"
        aria-label="Waiver text"
      >
        {waiverText || `By participating in this charter, you acknowledge and accept all risks associated with boating activities. You agree to follow all safety instructions from the captain and crew. DockPass and the boat operator are not liable for personal injury, loss, or damage arising from participation in this trip.`}
      </div>

      {/* Agree checkbox */}
      <label className="flex items-start gap-3 mb-5 cursor-pointer min-h-[48px]">
        <input
          type="checkbox"
          checked={state.waiverAgreed}
          onChange={e => onUpdate({ waiverAgreed: e.target.checked })}
          disabled={!state.waiverScrolled}
          className="w-5 h-5 mt-0.5 rounded accent-[#0C447C] flex-shrink-0"
        />
        <span className={cn('text-[14px] leading-relaxed', state.waiverScrolled ? 'text-[#0D1B2A]' : 'text-[#6B7C93]')}>
          I have read and agree to the liability waiver
        </span>
      </label>

      {/* Signature field — Satisfy cursive font */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium text-[#6B7C93] mb-2">
          Type your full name as your signature
        </label>
        <input
          type="text"
          placeholder="Sofia Martinez"
          value={state.signatureText}
          onChange={e => onUpdate({ signatureText: e.target.value })}
          disabled={!state.waiverAgreed || state.isSubmitting}
          style={{ fontFamily: 'var(--font-satisfy, cursive)', fontSize: '22px', color: '#0C447C' }}
          className="w-full h-[56px] px-4 rounded-[10px] border border-[#D0E2F3] placeholder:text-[#D0E2F3] focus:outline-none focus:border-[#0C447C] disabled:opacity-50 disabled:cursor-not-allowed"
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-[11px] text-[#6B7C93] mt-1">
          By typing your name, you agree this constitutes your legal signature
        </p>
      </div>

      {/* Error */}
      {state.submitError && (
        <div className="p-4 rounded-[12px] bg-[#FDEAEA] mb-4">
          <p className="text-[14px] text-[#D63B3B] font-medium">{state.submitError}</p>
        </div>
      )}

      {/* Sign button */}
      <button
        onClick={handleSign}
        disabled={!canSign || state.isSubmitting}
        className={cn(
          'w-full h-[56px] rounded-[12px]',
          'font-semibold text-[16px]',
          'flex items-center justify-center gap-2',
          'transition-all duration-150',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-[#0C447C] text-white hover:bg-[#093a6b]'
        )}
      >
        {state.isSubmitting ? <AnchorLoader size="sm" color="white" /> : '✓ Sign and check in'}
      </button>
    </div>
  )
}
