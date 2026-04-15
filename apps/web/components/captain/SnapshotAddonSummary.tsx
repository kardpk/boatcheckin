import { Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils/format'
import type { AddonSummaryItem } from '@/types'

export function SnapshotAddonSummary({
  summary,
}: {
  summary: AddonSummaryItem[]
}) {
  return (
    <div className="bg-white rounded-[14px] border border-border overflow-hidden">
      <div className="px-card py-[14px] border-b border-border">
        <h2 className="text-[16px] font-bold text-navy flex items-center gap-[6px]">
          <Package size={16} className="text-text-dim" />
          Add-ons to prepare
        </h2>
      </div>
      <div className="divide-y divide-border">
        {summary.map(item => (
          <div key={item.addonName} className="px-card py-[12px] flex items-center gap-[10px]">
            <div className="w-[36px] h-[36px] rounded-[8px] bg-gold-dim border border-gold-line flex items-center justify-center shrink-0">
              <Package size={16} className="text-gold" />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-navy">
                {item.addonName} × {item.totalQty}
              </p>
              <p className="text-[12px] text-text-mid">
                {item.guestNames.join(', ')}
              </p>
            </div>
            <span className="text-[13px] font-bold text-gold">
              {formatCurrency(item.totalCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
