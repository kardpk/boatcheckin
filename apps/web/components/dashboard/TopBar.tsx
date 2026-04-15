"use client";

import { Anchor } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

interface TopBarProps {
  operatorName: string;
  operatorId: string;
}

export function TopBar({ operatorName, operatorId }: TopBarProps) {
  // Extract initials from operator name
  const initials = operatorName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 bg-navy">
      <div className="max-w-[768px] mx-auto flex items-center justify-between px-page py-[14px]">
        {/* Brand */}
        <div className="flex items-center gap-[10px]">
          <div className="w-[30px] h-[30px] rounded-full border-[1.5px] border-gold flex items-center justify-center">
            <Anchor size={16} className="text-gold" />
          </div>
          <span className="text-[17px] font-bold text-white tracking-[-0.01em]">
            BoatCheckin
          </span>
        </div>

        {/* Right side: notification bell + avatar */}
        <div className="flex items-center gap-[12px]">
          <NotificationBell operatorId={operatorId} />
          <div className="w-[32px] h-[32px] rounded-full bg-white/12 flex items-center justify-center text-white text-[14px] font-semibold">
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
