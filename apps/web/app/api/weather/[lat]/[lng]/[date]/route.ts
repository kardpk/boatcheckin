import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getWeatherData } from '@/lib/trip/getWeatherData'

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: Promise<{ lat: string; lng: string; date: string }>
  },
) {
  const { lat, lng, date } = await params

  // Rate limit: 120/min (weather is heavily used)
  const limited = await rateLimit(req, {
    max: 120,
    window: 60,
    key: `weather:${lat}:${lng}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Validate params
  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)
  if (
    isNaN(latNum) ||
    latNum < -90 ||
    latNum > 90 ||
    isNaN(lngNum) ||
    lngNum < -180 ||
    lngNum > 180 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  const weather = await getWeatherData(latNum, lngNum, date)

  if (!weather) {
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 503 })
  }

  // Cache response at HTTP level too
  return NextResponse.json(
    { data: weather },
    {
      headers: {
        'Cache-Control': 'public, max-age=10800, s-maxage=10800',
      },
    },
  )
}
