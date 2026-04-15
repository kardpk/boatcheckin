'use client'

import Link from 'next/link'
import { MapPin } from 'lucide-react'
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
      className="block p-card bg-white border border-border rounded-[14px] hover:border-gold/40 transition-colors"
    >
      {/* Header row */}
      <div className="flex items-start justify-between mb-[10px]">
        <div>
          <p className="text-[15px] font-bold text-navy">{boatName}</p>
          <p className="text-[13px] text-text-mid mt-[3px]">
            {formatTripDate(tripDate)} · {departureTime.slice(0, 5)} ·{' '}
            {formatDuration(durationHours)}
          </p>
        </div>
        <TripStatusBadge status={status} />
      </div>

      {/* Marina */}
      <p className="text-[13px] text-text-mid mb-[10px] flex items-center gap-[4px]">
        <MapPin size={13} className="text-text-dim" />
        {marinaName}
        {slipNumber ? ` · Slip ${slipNumber}` : ''}
      </p>

      {/* Guest progress bar */}
      <div className="space-y-[5px]">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-text-mid font-medium">
            {guestCount} / {maxGuests} checked in
          </span>
          <span className="text-[12px] text-text-mid font-medium">
            {waiversSigned} waiver{waiversSigned !== 1 ? 's' : ''} signed
          </span>
        </div>
        <div className="w-full h-[5px] bg-[#EBF0F7] rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-500"
            style={{ width: `${Math.min(guestPercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Trip code + approval badge */}
      <div className="mt-[10px] flex items-center gap-[8px] pt-[10px] border-t border-border">
        <span className="text-[11px] text-text-dim font-medium">Code</span>
        <span className="text-[14px] font-mono font-bold text-gold">{tripCode}</span>
        {requiresApproval && (
          <span
            className={cn(
              'ml-auto text-[10px] px-[8px] py-[3px] rounded-[5px]',
              'bg-warn-dim text-warn font-bold uppercase tracking-[0.04em]',
            )}
          >
            Manual approval
          </span>
        )}
      </div>
    </Link>
  )
}
