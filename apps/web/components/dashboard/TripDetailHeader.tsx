import { formatTripDate, formatTime, formatDuration } from '@/lib/utils/format'
import { TripStatusBadge } from '@/components/ui/TripStatusBadge'
import type { OperatorTripDetail } from '@/types'

export function TripDetailHeader({ trip }: { trip: OperatorTripDetail }) {
  return (
    <div className="mb-5">
      {/* Back link */}
      <a
        href="/dashboard/trips"
        className="text-[13px] text-[#6B7C93] hover:text-[#0C447C] mb-3 inline-flex items-center gap-1"
      >
        ← All trips
      </a>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[20px] font-bold text-[#0D1B2A]">
            {trip.boat.boatName}
          </h1>
          <p className="text-[14px] text-[#6B7C93] mt-0.5">
            {formatTripDate(trip.tripDate)} · {formatTime(trip.departureTime)} · {formatDuration(trip.durationHours)}
          </p>
          <p className="text-[13px] text-[#6B7C93] mt-0.5">
            📍 {trip.boat.marinaName}
            {trip.boat.slipNumber ? ` · Slip ${trip.boat.slipNumber}` : ''}
          </p>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      {/* Trip code */}
      <div className="flex items-center gap-3 mt-3">
        <span className="text-[12px] text-[#6B7C93]">Trip code</span>
        <span className="
          text-[18px] font-mono font-black tracking-[0.2em]
          text-[#0C447C]
        ">
          {trip.tripCode}
        </span>
      </div>

      {/* Buoy policy (if active) */}
      {trip.buoyPolicyId && trip.status === 'active' && (
        <div className="
          mt-3 flex items-center gap-2
          px-3 py-2 rounded-[10px]
          bg-[#E8F9F4] border border-[#1D9E75]/30
        ">
          <span className="text-[12px]">🟢</span>
          <span className="text-[13px] font-medium text-[#1D9E75]">
            Insurance active · Policy {trip.buoyPolicyId}
          </span>
        </div>
      )}
    </div>
  )
}
