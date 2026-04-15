import { formatCurrency } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import type { AddonSummaryItem } from '@/types'

export function AddonOrdersSummary({
  summary, className,
}: {
  summary: AddonSummaryItem[]
  className?: string
}) {
  const totalRevenue = summary.reduce((s, i) => s + i.totalCents, 0)

  return (
    <div className={cn(
      'bg-white rounded-[14px] border border-border',
      'shadow-[0_1px_4px_rgba(12,68,124,0.06)] overflow-hidden',
      className
    )}>
      <div className="px-5 py-4 border-b border-border flex justify-between items-center">
        <h2 className="text-[16px] font-semibold text-navy">
          Add-on orders
        </h2>
        <span className="text-[15px] font-bold text-navy">
          {formatCurrency(totalRevenue)}
        </span>
      </div>
      <div className="divide-y divide-border">
        {summary.map(item => (
          <div key={item.addonName} className="px-5 py-3 flex items-center gap-3">
            <span className="text-[22px]">{item.emoji}</span>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-navy">
                {item.addonName} ×{item.totalQty}
              </p>
              <p className="text-[12px] text-text-mid">
                {item.guestNames.join(', ')}
              </p>
            </div>
            <span className="text-[14px] font-bold text-navy">
              {formatCurrency(item.totalCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
