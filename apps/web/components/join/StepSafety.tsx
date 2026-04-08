'use client'

import { useEffect } from 'react'
import { ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { JoinFlowState, SafetyAck } from '@/types'

interface StepSafetyProps {
  safetyPoints: { id: string; text: string; icon?: string }[]
  state: JoinFlowState
  onUpdate: (p: Partial<JoinFlowState>) => void
  onNext: () => void
  onBack: () => void
}

export function StepSafety({ safetyPoints, state, onUpdate, onNext, onBack }: StepSafetyProps) {
  const current = state.currentSafetyCard
  const total = safetyPoints.length
  const point = safetyPoints[current]
  const allAcknowledged = state.safetyAcks.length >= total

  // If no safety points configured — skip step after mount (safe: not during render)
  useEffect(() => {
    if (total === 0) onNext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (total === 0) return null

  function acknowledge() {
    if (!point) return
    const ack: SafetyAck = {
      id: point.id,
      text: point.text,
      acknowledgedAt: new Date().toISOString(),
    }
    const newAcks = [...state.safetyAcks, ack]
    const nextCard = current + 1
    onUpdate({ safetyAcks: newAcks, currentSafetyCard: nextCard })
  }

  return (
    <div className="pt-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-[#6B7C93] -ml-1 mb-4 min-h-[44px]"
      >
        <ChevronLeft size={16} /> Back
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[20px] font-bold text-[#0D1B2A]">Safety briefing</h2>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            {allAcknowledged
              ? 'All safety points reviewed ✓'
              : `${state.safetyAcks.length} of ${total} reviewed`}
          </p>
        </div>
        <div className="w-12 h-12 rounded-full bg-[#E8F2FB] flex items-center justify-center text-[13px] font-bold text-[#0C447C]">
          {Math.min(state.safetyAcks.length, total)}/{total}
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 mb-6">
        {safetyPoints.map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i < state.safetyAcks.length
                ? 'w-2 h-2 bg-[#1D9E75]'
                : i === current && !allAcknowledged
                ? 'w-3 h-3 bg-[#0C447C]'
                : 'w-2 h-2 bg-[#D0E2F3]'
            )}
          />
        ))}
      </div>

      {/* Safety card or completion state */}
      {!allAcknowledged && point ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.2 }}
            className="bg-[#E8F2FB] rounded-[20px] p-6 border border-[#D0E2F3] min-h-[200px] flex flex-col justify-between"
          >
            <div>
              {point.icon && (
                <div className="w-12 h-12 rounded-[12px] bg-[#0C447C] flex items-center justify-center text-[24px] mb-4">
                  {point.icon}
                </div>
              )}
              <p className="text-[17px] font-medium text-[#0D1B2A] leading-relaxed">
                {point.text}
              </p>
            </div>

            <button
              onClick={acknowledge}
              className="mt-6 w-full h-[52px] rounded-[12px] bg-[#0C447C] text-white font-semibold text-[15px] hover:bg-[#093a6b] transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              ✓ Understood
            </button>
          </motion.div>
        </AnimatePresence>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#E8F9F4] rounded-[20px] p-6 border border-[#1D9E75]/30 text-center"
        >
          <div className="text-[48px] mb-3">✅</div>
          <h3 className="text-[18px] font-bold text-[#1D9E75] mb-2">Safety briefing complete</h3>
          <p className="text-[14px] text-[#6B7C93]">
            You&apos;ve acknowledged all {total} safety points.
          </p>
        </motion.div>
      )}

      {/* Continue — only after all acknowledged */}
      {allAcknowledged && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={onNext}
          className="w-full h-[56px] rounded-[12px] mt-4 bg-[#0C447C] text-white font-semibold text-[16px] hover:bg-[#093a6b] transition-colors"
        >
          Continue to waiver →
        </motion.button>
      )}
    </div>
  )
}
