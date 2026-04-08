import { CalendarDays } from 'lucide-react'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface CancellationSectionProps {
  policy: string
  tripDate: string
  tr: TripT
}

type CancellationTier = 'full' | 'partial' | 'none'

function getDaysUntilTrip(tripDate: string): number {
  const now = new Date()
  const trip = new Date(tripDate + 'T00:00:00')
  return Math.ceil((trip.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getActiveTier(days: number): CancellationTier {
  if (days > 48) return 'full'
  if (days > 24) return 'partial'
  return 'none'
}

export function CancellationSection({ policy, tripDate, tr }: CancellationSectionProps) {
  const lines = policy.split('\n').map((l) => l.trim()).filter(Boolean)
  const hasTimeline = policy.includes('48') || policy.includes('24')
  const days = getDaysUntilTrip(tripDate)
  const activeTier = getActiveTier(days)

  const tiers = [
    {
      key: 'full' as CancellationTier,
      dot: '🟢',
      label: '48+ hours before',
      refund: 'Full refund',
    },
    {
      key: 'partial' as CancellationTier,
      dot: '🟡',
      label: '24–48 hours before',
      refund: '50% refund',
    },
    {
      key: 'none' as CancellationTier,
      dot: '🔴',
      label: 'Under 24 hours',
      refund: 'No refund',
    },
  ]

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-[#D0E2F3] p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays size={16} className="text-[#6B7C93]" />
        <p className="text-[17px] font-semibold text-[#0D1B2A]">{tr.cancellation}</p>
      </div>

      {/* Timeline (if policy mentions 48/24) */}
      {hasTimeline && (
        <div className="mb-4 space-y-3">
          {tiers.map((tier) => (
            <div
              key={tier.key}
              className={`flex items-center gap-3 p-3 rounded-[10px] transition-colors ${
                activeTier === tier.key ? 'bg-[#F5F8FC]' : ''
              }`}
            >
              <span className="text-[18px]">{tier.dot}</span>
              <div className="flex-1">
                <p className={`text-[14px] ${activeTier === tier.key ? 'font-semibold text-[#0D1B2A]' : 'text-[#6B7C93]'}`}>
                  {tier.label}
                </p>
              </div>
              <span className={`text-[13px] font-medium ${activeTier === tier.key ? 'text-[#0C447C]' : 'text-[#6B7C93]'}`}>
                {tier.refund}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Policy text */}
      {lines.length > 1 ? (
        <ul className="space-y-1.5">
          {lines.map((line, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[14px] text-[#0D1B2A]">
              <span className="text-[#6B7C93] mt-0.5">•</span>
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-[#0D1B2A] leading-relaxed">{policy}</p>
      )}
    </div>
  )
}
