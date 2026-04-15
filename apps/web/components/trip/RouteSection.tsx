import { MarinaMap } from './MarinaMap'
import type { RouteStop } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface RouteSectionProps {
  lat: number
  lng: number
  marinaName: string
  slipNumber: string | null
  routeDescription: string | null
  routeStops: RouteStop[]
  tr: TripT
}

export function RouteSection({
  lat,
  lng,
  marinaName,
  slipNumber,
  routeDescription,
  routeStops,
  tr,
}: RouteSectionProps) {
  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-border overflow-hidden">
      <p className="text-[11px] font-semibold text-text-mid uppercase tracking-wider px-5 pt-5 mb-3">
        {tr.route}
      </p>

      {/* Interactive map */}
      <MarinaMap
        lat={lat}
        lng={lng}
        marinaName={marinaName}
        slipNumber={slipNumber}
      />

      {/* Below-map info */}
      <div className="px-5 py-4 space-y-2">
        <p className="text-[15px] font-semibold text-navy">{marinaName}</p>

        {routeDescription && (
          <p className="text-[14px] text-text-mid italic leading-relaxed">
            {routeDescription}
          </p>
        )}

        {routeStops.length > 0 && (
          <div className="flex items-center flex-wrap gap-1 text-[13px] text-text-mid">
            {routeStops.map((stop, idx) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="font-medium text-navy">{stop.name}</span>
                {idx < routeStops.length - 1 && (
                  <span className="text-[#D0E2F3]">→</span>
                )}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
