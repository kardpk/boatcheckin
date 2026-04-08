import { createServiceClient } from '../../web/lib/supabase/service'
import { getWeatherData } from '../../web/lib/trip/getWeatherData'
import { evaluateWeatherAlert, shouldSendNewAlert } from '../../web/lib/weather/alertRules'
import { sendWeatherAlertEmail } from '../../web/lib/notifications/email'
import { sendPushToAllGuests } from '../../web/lib/notifications/push'

interface TripWeatherRow {
  id: string
  slug: string
  trip_date: string
  departure_time: string
  operator_id: string
  weather_checked_at: string | null
  weather_alert_sent_at: string | null
  weather_alert_severity: string | null
  boats: {
    boat_name: string
    lat: number | null
    lng: number | null
  }
  operators: {
    email: string
    full_name: string
  }
}

export async function runWeatherMonitor(): Promise<{
  checked: number
  alerted: number
  errors: number
}> {
  const supabase = createServiceClient()

  // Get all upcoming trips in next 48 hours
  // with marina coordinates
  const now = new Date()
  const cutoff = new Date(now.getTime() + 48 * 3600000)
  const todayStr = now.toISOString().split('T')[0]!
  const cutoffStr = cutoff.toISOString().split('T')[0]!

  const { data: trips, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time,
      operator_id, weather_checked_at,
      weather_alert_sent_at, weather_alert_severity,
      boats ( boat_name, lat, lng ),
      operators ( email, full_name )
    `)
    .in('status', ['upcoming', 'active'])
    .gte('trip_date', todayStr)
    .lte('trip_date', cutoffStr)
    .not('boats.lat', 'is', null)
    .not('boats.lng', 'is', null)

  if (error || !trips) {
    console.error('[weather-monitor] fetch failed:', error?.message)
    return { checked: 0, alerted: 0, errors: 1 }
  }

  let checked = 0
  let alerted = 0
  let errors = 0

  for (const rawTrip of trips) {
    try {
      const trip = rawTrip as unknown as TripWeatherRow
      const boat = trip.boats
      const operator = trip.operators

      if (!boat?.lat || !boat?.lng) continue

      // Skip if checked in the last 3 hours
      if (trip.weather_checked_at) {
        const hoursSince = (Date.now() -
          new Date(trip.weather_checked_at).getTime()) / 3600000
        if (hoursSince < 3) continue
      }

      // Fetch weather
      const weather = await getWeatherData(
        Number(boat.lat),
        Number(boat.lng),
        trip.trip_date
      )

      if (!weather) {
        errors++
        continue
      }

      checked++

      // Evaluate alert
      const alert = evaluateWeatherAlert(weather)

      // Update trip with latest weather
      await supabase
        .from('trips')
        .update({
          weather_data: weather,
          weather_checked_at: new Date().toISOString(),
        })
        .eq('id', trip.id)

      // Check if we should send an alert
      const shouldAlert = shouldSendNewAlert(
        alert,
        trip.weather_alert_severity,
        trip.weather_alert_sent_at
      )

      if (!shouldAlert) continue

      // Get guest count for this trip
      const { count: guestCount } = await supabase
        .from('guests')
        .select('id', { count: 'exact', head: true })
        .eq('trip_id', trip.id)
        .is('deleted_at', null)

      const alertData = {
        operatorName: operator.full_name,
        boatName: boat.boat_name,
        tripDate: trip.trip_date,
        departureTime: trip.departure_time,
        alertHeadline: alert.headline,
        alertDetail: alert.detail,
        alertEmoji: alert.emoji,
        alertColour: alert.colour,
        alertBgColour: alert.bgColour,
        operatorAction: alert.operatorAction,
        guestCount: guestCount ?? 0,
        tripSlug: trip.slug,
      }

      // 1. Email operator
      await sendWeatherAlertEmail({
        to: operator.email,
        ...alertData,
      }).catch(err => {
        console.error('[weather-monitor] email failed:', err.message)
      })

      // 2. In-app operator notification
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'weather_alert',
        title: `${alert.emoji} ${alert.headline}`,
        body: `${alertData.boatName} on ${trip.trip_date}: ${alert.detail.slice(0, 100)}`,
        data: {
          tripId: trip.id,
          severity: alert.severity,
          weatherCode: weather.code,
          windspeed: weather.windspeed,
        },
      }).then(null, () => null)

      // 3. Push to guests for dangerous conditions only
      if (alert.severity === 'dangerous') {
        await sendPushToAllGuests(trip.id, {
          title: '⚠️ Weather update for your charter',
          body: `${alert.headline} — ${boat.boat_name} on ${trip.trip_date}`,
          url: `/trip/${trip.slug}`,
          tag: `weather-${trip.id}`,
        }).catch(() => null)
      }

      // 4. Record alert sent
      await supabase
        .from('trips')
        .update({
          weather_alert_sent_at: new Date().toISOString(),
          weather_alert_severity: alert.severity,
        })
        .eq('id', trip.id)

      alerted++
      console.log(
        `[weather-monitor] alerted: ${boat.boat_name} on ${trip.trip_date} — ${alert.severity}`
      )

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[weather-monitor] trip ${rawTrip.id} error:`, message)
      errors++
    }
  }

  console.log(
    `[weather-monitor] done: checked=${checked}, alerted=${alerted}, errors=${errors}`
  )
  return { checked, alerted, errors }
}
