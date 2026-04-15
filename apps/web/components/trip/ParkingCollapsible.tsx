'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function ParkingCollapsible({
  text,
  label,
}: {
  text: string
  label: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-[14px] font-medium text-text-mid hover:text-navy transition-colors min-h-[44px]"
      >
        🅿️ {label}
        <ChevronDown
          size={15}
          className={cn('transition-transform', open ? 'rotate-180' : '')}
        />
      </button>
      {open && (
        <p className="mt-2 text-[14px] text-navy leading-relaxed whitespace-pre-line">
          {text}
        </p>
      )}
      <noscript>
        <p className="mt-2 text-[14px] text-navy leading-relaxed whitespace-pre-line">
          {text}
        </p>
      </noscript>
    </div>
  )
}
