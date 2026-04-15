import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

const variantStyles: Record<string, string> = {
  default: "text-text-mid bg-white border-border",
  teal: "text-teal bg-teal-dim border-teal-line",
  gold: "text-white bg-gold border-gold font-semibold",
};

interface ActionItem {
  icon: LucideIcon;
  label: string;
  variant?: "default" | "teal" | "gold";
  onClick?: () => void;
  href?: string;
}

interface ActionGridProps {
  actions: ActionItem[];
  className?: string;
}

/**
 * 4-column action button grid — Manifest, USCG CSV, WhatsApp, Captain link.
 * Configurable with icon, label, and variant (default/teal/gold).
 */
export function ActionGrid({ actions, className }: ActionGridProps) {
  return (
    <div className={cn("grid grid-cols-4 gap-[8px]", className)}>
      {actions.map((action) => {
        const style = variantStyles[action.variant ?? "default"];
        const Icon = action.icon;

        const content = (
          <>
            <Icon size={20} />
            <span>{action.label}</span>
          </>
        );

        const baseClass = cn(
          "flex flex-col items-center gap-[5px] py-[14px] px-[4px]",
          "rounded-[12px] text-[11px] font-medium text-center",
          "border cursor-pointer transition-opacity hover:opacity-80",
          style
        );

        if (action.href) {
          return (
            <a key={action.label} href={action.href} className={baseClass}>
              {content}
            </a>
          );
        }

        return (
          <button key={action.label} onClick={action.onClick} className={baseClass}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
