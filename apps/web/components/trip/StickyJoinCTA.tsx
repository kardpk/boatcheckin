'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { JoinFlowSheet } from '@/components/join/JoinFlowSheet'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface TripDataForJoin {
  boatName: string
  marinaName: string
  slipNumber: string | null
  captainName: string | null
  tripDate: string
  departureTime: string
  durationHours: number
  charterType: 'captained' | 'bareboat' | 'both'
  tripPurpose: string
  addons: {
    id: string
    name: string
    description: string | null
    emoji: string
    priceCents: number
    maxQuantity: number
  }[]
  isEU: boolean
}

interface StickyJoinCTAProps {
  tripSlug: string
  tripCode: string
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  isFull: boolean
  guestCount: number
  maxGuests: number
  requiresApproval: boolean
  currentLang: string
  tripData: TripDataForJoin
  tr: TripT
}

export function StickyJoinCTA({
  tripSlug,
  status,
  isFull,
  guestCount,
  maxGuests,
  requiresApproval,
  currentLang,
  tripData,
  tr,
}: StickyJoinCTAProps) {
  const [joinOpen, setJoinOpen] = useState(false)

  const isActive = status === 'active'
  const isDisabled = isFull && !isActive

  return (
    <>
      {/* Fixed bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">

        {/* Active trip green banner */}
        {isActive && (
          <div className="bg-[#E8F9F4] text-teal text-[13px] text-center py-2 rounded-[8px] mb-3">
            ✓ {tr.activeBanner}
          </div>
        )}

        {/* Guest count */}
        <p className="text-[13px] text-text-mid text-center mb-3">
          {tr.guestCount.replace('{n}', guestCount.toString()).replace('{max}', maxGuests.toString())}
        </p>

        {/* CTA button */}
        <button
          onClick={() => !isDisabled && setJoinOpen(true)}
          disabled={isDisabled}
          className={cn(
            'w-full h-[52px] rounded-[12px] font-semibold text-[16px] transition-colors',
            isDisabled
              ? 'bg-border text-text-mid cursor-not-allowed'
              : isActive
              ? 'bg-[#1D9E75] text-white hover:bg-[#178c65]'
              : 'bg-navy text-white hover:bg-navy/90',
          )}
        >
          {isDisabled
            ? tr.joinCtaFull
            : isActive
            ? tr.joinCtaActive
            : tr.joinCta}
        </button>

        {/* Approval note */}
        {requiresApproval && !isDisabled && (
          <p className="text-[12px] text-text-mid text-center mt-2">
            ⏳ Subject to approval
          </p>
        )}
      </div>

      {/* Real join flow sheet — Phase 3C */}
      <JoinFlowSheet
        isOpen={joinOpen}
        onClose={() => setJoinOpen(false)}
        tripSlug={tripSlug}
        tripData={tripData}
        currentLang={currentLang}
      />
    </>
  )
}
