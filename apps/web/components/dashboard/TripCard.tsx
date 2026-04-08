'use client'

import Link from 'next/link'
import { formatTripDate, formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import { cn } from '@/lib/utils/cn'
import type { TripStatus } from '@/types'

interface TripCardProps {
  tripId: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: TripStatus
  boatName: string
  marinaName: string
  slipNumber: string | null
  guestCount: number
  waiversSigned: number
  requiresApproval: boolean
}

export function TripCard({
  tripId,
  tripCode,
  tripDate,
  departureTime,
  durationHours,
  maxGuests,
  status,
  boatName,
  marinaName,
  slipNumber,
  guestCount,
  waiversSigned,
  requiresApproval,
}: TripCardProps) {
  const guestPercent = maxGuests > 0 ? (guestCount / maxGuests) * 100 : 0

  return (
    <Link
      href={`/dashboard/trips/${tripId}`}
      className="block p-5 bg-white border border-[#D0E2F3] rounded-[16px] hover:border-[#A8C4E0] transition-colors shadow-[0_1px_4px_rgba(12,68,124,0.06)]"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[15px] font-semibold text-[#0D1B2A]">{boatName}</p>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            {formatTripDate(tripDate)} · {departureTime.slice(0, 5)} ·{' '}
            {formatDuration(durationHours)}
          </p>
        </div>
        <TripStatusBadge status={status} />
      </div>

      {/* Marina */}
      <p className="text-[13px] text-[#6B7C93] mb-3">
        📍 {marinaName}
        {slipNumber ? ` · Slip ${slipNumber}` : ''}
      </p>

      {/* Guest progress bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#6B7C93]">
            {guestCount} / {maxGuests} checked in
          </span>
          <span className="text-[12px] text-[#6B7C93]">
            {waiversSigned} waiver{waiversSigned !== 1 ? 's' : ''} signed
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#E8F2FB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(guestPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Trip code + approval badge */}
      <div className="mt-3 flex items-center gap-2 pt-3 border-t border-[#F5F8FC]">
        <span className="text-[11px] text-[#6B7C93]">Code</span>
        <span className="text-[14px] font-mono font-bold text-[#0C447C]">{tripCode}</span>
        {requiresApproval && (
          <span
            className={cn(
              'ml-auto text-[11px] px-2 py-0.5 rounded-full',
              'bg-[#FEF3DC] text-[#E5910A] font-medium',
            )}
          >
            Manual approval on
          </span>
        )}
      </div>
    </Link>
  )
}
