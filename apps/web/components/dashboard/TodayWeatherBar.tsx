import { CloudSun, CloudRain, CloudLightning, AlertTriangle } from "lucide-react";
import { evaluateWeatherAlert } from "@/lib/weather/alertRules";
import type { WeatherData } from "@/lib/trip/getWeatherData";

interface TodayWeatherBarProps {
  weather: WeatherData;
  boatName: string;
  tripId: string;
}

const weatherIcons: Record<string, typeof CloudSun> = {
  fair: CloudRain,
  poor: CloudLightning,
  dangerous: AlertTriangle,
};

export function TodayWeatherBar({
  weather,
  boatName,
  tripId,
}: TodayWeatherBarProps) {
  const alert = evaluateWeatherAlert(weather);

  if (!alert.shouldAlert) return null;

  const Icon = weatherIcons[alert.severity] ?? CloudSun;

  return (
    <a
      href={`/dashboard/trips/${tripId}`}
      className="
        relative overflow-hidden flex items-center gap-[10px] px-card py-[12px] rounded-[14px]
        border transition-colors no-underline
      "
      style={{
        background: alert.bgColour,
        borderColor: alert.colour + "40",
      }}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: alert.colour }}
      />
      <Icon size={20} style={{ color: alert.colour }} className="shrink-0" />
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-semibold truncate"
          style={{ color: alert.colour }}
        >
          {alert.headline} — {boatName}
        </p>
        <p className="text-[12px] text-text-mid truncate">
          {weather.label} · {weather.windspeed} mph wind
        </p>
      </div>
      <span className="text-text-mid text-[13px] flex-shrink-0 font-medium">
        View →
      </span>
    </a>
  );
}
