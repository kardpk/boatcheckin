'use client'

import { useState, useEffect } from 'react'
import { Check, ArrowLeft } from 'lucide-react'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { SlideToConfirm } from '@/components/ui/SlideToConfirm'

interface EndTripFlowProps {
  boatName: string
  startedAt: string | null
  token: string
  tripSlug: string
  onEnded: () => void
  onCancel: () => void
}

export function EndTripFlow({
  boatName, startedAt, token, tripSlug, onEnded, onCancel,
}: EndTripFlowProps) {
  const [elapsed, setElapsed] = useState('')
  const [isEnding, setIsEnding] = useState(false)
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Live elapsed time counter
  useEffect(() => {
    if (!startedAt) return
    function update() {
      const ms = Date.now() - new Date(startedAt!).getTime()
      const hours = Math.floor(ms / 3600000)
      const mins = Math.floor((ms % 3600000) / 60000)
      setElapsed(`${hours}hr ${mins}min`)
    }
    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [startedAt])

  async function confirmEnd() {
    setIsEnding(true)
    setError('')

    try {
      const res = await fetch(
        `/api/trips/${tripSlug}/end`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ snapshotToken: token }),
        }
      )

      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to end trip')
        setShowConfirm(false)
        return
      }

      onEnded()
    } catch {
      setError('Connection error. Please try again.')
      setShowConfirm(false)
    } finally {
      setIsEnding(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <div className="bg-[#E8593C] px-5 pt-6 pb-5 text-white">
        <button onClick={onCancel} className="text-white/70 mb-3 text-[14px]">
          ← Back
        </button>
        <h1 className="text-[24px] font-bold">End this charter?</h1>
        <p className="text-white/80 text-[14px] mt-1">{boatName}</p>
      </div>

      <div className="flex-1 px-5 py-6 space-y-5">

        {/* Duration */}
        {elapsed && (
          <div className="bg-white rounded-[14px] p-5 border border-border">
            <p className="text-[13px] text-text-mid mb-1">Time since departure</p>
            <p className="text-[28px] font-black text-navy">{elapsed}</p>
          </div>
        )}

        {/* What happens */}
        <div className="bg-white rounded-[14px] p-5 border border-border">
          <p className="text-[14px] font-semibold text-navy mb-3">
            On ending:
          </p>
          <div className="space-y-2">
            {[
              'Trip marked as completed',
              'Insurance policy deactivated',
              'Guests sent review request (2hr delay)',
              'Trip postcards unlocked for guests',
            ].map(item => (
              <div key={item} className="flex items-center gap-[6px]">
                <Check size={14} className="text-teal" />
                <span className="text-[14px] text-text-mid">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error-dim rounded-[12px]">
            <p className="text-[14px] text-error">{error}</p>
          </div>
        )}
      </div>

      {/* Slider */}
      <div className="px-5 pb-10 pt-4 bg-white border-t border-border">
        <SlideToConfirm
          label="SLIDE TO END TRIP"
          onComplete={() => setShowConfirm(true)}
          color="coral"
        />
      </div>

      {/* Confirm overlay */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-navy/50 flex items-end">
          <div className="w-full bg-white rounded-t-[24px] px-[20px] py-[20px] pb-[32px]">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-[18px]" />
            <h2 className="text-[20px] font-bold text-navy mb-2">
              End charter?
            </h2>
            <p className="text-[14px] text-text-mid mb-6">
              This cannot be undone. The trip will be marked as completed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isEnding}
                className="flex-1 h-[56px] rounded-[12px] border border-border text-text-mid font-semibold text-[15px] disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={confirmEnd}
                disabled={isEnding}
                className="flex-1 h-[56px] rounded-[12px] bg-[#E8593C] text-white font-bold text-[16px] flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isEnding ? <AnchorLoader size="sm" color="white" /> : 'End trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
