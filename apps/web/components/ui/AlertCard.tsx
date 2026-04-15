import { cn } from "@/lib/utils/cn";
import { AlertTriangle, AlertCircle, Info, type LucideIcon } from "lucide-react";

const variantConfig: Record<string, {
  bg: string; border: string; bar: string; iconColor: string; titleColor: string; Icon: LucideIcon;
}> = {
  warn: {
    bg: "bg-warn-dim",
    border: "border-warn/15",
    bar: "bg-warn",
    iconColor: "text-warn",
    titleColor: "text-warn",
    Icon: AlertTriangle,
  },
  error: {
    bg: "bg-error-dim",
    border: "border-error/15",
    bar: "bg-error",
    iconColor: "text-error",
    titleColor: "text-error",
    Icon: AlertCircle,
  },
  info: {
    bg: "bg-teal-dim",
    border: "border-teal/15",
    bar: "bg-teal",
    iconColor: "text-teal",
    titleColor: "text-teal",
    Icon: Info,
  },
};

interface AlertCardProps {
  variant: "warn" | "error" | "info";
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Alert card — prominent warning/error/info banner.
 * Features: coloured top bar, icon, title, body, optional action link.
 */
export function AlertCard({ variant, title, children, action, className }: AlertCardProps) {
  const config = variantConfig[variant]!;
  const { Icon } = config;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] px-card py-[14px] border",
        "flex items-start gap-[10px]",
        config.bg,
        config.border,
        className
      )}
    >
      {/* Top bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-[3px]", config.bar)} />

      <Icon size={18} className={cn("shrink-0 mt-[2px]", config.iconColor)} />

      <div className="flex-1 min-w-0">
        <p className={cn("text-[13px] font-bold", config.titleColor)}>{title}</p>
        <div className="text-[14px] text-text mt-[3px] leading-[1.5]">
          {children}
        </div>
        {action && <div className="mt-[6px]">{action}</div>}
      </div>
    </div>
  );
}
