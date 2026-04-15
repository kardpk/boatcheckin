import type { TripT } from '@/lib/i18n/tripTranslations'

interface ActiveTripBannerProps {
  boatName: string
  marinaName: string
  slipNumber: string | null
  startedAt: string | null
  tr: TripT
}

export function ActiveTripBanner({
  marinaName,
  slipNumber,
  tr,
}: ActiveTripBannerProps) {
  return (
    <div className="bg-[#1D9E75] text-white py-3 px-5 text-center">
      <p className="text-[14px] font-semibold">{tr.activeBanner}</p>
      <p className="text-[13px] text-white/90 mt-0.5">
        {tr.headTo} {slipNumber ? `Slip ${slipNumber} · ` : ''}{marinaName}
      </p>
    </div>
  )
}
