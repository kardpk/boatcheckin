'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PostTripPageData } from '@/types'

interface ReviewGateProps {
  data: PostTripPageData
  guestId?: string
  onReviewSubmitted: (rating: number) => void
}

export function ReviewGate({ data, guestId, onReviewSubmitted }: ReviewGateProps) {
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedRating, setSelectedRating] = useState(data.existingRating || 0)
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  
  // If no guest session is available, gate is locked.
  // We show the stars to tease the feature, but clicking does nothing.
  const isLocked = !guestId || Boolean(data.existingRating)

  async function handleStarClick(rating: number) {
    if (isLocked) return
    setSelectedRating(rating)

    if (rating <= 3) {
      setShowForm(true)
    } else {
      await submitReview(rating, '')
    }
  }

  async function submitReview(rating: number, text: string) {
    if (!guestId) return
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/trips/${data.slug}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripSlug: data.slug,
          guestId,
          rating,
          feedbackText: text,
        }),
      })
      if (!res.ok) throw new Error()
      
      setShowForm(false)
      onReviewSubmitted(rating)
    } catch {
      alert('Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isPublic = selectedRating >= 4

  return (
    <div className="bg-white rounded-[20px] p-6 border border-[#D0E2F3] shadow-[0_4px_24px_rgba(12,68,124,0.06)] relative overflow-hidden">
      {!isLocked && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1D9E75] to-[#E5910A]" />
      )}

      {selectedRating === 0 ? (
        <div className="text-center">
          <h2 className="text-[18px] font-bold text-[#0D1B2A] mb-2">
            How was your trip?
          </h2>
          <p className="text-[14px] text-[#6B7C93] mb-6">
            Help {data.operatorCompanyName || 'the operator'} by sharing your experience.
          </p>

          <div 
            className="flex justify-center gap-2"
            onMouseLeave={() => setHoveredStar(0)}
          >
            {[1, 2, 3, 4, 5].map(star => {
              const active = hoveredStar >= star || selectedRating >= star
              return (
                <button
                  key={star}
                  disabled={isLocked || isSubmitting}
                  onMouseEnter={() => !isLocked && setHoveredStar(star)}
                  onClick={() => handleStarClick(star)}
                  className={cn(
                    'text-[40px] transition-all duration-200',
                    !isLocked && 'hover:scale-110 active:scale-95 cursor-pointer',
                    active ? 'text-[#E5910A]' : 'text-[#D0E2F3]'
                  )}
                  style={{
                    filter: active ? 'drop-shadow(0 2px 4px rgba(229,145,10,0.3))' : 'none',
                    opacity: isLocked ? 0.5 : 1
                  }}
                >
                  ★
                </button>
              )
            })}
          </div>
        </div>
      ) : showForm ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-center mb-4 text-[#E5910A] text-[32px]">
            {[1,2,3,4,5].map(s => (
              <span key={s} className={s <= selectedRating ? 'opacity-100' : 'opacity-20'}>★</span>
            ))}
          </div>

          <div className="bg-[#FFF4E5] rounded-[12px] p-4 mb-4 flex items-start gap-3">
            <span className="text-[20px]">🔒</span>
            <div>
              <p className="text-[14px] font-semibold text-[#B36B00] mb-1">
                Private Feedback
              </p>
              <p className="text-[13px] text-[#B36B00]/80">
                This will only be seen by {data.operatorCompanyName || 'the operator'} and the captain.
              </p>
            </div>
          </div>

          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            disabled={isSubmitting}
            placeholder="What could have been better?"
            className="w-full h-[120px] rounded-[12px] border border-[#D0E2F3] p-4 text-[15px] resize-none mb-4 focus:outline-none focus:border-[#0C447C] focus:ring-1 focus:ring-[#0C447C]"
          />

          <button
            onClick={() => submitReview(selectedRating, feedback)}
            disabled={isSubmitting || !feedback.trim()}
            className="w-full h-[52px] bg-[#0C447C] text-white rounded-[12px] font-semibold text-[16px] disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send private feedback'}
          </button>
        </div>
      ) : (
        <div className="text-center animate-in zoom-in-95 duration-400">
          <div className="w-[64px] h-[64px] bg-[#E8F9F4] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-[32px]">✓</span>
          </div>
          <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-2">
            Thank you for the kind words!
          </h2>
          <p className="text-[14px] text-[#6B7C93] mb-6">
            Small businesses run on reviews.
            If you have a moment, it would mean everything if you shared this publicly.
          </p>

          <div className="flex flex-col gap-3">
            {data.googleReviewUrl && (
              <a
                href={data.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[52px] border-2 border-[#D0E2F3] rounded-[12px] flex items-center justify-center gap-2 font-semibold text-[15px] hover:bg-[#F5F8FC] transition-colors"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-[20px] h-[20px]" />
                Review on Google
              </a>
            )}
            
            {data.boatsetterReviewUrl && (
              <a
                href={data.boatsetterReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-[52px] border-2 border-[#D0E2F3] rounded-[12px] flex items-center justify-center gap-2 font-semibold text-[15px] hover:bg-[#F5F8FC] transition-colors"
              >
                ⚓ Review on Boatsetter
              </a>
            )}
            
            {(!data.googleReviewUrl && !data.boatsetterReviewUrl) && (
              <p className="text-[13px] text-[#6B7C93] italic">
                Your review has been saved to the operator's dashboard.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
