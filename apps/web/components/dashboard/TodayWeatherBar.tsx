import { evaluateWeatherAlert } from '@/lib/weather/alertRules'
import type { WeatherData } from '@/lib/trip/getWeatherData'

interface TodayWeatherBarProps {
  weather: WeatherData
  boatName: string
  tripId: string
}

export function TodayWeatherBar({
  weather, boatName, tripId,
}: TodayWeatherBarProps) {
  const alert = evaluateWeatherAlert(weather)

  if (!alert.shouldAlert) return null

  return (
    <a
      href={`/dashboard/trips/${tripId}`}
      className="
        flex items-center gap-3 px-4 py-3 rounded-[16px]
        border transition-colors no-underline
      "
      style={{
        background: alert.bgColour,
        borderColor: alert.colour + '40',
      }}
    >
      <span className="text-[22px]">{alert.emoji}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-semibold truncate"
          style={{ color: alert.colour }}
        >
          {alert.headline} — {boatName}
        </p>
        <p className="text-[12px] text-[#6B7C93] truncate">
          {weather.label} · {weather.windspeed} mph wind
        </p>
      </div>
      <span className="text-[#6B7C93] text-[13px] flex-shrink-0">
        View →
      </span>
    </a>
  )
}
