"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Ship, Anchor, UserCog, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/boats", icon: Ship, label: "Boats" },
  { href: "/dashboard/trips", icon: Anchor, label: "Trips" },
  { href: "/dashboard/captains", icon: UserCog, label: "Crew" },
  { href: "/dashboard/guests", icon: Users, label: "Guests" },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const isTripsRoot = pathname === "/dashboard/trips";

  return (
    <>
      {/* ── Floating action button (trips page only) ── */}
      {isTripsRoot && (
        <Link
          href="/dashboard/trips/new"
          className="fixed bottom-[72px] right-5 z-50 w-[52px] h-[52px] rounded-full bg-[#0C447C] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(12,68,124,0.25)] hover:bg-[#093a6b] transition-colors md:hidden"
          aria-label="Create new trip"
        >
          <Plus size={24} />
        </Link>
      )}

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
    </>
  );
}

