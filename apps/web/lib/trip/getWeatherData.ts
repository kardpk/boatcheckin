import 'server-only'

import { getRedis } from '@/lib/redis/upstash'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WeatherData {
  code: number           // WMO weather code
  temperature: number    // °F
  windspeed: number      // mph
  precipitation: number  // mm
  label: string          // human-readable
  severity: 'good' | 'fair' | 'poor' | 'dangerous'
  icon: string           // emoji
  color: string          // CSS colour
  bgColor: string        // light bg colour
}

// ─── WMO weather interpretation codes ────────────────────────────────────────
// https://open-meteo.com/en/docs#weathervariables

const WMO_LABELS: Record<number, { label: string; icon: string }> = {
  0:  { label: 'Clear sky',          icon: '☀️' },
  1:  { label: 'Mainly clear',        icon: '🌤️' },
  2:  { label: 'Partly cloudy',       icon: '⛅' },
  3:  { label: 'Overcast',            icon: '☁️' },
  45: { label: 'Fog',                 icon: '🌫️' },
  48: { label: 'Icy fog',             icon: '🌫️' },
  51: { label: 'Light drizzle',       icon: '🌦️' },
  53: { label: 'Drizzle',             icon: '🌦️' },
  55: { label: 'Heavy drizzle',       icon: '🌧️' },
  61: { label: 'Light rain',          icon: '🌧️' },
  63: { label: 'Rain',                icon: '🌧️' },
  65: { label: 'Heavy rain',          icon: '🌧️' },
  71: { label: 'Light snow',          icon: '🌨️' },
  73: { label: 'Snow',                icon: '🌨️' },
  75: { label: 'Heavy snow',          icon: '❄️' },
  80: { label: 'Light showers',       icon: '🌦️' },
  81: { label: 'Showers',             icon: '🌧️' },
  82: { label: 'Heavy showers',       icon: '⛈️' },
  85: { label: 'Snow showers',        icon: '🌨️' },
  95: { label: 'Thunderstorm',        icon: '⛈️' },
  96: { label: 'Thunderstorm + hail', icon: '⛈️' },
  99: { label: 'Severe thunderstorm', icon: '🌩️' },
}

function getWeatherSeverity(
  code: number,
  windspeed: number,
): WeatherData['severity'] {
  if (code >= 95 || windspeed >= 40) return 'dangerous'
  if (code >= 80 || windspeed >= 25) return 'poor'
  if (code >= 51 || windspeed >= 15) return 'fair'
  return 'good'
}

const SEVERITY_STYLES: Record<
  WeatherData['severity'],
  { color: string; bgColor: string }
> = {
  good:      { color: '#1D9E75', bgColor: '#E8F9F4' },
  fair:      { color: '#E5910A', bgColor: '#FEF3DC' },
  poor:      { color: '#E8593C', bgColor: '#FDEAEA' },
  dangerous: { color: '#D63B3B', bgColor: '#FDEAEA' },
}

// ─── Main fetcher ─────────────────────────────────────────────────────────────

export async function getWeatherData(
  lat: number,
  lng: number,
  date: string, // YYYY-MM-DD
): Promise<WeatherData | null> {
  const redis = getRedis()
  const cacheKey = `cache:weather:${lat.toFixed(4)}:${lng.toFixed(4)}:${date}`

  // Check cache first (3-hour TTL)
  try {
    const cached = await redis.get<WeatherData>(cacheKey)
    if (cached) return cached
  } catch {
    // Redis unavailable — proceed to fetch
  }

  // Fetch from Open-Meteo (free, no API key)
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', lat.toString())
  url.searchParams.set('longitude', lng.toString())
  url.searchParams.set('daily', [
    'weathercode',
    'temperature_2m_max',
    'temperature_2m_min',
    'windspeed_10m_max',
    'precipitation_sum',
    'sunrise',
    'sunset',
  ].join(','))
  url.searchParams.set('start_date', date)
  url.searchParams.set('end_date', date)
  url.searchParams.set('timezone', 'America/New_York')
  url.searchParams.set('temperature_unit', 'fahrenheit')
  url.searchParams.set('windspeed_unit', 'mph')
  url.searchParams.set('precipitation_unit', 'mm')

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 10800 }, // Next.js cache 3hr
    })
    if (!res.ok) return null

    const raw = await res.json() as Record<string, unknown>
    const daily = raw['daily'] as Record<string, unknown[]> | undefined

    const code: number = (daily?.['weathercode']?.[0] as number) ?? 0
    const tempMax: number = Math.round((daily?.['temperature_2m_max']?.[0] as number) ?? 75)
    const windspeed: number = Math.round((daily?.['windspeed_10m_max']?.[0] as number) ?? 0)
    const precipitation: number = (daily?.['precipitation_sum']?.[0] as number) ?? 0
    const severity = getWeatherSeverity(code, windspeed)
    const wmo = WMO_LABELS[code] ?? { label: 'Unknown', icon: '🌡️' }

    const weather: WeatherData = {
      code,
      temperature: tempMax,
      windspeed,
      precipitation,
      label: wmo.label,
      severity,
      icon: wmo.icon,
      ...SEVERITY_STYLES[severity],
    }

    // Cache for 3 hours
    try {
      await redis.set(cacheKey, weather, { ex: 10800 })
    } catch {
      // Non-fatal
    }

    return weather
  } catch {
    return null
  }
}
