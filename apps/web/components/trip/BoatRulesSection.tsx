import type { CustomRuleSection } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface BoatRulesSectionProps {
  houseRules: string | null
  customDos: string[]
  customDonts: string[]
  customRuleSections: CustomRuleSection[]
  tr: TripT
}

export function BoatRulesSection({
  houseRules,
  customDos,
  customDonts,
  customRuleSections,
  tr,
}: BoatRulesSectionProps) {
  const houseRuleLines = houseRules
    ? houseRules.split('\n').map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-[#D0E2F3] p-5 space-y-4">
      <p className="text-[17px] font-semibold text-[#0D1B2A]">{tr.rules}</p>

      {/* House rules */}
      {houseRuleLines.length > 0 && (
        <ul className="space-y-2">
          {houseRuleLines.map((rule, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[14px] text-[#0D1B2A]">
              <span className="text-[#6B7C93] mt-0.5">•</span>
              {rule}
            </li>
          ))}
        </ul>
      )}

      {/* DOs */}
      {customDos.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-[#1D9E75] uppercase tracking-wider mb-2">
            {tr.dos}
          </p>
          <ul className="space-y-2">
            {customDos.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[14px] text-[#0D1B2A]">
                <span className="text-[#1D9E75] font-bold mt-0.5">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* DON'Ts */}
      {customDonts.length > 0 && (
        <div>
          <p className="text-[12px] font-semibold text-[#E8593C] uppercase tracking-wider mb-2">
            {tr.donts}
          </p>
          <ul className="space-y-2">
            {customDonts.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[14px] text-[#0D1B2A]">
                <span className="text-[#E8593C] font-bold mt-0.5">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Custom rule sections */}
      {customRuleSections.map((section, i) => (
        <div key={section.id} className={i > 0 ? 'pt-4 border-t border-[#F5F8FC]' : ''}>
          <p className="text-[14px] font-semibold text-[#0D1B2A] mb-2">
            {section.title}
          </p>
          {section.type === 'numbered' ? (
            <ol className="space-y-2 list-none">
              {section.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[14px] text-[#0D1B2A]">
                  <span className="text-[#6B7C93] shrink-0">{idx + 1}.</span>
                  {item}
                </li>
              ))}
            </ol>
          ) : section.type === 'check' ? (
            <ul className="space-y-2">
              {section.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[14px] text-[#0D1B2A]">
                  <span className="text-[#0C447C] mt-0.5">☑</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-2">
              {section.items.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[14px] text-[#0D1B2A]">
                  <span className="text-[#6B7C93] mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  )
}
