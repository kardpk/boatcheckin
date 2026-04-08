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
      'bg-white rounded-[20px] border border-[#D0E2F3]',
      'shadow-[0_1px_4px_rgba(12,68,124,0.06)] overflow-hidden',
      className
    )}>
      <div className="px-5 py-4 border-b border-[#F5F8FC] flex justify-between items-center">
        <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
          Add-on orders
        </h2>
        <span className="text-[15px] font-bold text-[#0C447C]">
          {formatCurrency(totalRevenue)}
        </span>
      </div>
      <div className="divide-y divide-[#F5F8FC]">
        {summary.map(item => (
          <div key={item.addonName} className="px-5 py-3 flex items-center gap-3">
            <span className="text-[22px]">{item.emoji}</span>
            <div className="flex-1">
              <p className="text-[14px] font-medium text-[#0D1B2A]">
                {item.addonName} ×{item.totalQty}
              </p>
              <p className="text-[12px] text-[#6B7C93]">
                {item.guestNames.join(', ')}
              </p>
            </div>
            <span className="text-[14px] font-bold text-[#0C447C]">
              {formatCurrency(item.totalCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
