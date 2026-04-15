import { Ship, Sun, Moon } from "lucide-react";

export function DashboardGreeting({
  operatorName,
  todayTripCount,
}: {
  operatorName: string;
  todayTripCount: number;
}) {
  const { text, Icon } = getGreeting();

  return (
    <div className="pt-[2px]">
      <h1 className="text-[22px] font-bold text-navy flex items-center gap-[8px]">
        {text}, {operatorName}
        <Icon size={22} className="text-gold" />
      </h1>
      <p className="text-[15px] text-text-mid mt-[4px]">
        {todayTripCount === 0
          ? "No charters today"
          : todayTripCount === 1
          ? "You have 1 charter today"
          : `You have ${todayTripCount} charters today`}
      </p>
    </div>
  );
}

function getGreeting(): { text: string; Icon: typeof Ship } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", Icon: Sun };
  if (hour < 17) return { text: "Good afternoon", Icon: Ship };
  return { text: "Good evening", Icon: Moon };
}
