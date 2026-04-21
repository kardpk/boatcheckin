"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ship, Anchor, Users, Settings, Plus, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const tabs = [
  { href: "/dashboard",            icon: LayoutGrid, label: "Today" },
  { href: "/dashboard/trips",      icon: Anchor,     label: "Trips" },
  { href: "/dashboard/boats",      icon: Ship,       label: "Fleet" },
  { href: "/dashboard/captains",   icon: Users,      label: "Crew"  },
  { href: "/dashboard/settings",   icon: Settings,   label: "More"  },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const isTripsRoot = pathname === "/dashboard/trips";

  // Optimistic tab: immediately highlight the tapped tab before
  // the server responds. Clears on actual pathname change.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleTabClick = useCallback((href: string) => {
    setPendingHref(href);
    // Clear after navigation completes (pathname will update)
    // Safety timeout in case navigation is very fast
    setTimeout(() => setPendingHref(null), 2000);
  }, []);

  // Clear pending state when pathname actually changes
  if (pendingHref && pathname.startsWith(pendingHref === "/dashboard" ? "/dashboard" : pendingHref)) {
    if (pendingHref !== null) {
      // Schedule clear on next tick to avoid setState during render
      setTimeout(() => setPendingHref(null), 0);
    }
  }

  return (
    <>
      {/* ── FAB: create new trip (trips page only) ── */}
      {isTripsRoot && (
        <Link
          href="/dashboard/trips/new"
          className="fixed bottom-[72px] right-5 z-50 flex items-center justify-center"
          style={{
            width: "52px",
            height: "52px",
            background: "var(--color-rust)",
            border: "var(--border-w) solid var(--color-rust)",
            borderRadius: "var(--r-1)", /* sharp not pill-shaped per R5 */
            color: "var(--color-bone)",
            boxShadow: "var(--shadow-float)",
            transition: "background var(--dur-fast) var(--ease)",
          }}
          aria-label="Create new trip"
        >
          <Plus size={22} strokeWidth={2.5} />
        </Link>
      )}

      {/* ── Bottom nav bar ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: "var(--color-paper)",
          borderTop: "var(--border-w) solid var(--color-line-soft)",
        }}
      >
        <div
          className="max-w-[768px] mx-auto flex"
          style={{
            height: "56px",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          {tabs.map((tab) => {
            // Highlight if this is the current route OR the optimistically tapped tab
            const isActive = pendingHref
              ? tab.href === pendingHref
              : tab.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                prefetch={true}
                onClick={() => handleTabClick(tab.href)}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center",
                  "transition-colors"
                )}
                style={{
                  gap: "3px",
                  color: isActive
                    ? "var(--color-rust)"
                    : "var(--color-ink-muted)",
                }}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className="font-mono"
                  style={{
                    fontSize: "var(--t-mono-xs)",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
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
