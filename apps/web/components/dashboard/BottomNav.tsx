"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Anchor, TrendingUp, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/trips", icon: Anchor, label: "Trips" },
  { href: "/dashboard/revenue", icon: TrendingUp, label: "Revenue" },
  { href: "/dashboard/guests", icon: Users, label: "Guests" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border md:hidden">
      <div className="flex h-[56px]">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-[2px] transition-colors",
                isActive
                  ? "text-navy border-t-2 border-navy"
                  : "text-grey-text"
              )}
            >
              <tab.icon size={20} />
              <span className="text-micro">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
