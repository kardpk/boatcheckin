'use client'

import { cn } from '@/lib/utils/cn'
import type { RealtimeStatus } from '@/types'

export function RealtimeIndicator({
  status,
}: {
  status: RealtimeStatus
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn(
        'w-2 h-2 rounded-full',
        status === 'connected' && 'bg-[#1D9E75] animate-pulse',
        status === 'connecting' && 'bg-[#E5910A]',
        status === 'disconnected' && 'bg-border',
        status === 'error' && 'bg-[#D63B3B]',
      )} />
      <span className="text-[11px] text-text-mid hidden md:inline">
        {status === 'connected' ? 'Live' : status}
      </span>
    </div>
  )
}
