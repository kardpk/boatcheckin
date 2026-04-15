"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Ship, Anchor, Users, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/dashboard/boats", icon: Ship, label: "Boats" },
  { href: "/dashboard/trips", icon: Anchor, label: "Trips" },
  { href: "/dashboard/captains", icon: Users, label: "Crew" },
  { href: "/dashboard/settings", icon: Settings, label: "More" },
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
          className="fixed bottom-[72px] right-5 z-50 w-[52px] h-[52px] rounded-full bg-gold text-white flex items-center justify-center shadow-[0_4px_16px_rgba(184,136,42,0.3)] hover:bg-gold-hi transition-colors"
          aria-label="Create new trip"
        >
          <Plus size={24} />
        </Link>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border">
        <div className="max-w-[768px] mx-auto flex h-[56px]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
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
                  "flex-1 flex flex-col items-center justify-center gap-[3px] transition-colors",
                  isActive
                    ? "text-gold"
                    : "text-navy"
                )}
              >
                <tab.icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={cn(
                  "text-[10.5px]",
                  isActive ? "font-bold" : "font-semibold"
                )}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
