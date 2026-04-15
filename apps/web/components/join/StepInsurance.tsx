'use client'

import { ExternalLink } from 'lucide-react'

export function StepInsurance({
  onNext,
}: {
  charterType: string
  onNext: () => void
}) {
  return (
    <div className="pt-2 space-y-5">
      <div>
        <h2 className="text-[20px] font-bold text-navy mb-1">
          Florida boating course
        </h2>
        <p className="text-[14px] text-text-mid">
          Florida law requires all boat operators born after January 1, 1988 to
          complete an approved safety course.
        </p>
      </div>

      {/* Paid course */}
      <a
        href="https://www.boat-ed.com/florida/"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 rounded-[14px] border border-border bg-bg hover:border-gold transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-navy mb-1">
              Boat-Ed Florida Course
            </p>
            <p className="text-[13px] text-text-mid">
              NASBLA-approved. ~$30. Certificate valid 90 days.
            </p>
          </div>
          <ExternalLink size={16} className="text-text-mid flex-shrink-0 mt-0.5" />
        </div>
      </a>

      {/* Free course */}
      <a
        href="https://www.boatus.org/free-online-boating-course/"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 rounded-[14px] border border-border bg-bg hover:border-[#1D9E75] transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-block text-[11px] font-semibold bg-[#E8F9F4] text-teal px-2 py-0.5 rounded-full mb-1">
              FREE
            </div>
            <p className="text-[15px] font-semibold text-navy">
              BoatUS Foundation Course
            </p>
            <p className="text-[13px] text-text-mid">
              Free NASBLA-approved course.
            </p>
          </div>
          <ExternalLink size={16} className="text-text-mid flex-shrink-0 mt-0.5" />
        </div>
      </a>

      <button
        onClick={onNext}
        className="w-full h-[56px] rounded-[12px] bg-navy text-white font-semibold text-[16px] hover:bg-navy/90 transition-colors"
      >
        Continue →
      </button>

      <p className="text-[12px] text-text-mid text-center">
        You can complete the course before your charter date
      </p>
    </div>
  )
}
