import { formatCurrency } from '@/lib/utils/format'
import type { DashboardStats } from '@/types'

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: 'Charters this month',
      value: stats.bookingsThisMonth.toString(),
      icon: '⚓',
    },
    {
      label: 'Add-on revenue',
      value: formatCurrency(stats.addonRevenueThisMonthCents),
      icon: '💰',
    },
    {
      label: 'Avg rating',
      value: stats.averageRating ? `${stats.averageRating}★` : '—',
      icon: '⭐',
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(item => (
        <div
          key={item.label}
          className="
            bg-white rounded-[16px] p-4
            border border-[#D0E2F3]
            shadow-[0_1px_4px_rgba(12,68,124,0.06)]
          "
        >
          <div className="text-[20px] mb-1">{item.icon}</div>
          <p className="text-[17px] font-bold text-[#0D1B2A]">
            {item.value}
          </p>
          <p className="text-[11px] text-[#6B7C93] mt-0.5 leading-tight">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  )
}
