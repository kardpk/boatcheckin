import Link from 'next/link'
import { formatTripDate, formatTime } from '@/lib/utils/format'
import type { OperatorTripDetail } from '@/types'

export function UpcomingTripsList({ trips }: { trips: OperatorTripDetail[] }) {
  return (
    <div>
      <h2 className="text-[16px] font-semibold text-[#0D1B2A] mb-3">
        Coming up
      </h2>
      <div className="space-y-2">
        {trips.map(trip => {
          const guestCount = trip.guests.length
          const signed = trip.guests.filter(g => g.waiverSigned).length
          return (
            <Link
              key={trip.id}
              href={`/dashboard/trips/${trip.id}`}
              className="
                flex items-center gap-4 p-4
                bg-white rounded-[16px] border border-[#D0E2F3]
                shadow-[0_1px_4px_rgba(12,68,124,0.06)]
                hover:border-[#0C447C] transition-colors
              "
            >
              {/* Date block */}
              <div className="
                w-12 h-12 rounded-[10px] bg-[#E8F2FB]
                flex flex-col items-center justify-center flex-shrink-0
              ">
                <span className="text-[11px] text-[#6B7C93] leading-none">
                  {formatTripDate(trip.tripDate).split(',')[0]}
                </span>
                <span className="text-[15px] font-bold text-[#0C447C] leading-tight">
                  {new Date(trip.tripDate + 'T00:00:00').getDate()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[#0D1B2A] truncate">
                  {trip.boat.boatName}
                </p>
                <p className="text-[12px] text-[#6B7C93]">
                  {formatTime(trip.departureTime)} · {trip.boat.marinaName}
                </p>
              </div>

              {/* Guest progress */}
              <div className="text-right flex-shrink-0">
                <p className="text-[13px] font-semibold text-[#0C447C]">
                  {guestCount}/{trip.maxGuests}
                </p>
                <p className="text-[11px] text-[#6B7C93]">
                  {signed} signed
                </p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
