import { CloudSun, CloudRain, CloudLightning, AlertTriangle, ChevronRight } from "lucide-react";
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

  // Map severity to MASTER_DESIGN alert variant
  const alertClass =
    alert.severity === "dangerous"
      ? "alert alert--err"
      : alert.severity === "poor"
      ? "alert alert--warn"
      : "alert alert--info";

  return (
    <a
      href={`/dashboard/trips/${tripId}`}
      className={alertClass}
      style={{ textDecoration: "none", cursor: "pointer" }}
    >
      <Icon size={18} strokeWidth={2} aria-hidden="true" />
      <div className="alert__body" style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "var(--t-body-sm)",
            fontWeight: 600,
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {alert.headline} {boatName}
        </p>
        <p
          className="mono"
          style={{
            fontSize: "var(--t-mono-xs)",
            color: "var(--color-ink-muted)",
            margin: "2px 0 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {weather.label} · {weather.windspeed} mph wind
        </p>
      </div>
      <ChevronRight size={14} strokeWidth={2} aria-hidden="true" style={{ color: "var(--color-ink-muted)", flexShrink: 0 }} />
    </a>
  );
}
