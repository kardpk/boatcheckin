import Image from 'next/image'
import { ReadMoreBio } from './ReadMoreBio'
import { LANGUAGE_FLAGS } from '@/lib/i18n/detect'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface CaptainSectionProps {
  captainName: string
  captainPhotoUrl: string | null
  captainBio: string | null
  captainLicense: string | null
  captainLanguages: string[]
  captainYearsExp: number | null
  captainTripCount: number | null
  captainRating: number | null
  captainCertifications: string[]
  tr: TripT
}

export function CaptainSection({
  captainName,
  captainPhotoUrl,
  captainBio,
  captainLicense,
  captainLanguages,
  captainYearsExp,
  captainTripCount,
  captainRating,
  captainCertifications,
  tr,
}: CaptainSectionProps) {
  const initials = captainName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const stats = [
    captainYearsExp != null && { value: captainYearsExp, label: tr.yearsExp },
    captainTripCount != null && { value: captainTripCount, label: tr.trips },
    captainRating != null && { value: captainRating.toFixed(1), label: tr.rating },
  ].filter(Boolean) as { value: number | string; label: string }[]

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-[#D0E2F3] p-5">
      <p className="text-[11px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-4">
        {tr.captain}
      </p>

      {/* Profile row */}
      <div className="flex items-start gap-4 mb-4">
        {/* Photo / initials */}
        <div className="shrink-0">
          {captainPhotoUrl ? (
            <Image
              src={captainPhotoUrl}
              alt={captainName}
              width={72}
              height={72}
              className="w-[72px] h-[72px] rounded-full object-cover"
            />
          ) : (
            <div className="w-[72px] h-[72px] rounded-full bg-[#E8F2FB] flex items-center justify-center text-[22px] font-bold text-[#0C447C]">
              {initials}
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-0">
          <p className="text-[17px] font-semibold text-[#0D1B2A] truncate">
            {captainName}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {captainLicense && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#E8F2FB] text-[#0C447C] text-[11px] font-medium">
                ⚓ {tr.uscgLicensed}
              </span>
            )}
            {captainTripCount != null && (
              <span className="text-[12px] text-[#6B7C93]">
                {captainTripCount} {tr.trips}
              </span>
            )}
            {captainRating != null && (
              <span className="text-[12px] text-amber-500 font-medium">
                ★ {captainRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {stats.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center bg-[#F5F8FC] rounded-[10px] py-2.5 px-2"
            >
              <span className="text-[17px] font-bold text-[#0C447C]">
                {stat.value}
              </span>
              <span className="text-[11px] text-[#6B7C93] text-center mt-0.5">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Languages */}
      {captainLanguages.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[12px] text-[#6B7C93]">{tr.languages}:</span>
          <div className="flex gap-1.5">
            {captainLanguages.map((lang) => (
              <span key={lang} className="text-[18px]">
                {LANGUAGE_FLAGS[lang as keyof typeof LANGUAGE_FLAGS] ?? lang}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bio */}
      {captainBio && <ReadMoreBio bio={captainBio} />}

      {/* Certifications */}
      {captainCertifications.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {captainCertifications.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#F5F8FC] text-[#6B7C93] text-[12px]"
            >
              ✓ {cert}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
