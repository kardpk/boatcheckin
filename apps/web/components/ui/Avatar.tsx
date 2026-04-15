import { cn } from "@/lib/utils/cn";

const sizeMap = {
  sm: "w-[34px] h-[34px] text-[12px]",
  md: "w-[42px] h-[42px] text-[16px]",
  lg: "w-[48px] h-[48px] text-[17px]",
  xl: "w-[58px] h-[58px] text-[20px]",
} as const;

const roleColours: Record<string, string> = {
  captain: "bg-navy",
  "first-mate": "bg-[#1D6B50]",
  deckhand: "bg-[#5A4A7C]",
  pending: "bg-text-dim",
};

interface AvatarProps {
  name: string;
  role?: "captain" | "first-mate" | "deckhand" | "pending";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

/**
 * Avatar — navy-bg circle with white initials.
 * Role variants: captain (navy), first-mate (teal-dark), deckhand (purple).
 */
export function Avatar({ name, role, size = "lg", className }: AvatarProps) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const bg = role ? roleColours[role] ?? "bg-navy" : "bg-navy";

  return (
    <div
      className={cn(
        "rounded-full flex-shrink-0 grid place-items-center font-bold text-white",
        sizeMap[size],
        bg,
        className
      )}
    >
      {initials}
    </div>
  );
}
