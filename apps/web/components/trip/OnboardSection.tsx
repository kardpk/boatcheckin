import type { TripT } from '@/lib/i18n/tripTranslations'

interface OnboardSectionProps {
  selectedEquipment: string[]
  selectedAmenities: Record<string, boolean>
  specificFieldValues: Record<string, unknown>
  onboardInfo: Record<string, unknown>
  boatTypeKey: string
  tr: TripT
}

const SKIP_KEYS = new Set([
  'id', 'sort', 'order', 'type', 'key', 'boatTypeKey', 'boat_type_key',
])

function formatValue(val: unknown): string | null {
  if (val === null || val === undefined || val === '' || val === false) return null
  if (val === true) return 'Yes'
  if (typeof val === 'number') return String(val)
  return String(val)
}

function humanLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim()
}

export function OnboardSection({
  selectedEquipment,
  selectedAmenities,
  specificFieldValues,
  onboardInfo,
}: OnboardSectionProps) {
  const activeAmenities = Object.entries(selectedAmenities)
    .filter(([, v]) => v === true)
    .map(([k]) => k)

  const fieldEntries = Object.entries(specificFieldValues).filter(
    ([k, v]) => !SKIP_KEYS.has(k) && formatValue(v) !== null,
  )

  const onboardEntries = Object.entries(onboardInfo).filter(
    ([k, v]) => !SKIP_KEYS.has(k) && formatValue(v) !== null,
  )

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-[#D0E2F3] p-5 space-y-5">
      {/* Equipment */}
      {selectedEquipment.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-2">
            Equipment included
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedEquipment.map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full bg-[#E8F2FB] text-[#0C447C] text-[12px] font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Amenities */}
      {activeAmenities.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-2">
            Amenities
          </p>
          <div className="flex flex-wrap gap-2">
            {activeAmenities.map((item) => (
              <span
                key={item}
                className="px-3 py-1 rounded-full bg-[#E8F2FB] text-[#0C447C] text-[12px] font-medium"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Specific field values */}
      {fieldEntries.length > 0 && (
        <div className="space-y-2">
          {fieldEntries.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2">
              <span className="text-[12px] text-[#6B7C93] shrink-0">{humanLabel(k)}:</span>
              <span className="text-[14px] text-[#0D1B2A]">{formatValue(v)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Custom onboard info (WiFi passwords etc) */}
      {onboardEntries.length > 0 && (
        <div className="border-t border-[#F5F8FC] pt-4 space-y-2">
          {onboardEntries.map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2">
              <span className="text-[12px] text-[#6B7C93] shrink-0">{humanLabel(k)}:</span>
              <span className="text-[14px] text-[#0D1B2A] font-medium">{formatValue(v)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
