import { cn } from "@/lib/utils/cn";

interface SectionLabelProps {
  title: string;
  count?: number;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Section divider with gold underline bar.
 * Used to group content: "Captains (2)", "First Mates (1)", "Guests".
 */
export function SectionLabel({ title, count, icon, className }: SectionLabelProps) {
  return (
    <div className={cn("mt-[18px] mb-[6px]", className)}>
      <div className="text-[18px] font-bold text-navy flex items-center gap-[8px]">
        {icon}
        {title}
        {count !== undefined && (
          <span className="font-normal text-[14px] text-text-dim">{count}</span>
        )}
      </div>
      <div className="w-[28px] h-[2px] bg-gold rounded-[1px] mt-[6px]" />
    </div>
  );
}
