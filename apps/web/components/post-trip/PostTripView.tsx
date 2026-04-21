'use client'

import { useState, useEffect } from 'react'
import { PostTripPageData, GuestSession } from '@/types'
import { storage } from '@/lib/storage'
import { PostTripHero } from './PostTripHero'
import { ReviewGate } from './ReviewGate'
import { PostcardSection } from './PostcardSection'
import { RebookSection } from './RebookSection'
import { ReferralSection } from './ReferralSection'
import { AddonOrderSummarySection } from './AddonOrderSummarySection'
import { MultiDayRecapSection } from './MultiDayRecapSection'
import { SeasonalRebookSection } from './SeasonalRebookSection'

export function PostTripView({ data }: { data: PostTripPageData }) {
  const [session, setSession] = useState<GuestSession | null>(null)
  const [rating, setRating]   = useState<number>(data.existingRating || 0)

  useEffect(() => {
    const saved = storage.get('guest_session', data.slug)
    if (saved) setSession(saved)
  }, [data.slug])

  // Unlock postcard if they've rated OR if they already have an existing rating from server
  const postcardUnlocked = rating > 0

  return (
    <div className="min-h-screen bg-bg pb-24">
      <PostTripHero data={data} />

      <div className="max-w-[480px] mx-auto px-5 w-full -mt-6 relative z-10 flex flex-col gap-6">

        {/* ── Phase 4E: Add-on order summary (above review — contextual recap) */}
        {data.addonOrderSummary && data.addonOrderSummary.length > 0 && (
          <AddonOrderSummarySection items={data.addonOrderSummary} />
        )}

        {/* ── Phase 4E: Multi-day rental recap ──────────────────────────────── */}
        {data.isMultiDay && data.rentalDaySummary && data.rentalDaySummary.length > 0 && (
          <MultiDayRecapSection
            boatName={data.boatName}
            durationDays={data.durationDays ?? 1}
            days={data.rentalDaySummary}
            returnCondition={data.returnCondition ?? null}
          />
        )}

        {/* ── Review gate ───────────────────────────────────────────────────── */}
        <ReviewGate
          data={{ ...data, existingRating: rating }}
          guestId={session?.guestId}
          onReviewSubmitted={(r) => setRating(r)}
        />

        {/* ── Postcard (unlocked after rating) ─────────────────────────────── */}
        {postcardUnlocked && session?.guestName && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PostcardSection
              tripSlug={data.slug}
              tripId={data.tripId}
              guestId={session.guestId}
              postcardData={{
                guestName:    session.guestName,
                boatName:     data.boatName,
                captainName:  data.captainName,
                marinaName:   data.marinaName,
                tripDate:     data.tripDate,
                durationHours: data.durationHours,
                weatherIcon:   data.weather?.icon || null,
                weatherLabel:  data.weather?.label || null,
                temperature:   data.weather?.temperature || null,
              }}
            />
          </div>
        )}

        {/* ── Rebook + referral (after review) ─────────────────────────────── */}
        {rating > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 flex flex-col gap-6">

            {/* Phase 4E: seasonal rebook (before regular rebook — more prominent) */}
            {data.seasonalPromo && (
              <SeasonalRebookSection
                operatorName={data.operatorCompanyName}
                promo={data.seasonalPromo}
              />
            )}

            <RebookSection
              boatName={data.boatName}
              boatsetterUrl={data.boatsetterUrl}
            />

            <ReferralSection
              tripSlug={data.slug}
              boatName={data.boatName}
            />
          </div>
        )}
      </div>
    </div>
  )
}
