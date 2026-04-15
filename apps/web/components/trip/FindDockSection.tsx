import { MapPin, ExternalLink } from 'lucide-react'
import { ParkingCollapsible } from './ParkingCollapsible'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface FindDockSectionProps {
  marinaName: string
  marinaAddress: string
  slipNumber: string | null
  parkingInstructions: string | null
  operatingArea: string | null
  lat: number | null
  lng: number | null
  tr: TripT
}

export function FindDockSection({
  marinaName,
  marinaAddress,
  slipNumber,
  parkingInstructions,
  operatingArea,
  lat,
  lng,
  tr,
}: FindDockSectionProps) {
  const mapsUrl = lat && lng
    ? `https://maps.google.com/?q=${lat},${lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(marinaAddress || marinaName)}`

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-border p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gold-dim flex items-center justify-center">
          <MapPin size={16} className="text-navy" />
        </div>
        <p className="text-[17px] font-semibold text-navy">{tr.findDock}</p>
      </div>

      {/* Marina info */}
      <p className="text-[15px] font-semibold text-navy">{marinaName}</p>
      {marinaAddress && (
        <p className="text-[14px] text-text-mid mt-1">{marinaAddress}</p>
      )}

      {/* Slip badge */}
      {slipNumber && (
        <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full bg-[#E8F9F4] text-teal text-[13px] font-medium">
          {tr.slip} {slipNumber}
        </span>
      )}

      {/* Open in Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 h-[44px] text-[14px] font-medium text-navy hover:text-[#093a6b] transition-colors"
      >
        <ExternalLink size={15} />
        {tr.openMaps}
      </a>

      {/* Parking collapsible */}
      {parkingInstructions && (
        <div className="mt-3 border-t border-border pt-3">
          <ParkingCollapsible text={parkingInstructions} label={tr.parkingNote} />
        </div>
      )}

      {/* Operating area */}
      {operatingArea && (
        <p className="mt-3 text-[13px] text-text-mid">
          Operating area: {operatingArea}
        </p>
      )}
    </div>
  )
}
