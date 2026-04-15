import Link from "next/link";
import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { formatTripDate, formatTime } from "@/lib/utils/format";
import type { OperatorTripDetail } from "@/types";

export function UpcomingTripsList({ trips }: { trips: OperatorTripDetail[] }) {
  return (
    <div>
      <div className="flex items-center gap-[8px] mb-[10px]">
        <h2 className="text-[16px] font-bold text-navy">Coming up</h2>
        <div className="w-[22px] h-[2px] bg-gold rounded-[1px]" />
      </div>
      <div className="space-y-[8px]">
        {trips.map((trip) => {
          const guestCount = trip.guests.length;
          const signed = trip.guests.filter((g) => g.waiverSigned).length;
          return (
            <Link
              key={trip.id}
              href={`/dashboard/trips/${trip.id}`}
              className="
                flex items-center gap-[12px] p-[14px]
                bg-white rounded-[14px] border border-border
                hover:border-gold/40 transition-colors
              "
            >
              {/* Date block */}
              <div className="
                w-[46px] h-[46px] rounded-[10px] bg-gold-dim border border-gold-line
                flex flex-col items-center justify-center flex-shrink-0
              ">
                <span className="text-[10px] text-text-dim leading-none font-semibold uppercase">
                  {formatTripDate(trip.tripDate).split(",")[0]}
                </span>
                <span className="text-[16px] font-bold text-navy leading-tight">
                  {new Date(trip.tripDate + "T00:00:00").getDate()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-navy truncate">
                  {trip.boat.boatName}
                </p>
                <p className="text-[12px] text-text-mid flex items-center gap-[4px] mt-[2px]">
                  <MapPin size={11} />
                  {formatTime(trip.departureTime)} · {trip.boat.marinaName}
                </p>
              </div>

              {/* Guest progress */}
              <div className="text-right flex-shrink-0">
                <p className="text-[13px] font-bold text-navy">
                  {guestCount}/{trip.maxGuests}
                </p>
                <p className="text-[11px] text-text-dim font-medium">
                  {signed} signed
                </p>
              </div>

              <ChevronRight size={16} className="text-text-dim shrink-0" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
