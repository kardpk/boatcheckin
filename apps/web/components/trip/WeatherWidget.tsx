import type { WeatherData } from '@/lib/trip/getWeatherData'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface WeatherWidgetProps {
  weather: WeatherData
  tripDate: string
  tr: TripT
}

const SEVERITY_MESSAGES: Record<WeatherData['severity'], keyof TripT> = {
  good: 'weatherGood',
  fair: 'weatherFair',
  poor: 'weatherPoor',
  dangerous: 'weatherDangerous',
}

export function WeatherWidget({ weather, tr }: WeatherWidgetProps) {
  const messageKey = SEVERITY_MESSAGES[weather.severity]
  const message = tr[messageKey] as string

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-border p-5">
      <p className="text-[11px] font-semibold text-text-mid uppercase tracking-wider mb-3">
        {tr.weather}
      </p>

      {/* Header row */}
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-[24px] shrink-0"
          style={{ backgroundColor: weather.bgColor }}
        >
          {weather.icon}
        </div>
        <div>
          <p className="text-[15px] font-semibold text-navy">{weather.label}</p>
          <p className="text-[13px] text-text-mid mt-0.5">
            {tr.feels} {weather.temperature}°F
          </p>
        </div>
      </div>

      {/* Details row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: '🌡️', label: `${weather.temperature}°F`, sublabel: 'High' },
          { icon: '💨', label: `${weather.windspeed} mph`, sublabel: tr.wind },
          { icon: '🌧️', label: `${weather.precipitation}mm`, sublabel: 'Rain' },
        ].map((item) => (
          <div
            key={item.sublabel}
            className="flex flex-col items-center gap-0.5 bg-bg rounded-[10px] p-2.5"
          >
            <span className="text-[16px]">{item.icon}</span>
            <span className="text-[13px] font-semibold text-navy">{item.label}</span>
            <span className="text-[11px] text-text-mid">{item.sublabel}</span>
          </div>
        ))}
      </div>

      {/* Condition banner */}
      <div
        className="px-4 py-2.5 rounded-[10px] text-[14px] font-medium"
        style={{
          backgroundColor: weather.bgColor,
          color: weather.color,
        }}
      >
        {message}
        {weather.severity === 'good' && ' ✓'}
      </div>
    </div>
  )
}
