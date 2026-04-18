import { getWeatherData, type WeatherData } from '@/lib/trip/getWeatherData'
import { TodayWeatherBar } from './TodayWeatherBar'

/**
 * Async server component that fetches weather and renders TodayWeatherBar.
 * Designed to be wrapped in <Suspense> so trip cards render immediately
 * while weather data streams in.
 */
export async function TodayWeatherBarAsync({
  tripId,
  boatName,
  lat,
  lng,
  tripDate,
}: {
  tripId: string
  boatName: string
  lat: number
  lng: number
  tripDate: string
}) {
  const weather = await getWeatherData(lat, lng, tripDate)
  if (!weather) return null

  return (
    <TodayWeatherBar
      weather={weather}
      boatName={boatName}
      tripId={tripId}
    />
  )
}
