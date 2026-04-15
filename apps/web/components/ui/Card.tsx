import { cn } from "@/lib/utils/cn";

interface CardProps {
  variant?: "default" | "warn" | "error" | "info";
  className?: string;
  children: React.ReactNode;
}

/**
 * Standard card component — the building block for all dashboard content.
 *
 * Uses a 3px top bar for state indication:
 * - `warn`  → amber bar (license expiry, pending items)
 * - `error` → red bar (expired, compliance block)
 * - `info`  → teal bar (confirmed, success, manifest ready)
 * - default → no bar
 */
export function Card({ variant = "default", className, children }: CardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white border border-border rounded-[14px] p-card",
        className
      )}
    >
      {/* State indicator top bar */}
      {variant === "warn" && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-warn" />
      )}
      {variant === "error" && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-error" />
      )}
      {variant === "info" && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-teal" />
      )}
      {children}
    </div>
  );
}

/**
 * Card header — title with optional icon and right-side action.
 */
interface CardHeadProps {
  title: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: string;
}

export function CardHead({ title, icon, action, subtitle }: CardHeadProps) {
  return (
    <div className="flex items-center justify-between mb-[12px]">
      <div>
        <h2 className="text-[18px] font-bold text-navy flex items-center gap-[7px]">
          {icon && <span className="text-text-mid">{icon}</span>}
          {title}
        </h2>
        {subtitle && (
          <p className="text-[13px] text-text-dim font-normal mt-[2px]">{subtitle}</p>
        )}
      </div>
      {action}
    </div>
  );
}
