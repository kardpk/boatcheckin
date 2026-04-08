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
        <h2 className="text-[20px] font-bold text-[#0D1B2A] mb-1">
          Florida boating course
        </h2>
        <p className="text-[14px] text-[#6B7C93]">
          Florida law requires all boat operators born after January 1, 1988 to
          complete an approved safety course.
        </p>
      </div>

      {/* Paid course */}
      <a
        href="https://www.boat-ed.com/florida/"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 rounded-[16px] border border-[#D0E2F3] bg-[#F5F8FC] hover:border-[#0C447C] transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[15px] font-semibold text-[#0D1B2A] mb-1">
              Boat-Ed Florida Course
            </p>
            <p className="text-[13px] text-[#6B7C93]">
              NASBLA-approved. ~$30. Certificate valid 90 days.
            </p>
          </div>
          <ExternalLink size={16} className="text-[#6B7C93] flex-shrink-0 mt-0.5" />
        </div>
      </a>

      {/* Free course */}
      <a
        href="https://www.boatus.org/free-online-boating-course/"
        target="_blank"
        rel="noopener noreferrer"
        className="block p-5 rounded-[16px] border border-[#D0E2F3] bg-[#F5F8FC] hover:border-[#1D9E75] transition-colors"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-block text-[11px] font-semibold bg-[#E8F9F4] text-[#1D9E75] px-2 py-0.5 rounded-full mb-1">
              FREE
            </div>
            <p className="text-[15px] font-semibold text-[#0D1B2A]">
              BoatUS Foundation Course
            </p>
            <p className="text-[13px] text-[#6B7C93]">
              Free NASBLA-approved course.
            </p>
          </div>
          <ExternalLink size={16} className="text-[#6B7C93] flex-shrink-0 mt-0.5" />
        </div>
      </a>

      <button
        onClick={onNext}
        className="w-full h-[56px] rounded-[12px] bg-[#0C447C] text-white font-semibold text-[16px] hover:bg-[#093a6b] transition-colors"
      >
        Continue →
      </button>

      <p className="text-[12px] text-[#6B7C93] text-center">
        You can complete the course before your charter date
      </p>
    </div>
  )
}
