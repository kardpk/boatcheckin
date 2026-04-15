import { ShieldCheck } from 'lucide-react'
import { SafetyExpand } from './SafetyExpand'
import type { SafetyPoint } from '@/lib/trip/getTripPageData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface SafetySectionProps {
  safetyPoints: SafetyPoint[]
  tr: TripT
}

export function SafetySection({ safetyPoints, tr }: SafetySectionProps) {
  const alwaysVisible = safetyPoints.slice(0, 2)
  const expandable = safetyPoints.slice(2)

  return (
    <div className="mx-4 mt-3 bg-gold-dim rounded-[16px] p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center">
          <ShieldCheck size={16} className="text-white" />
        </div>
        <p className="text-[17px] font-semibold text-navy">{tr.safety}</p>
      </div>

      {/* Always-visible first 2 points */}
      <ul className="divide-y divide-[#D0E2F3]">
        {alwaysVisible.map((point) => (
          <SafetyPointItem key={point.id} point={point} />
        ))}
      </ul>

      {/* Expandable extra points */}
      {expandable.length > 0 && (
        <SafetyExpand points={expandable} label={tr.safetyExpand} />
      )}

      {/* noscript: show all */}
      <noscript>
        <ul className="divide-y divide-[#D0E2F3] mt-2">
          {expandable.map((point) => (
            <SafetyPointItem key={point.id} point={point} />
          ))}
        </ul>
      </noscript>

      {/* Emergency contacts */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <p className="text-[13px] font-semibold text-navy">
          🆘 {tr.emergency}
        </p>
        <p className="text-[13px] text-text-mid">{tr.coastGuard} — {tr.vhf16}</p>
        <p className="text-[13px] text-text-mid">Local marina: contact operator</p>
      </div>
    </div>
  )
}

function SafetyPointItem({ point }: { point: SafetyPoint }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <div className="w-5 h-5 rounded-full bg-navy flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-white text-[10px] font-bold">✓</span>
      </div>
      <p className="text-[14px] text-navy leading-snug">{point.text}</p>
    </li>
  )
}
