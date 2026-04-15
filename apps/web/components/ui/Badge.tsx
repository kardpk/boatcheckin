import { cn } from "@/lib/utils/cn";
import { Shield, Anchor, HardHat, type LucideIcon } from "lucide-react";

/* ── Role Badges ── */

const roleStyles: Record<string, { className: string; icon: LucideIcon }> = {
  captain: {
    className: "text-gold bg-gold-dim border border-gold-line",
    icon: Shield,
  },
  "first-mate": {
    className: "text-teal bg-teal-dim border border-teal-line",
    icon: Anchor,
  },
  deckhand: {
    className: "text-[#6B4C93] bg-[rgba(107,76,147,0.06)] border border-[rgba(107,76,147,0.18)]",
    icon: HardHat,
  },
};

interface RoleBadgeProps {
  role: "captain" | "first-mate" | "deckhand";
  label?: string;
  className?: string;
}

/**
 * Role badge — Captain (gold), First Mate (teal), Deckhand (purple).
 * Auto-selects the correct icon and colour.
 */
export function RoleBadge({ role, label, className }: RoleBadgeProps) {
  const style = roleStyles[role]!;
  const Icon = style.icon;
  const displayLabel = label ?? role.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[4px] px-[10px] py-[3px] rounded-[5px]",
        "text-[11px] font-bold uppercase tracking-[0.04em]",
        style.className,
        className
      )}
    >
      <Icon size={12} />
      {displayLabel}
    </span>
  );
}

/* ── Status Pills ── */

const statusStyles: Record<string, string> = {
  signed: "text-teal bg-teal-dim",
  boarded: "text-navy bg-[#EBF0F7] border border-border-dark font-bold",
  ready: "text-teal bg-teal-dim",
  pending: "text-warn bg-warn-dim",
  upcoming: "text-gold bg-gold-dim border border-gold-line",
  active: "text-teal bg-teal-dim border border-teal-line",
  completed: "text-text-mid bg-[#F0F2F5]",
  cancelled: "text-error bg-error-dim",
  expired: "text-error bg-error-dim",
  today: "text-navy bg-[#EBF0F7] border border-border-dark font-bold",
};

interface StatusPillProps {
  status: string;
  label?: string;
  className?: string;
}

/**
 * Status pill — contextual label with colour coding.
 * Common statuses: signed, boarded, pending, upcoming, active, completed, cancelled.
 */
export function StatusPill({ status, label, className }: StatusPillProps) {
  const style = statusStyles[status.toLowerCase()] ?? statusStyles['upcoming']!;
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "inline-block px-[10px] py-[4px] rounded-[5px]",
        "text-[10px] font-bold uppercase tracking-[0.05em]",
        style,
        className
      )}
    >
      {displayLabel}
    </span>
  );
}
