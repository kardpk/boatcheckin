import { formatCurrency } from '@/lib/utils/format'
import type { AddonSummaryItem } from '@/types'

export function SnapshotAddonSummary({
  summary,
}: {
  summary: AddonSummaryItem[]
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
          Add-ons to prepare
        </h2>
      </div>
      <div className="divide-y divide-[#F5F8FC]">
        {summary.map(item => (
          <div key={item.addonName} className="px-5 py-3.5 flex items-center gap-3">
            <span className="text-[22px]">{item.emoji}</span>
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[#0D1B2A]">
                {item.addonName} × {item.totalQty}
              </p>
              <p className="text-[12px] text-[#6B7C93]">
                {item.guestNames.join(', ')}
              </p>
            </div>
            <span className="text-[13px] font-bold text-[#0C447C]">
              {formatCurrency(item.totalCents)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
