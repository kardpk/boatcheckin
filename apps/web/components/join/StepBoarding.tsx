'use client'

import { useEffect, useState, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Share, Lock, PartyPopper } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { createClient } from '@/lib/supabase/client'
import type { JoinFlowState } from '@/types'

interface StepBoardingProps {
  tripData: {
    boatName: string
    marinaName: string
    slipNumber: string | null
    captainName: string | null
    tripDate: string
    departureTime: string
    durationHours: number
    charterType: string
  }
  state: JoinFlowState
  tripSlug: string
  onClose: () => void
}

export function StepBoarding({ tripData, state, tripSlug, onClose }: StepBoardingProps) {
  const [pwaPrompt, setPwaPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [pwaInstalled, setPwaInstalled] = useState(false)
  const { isSupported, permission, isSubscribing, requestSubscription } = usePushNotifications()

  // ── Realtime Livery Status Transition ────────────────────────────────────
  // When the dockmaster verifies the livery briefing on the captain's iPad,
  // Supabase fires a postgres_changes event that flips this state instantly.
  const [approvalStatus, setApprovalStatus] = useState(
    state.approvalStatus ?? 'auto_approved'
  )
  const [justApproved, setJustApproved] = useState(false)

  const isLiveryPending = approvalStatus === 'pending_livery_briefing'

  // Subscribe to approval_status changes on this guest's row
  useEffect(() => {
    if (!state.guestId || approvalStatus !== 'pending_livery_briefing') return

    const supabase = createClient()
    const channel = supabase
      .channel(`guest-approval-${state.guestId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'guests',
          filter: `id=eq.${state.guestId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newStatus = (payload.new as Record<string, unknown>).approval_status as string
          if (newStatus === 'approved') {
            setJustApproved(true)
            // Small delay for the celebration animation to feel intentional
            setTimeout(() => setApprovalStatus('approved'), 300)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [state.guestId, approvalStatus])

  // Capture PWA install prompt
  useEffect(() => {
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setPwaPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const installPwa = useCallback(async () => {
    if (!pwaPrompt) return
    await pwaPrompt.prompt()
    const { outcome } = await pwaPrompt.userChoice
    if (outcome === 'accepted') setPwaInstalled(true)
    setPwaPrompt(null)
  }, [pwaPrompt])

  async function sharePass() {
    const url = `${window.location.origin}/trip/${tripSlug}`
    if (navigator.share) {
      await navigator.share({
        title: `My boarding pass — ${tripData.boatName}`,
        text: 'I\'m boarding ' + tripData.boatName + ' on ' + formatTripDate(tripData.tripDate),
        url,
      }).catch(() => null)
    } else {
      await navigator.clipboard.writeText(url).catch(() => null)
    }
  }

  const hasAddons = Object.values(state.addonQuantities).some(q => q > 0)
  const addonCount = Object.values(state.addonQuantities).reduce((s, q) => s + q, 0)

  return (
    <div className="pt-2">
      {/* ── Header: 3 states — Amber (pending) → Celebration → Green (approved) ── */}
      <AnimatePresence mode="wait">
        {isLiveryPending ? (
          <motion.div
            key="amber"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center mb-6"
          >
            <div className="text-gold mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/></svg></div>
            <h2 className="text-[22px] font-bold text-warn mb-1">Instruction Required</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF8E1] border border-[#FFD54F] rounded-full animate-pulse">
              <span className="text-[14px] font-medium text-warn">
                🟡 See Dockmaster for Vessel Instruction
              </span>
            </div>
            <p className="text-[13px] text-text-mid mt-2 max-w-[280px] mx-auto">
              Florida law (§327.54) requires an in-person vessel briefing before bareboat departure. 
              Your boarding pass will activate once they sign off.
            </p>
          </motion.div>
        ) : justApproved ? (
          <motion.div
            key="celebration"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="text-center mb-6"
            onAnimationComplete={() => setTimeout(() => setJustApproved(false), 2000)}
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 0.6 }}
              className="text-[48px] mb-2"
            >

            </motion.div>
            <h2 className="text-[22px] font-bold text-teal mb-1">You&apos;re cleared!</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#E8F9F4] border border-teal rounded-full">
              <PartyPopper size={16} className="text-teal" />
              <span className="text-[14px] font-medium text-teal">
                Dockmaster has signed off — Welcome aboard!
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="text-gold mb-2"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.63-.68 1.07-1.32 1.07H17c-.88 0-1.6.72-1.6 1.6v.04"/></svg></div>
            <h2 className="text-[22px] font-bold text-navy mb-1">You&apos;re checked in!</h2>
            <p className="text-[14px] text-text-mid">Show this QR code when boarding</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Boarding Pass — Apple Wallet aesthetic ── */}
      <div className="bg-white rounded-[14px] shadow-[0_4px_24px_rgba(12,68,124,0.12)] overflow-hidden mb-5">
        {/* Top half */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-[11px] font-semibold text-text-mid tracking-[0.15em] uppercase mb-2">
            BOATCHECKIN
          </p>
          <h3 className="text-[20px] font-bold text-navy mb-4">{tripData.boatName}</h3>

          {/* 3-column trip meta */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Date', value: formatTripDate(tripData.tripDate) },
              { label: 'Time', value: formatTime(tripData.departureTime) },
              { label: 'Duration', value: formatDuration(tripData.durationHours) },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] text-text-mid">{label}</p>
                <p className="text-[13px] font-semibold text-navy leading-tight">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dashed divider */}
        <div className="flex items-center px-4 my-1">
          <div className="flex-1 border-t-2 border-dashed border-border" />
          <span className="px-2 text-border text-[18px]">✂</span>
          <div className="flex-1 border-t-2 border-dashed border-border" />
        </div>

        {/* Bottom half — QR (blurred when pending livery) */}
        <div className="px-5 pt-4 pb-5 flex flex-col items-center">
          <div className="relative">
            <div className={`bg-navy p-3 rounded-[14px] mb-3 transition-all duration-500 ${
              isLiveryPending ? 'blur-[8px] scale-95' : 'blur-0 scale-100'
            }`}>
              <QRCodeSVG
                value={state.qrToken || `dp-guest-${tripSlug}`}
                size={160}
                fgColor="#FFFFFF"
                bgColor="#0B1D3A"
                level="M"
              />
            </div>

            {/* Lock overlay when QR is blurred */}
            <AnimatePresence>
              {isLiveryPending && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <div className="w-14 h-14 rounded-full bg-[#FFF8E1] border-2 border-[#FFD54F] flex items-center justify-center mb-2 shadow-lg">
                    <Lock size={24} className="text-[#F59E0B]" />
                  </div>
                  <p className="text-[12px] font-semibold text-warn bg-[#FFF8E1] px-3 py-1 rounded-full">
                    Awaiting sign-off
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-[12px] text-text-mid mb-1">
            {tripData.slipNumber ? `Slip ${tripData.slipNumber} · ` : ''}
            {tripData.marinaName}
          </p>
          <p className="text-[17px] font-bold text-navy">{state.fullName}</p>
        </div>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2 mb-5 justify-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#E8F9F4] text-teal">
          ✓ Waiver signed
        </span>
        {state.safetyAcks.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#E8F9F4] text-teal">
            ✓ {state.safetyAcks.length} safety point{state.safetyAcks.length !== 1 ? 's' : ''}
          </span>
        )}
        {hasAddons && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-gold-dim text-navy">
            🛒 {addonCount} add-on{addonCount !== 1 ? 's' : ''} ordered
          </span>
        )}
        {state.requiresCourse && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#FEF3DC] text-[#E5910A]">
            Complete course before trip
          </span>
        )}
        {isLiveryPending && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium bg-[#FFF8E1] text-warn animate-pulse">
            Vessel instruction pending
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={sharePass}
          className="w-full h-[52px] rounded-[12px] border-2 border-gold text-navy font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-gold-dim transition-colors"
        >
          <Share size={18} />
          Save boarding pass
        </button>

        {/* PWA install banner */}
        {pwaPrompt && !pwaInstalled && (
          <div className="bg-navy rounded-[14px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0">
              ▸
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-[14px]">Add BoatCheckin to your home screen</p>
              <p className="text-white/70 text-[12px]">Get weather updates and dock alerts</p>
            </div>
            <button
              onClick={installPwa}
              className="bg-white text-navy text-[13px] font-semibold px-3 py-1.5 rounded-[8px] flex-shrink-0"
            >
              Add
            </button>
          </div>
        )}

        {/* Push Notification prompt */}
        {isSupported && permission === 'default' && (
          <div className="bg-gold-dim rounded-[14px] p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-[10px] flex items-center justify-center text-[20px] flex-shrink-0">
              ▸
            </div>
            <div className="flex-1">
              <p className="text-navy font-medium text-[14px]">Push Notifications</p>
              <p className="text-text-mid text-[12px]">Get weather alerts directly</p>
            </div>
            <button
              onClick={() => requestSubscription('guest', state.guestId)}
              disabled={isSubscribing}
              className="bg-navy text-white text-[13px] font-semibold px-3 py-1.5 rounded-[8px] flex-shrink-0 disabled:opacity-50"
            >
              {isSubscribing ? 'Wait' : 'Enable'}
            </button>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full text-[14px] text-text-mid underline py-2 min-h-[44px]"
        >
          Back to trip info
        </button>
      </div>
    </div>
  )
}

// BeforeInstallPromptEvent is not in TS lib by default
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
