'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { SafetyPoint } from '@/lib/trip/getTripPageData'

export function SafetyExpand({
  points,
  label,
}: {
  points: SafetyPoint[]
  label: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-[13px] font-medium text-[#0C447C] mt-3 min-h-[44px]"
      >
        <ChevronDown
          size={15}
          className={cn('transition-transform', open ? 'rotate-180' : '')}
        />
        {label} ({points.length} more)
      </button>

      {open && (
        <ul className="divide-y divide-[#D0E2F3] border-t border-[#D0E2F3] mt-1">
          {points.map((point) => (
            <li key={point.id} className="flex items-start gap-3 py-3">
              <div className="w-5 h-5 rounded-full bg-[#0C447C] flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
              <p className="text-[14px] text-[#0D1B2A] leading-snug">{point.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
