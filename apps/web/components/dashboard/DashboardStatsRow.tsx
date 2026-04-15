import { Anchor, DollarSign, Star } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { DashboardStats } from "@/types";

export function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  const items = [
    {
      label: "Charters this month",
      value: stats.bookingsThisMonth.toString(),
      Icon: Anchor,
    },
    {
      label: "Add-on revenue",
      value: formatCurrency(stats.addonRevenueThisMonthCents),
      Icon: DollarSign,
    },
    {
      label: "Avg rating",
      value: stats.averageRating ? `${stats.averageRating}★` : "—",
      Icon: Star,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-[8px]">
      {items.map((item) => (
        <div
          key={item.label}
          className="
            bg-white rounded-[14px] p-[14px]
            border border-border
          "
        >
          <item.Icon size={18} className="text-text-dim mb-[6px]" />
          <p className="text-[17px] font-bold text-navy">
            {item.value}
          </p>
          <p className="text-[11px] text-text-mid mt-[3px] leading-tight font-medium">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
