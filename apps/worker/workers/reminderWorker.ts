import { createServiceClient } from '../../web/lib/supabase/service'
import { getWeatherData } from '../../web/lib/trip/getWeatherData'
import { sendTripReminderEmail } from '../../web/lib/notifications/email'
import { formatTripDate, formatTime } from '../../web/lib/utils/format'

interface ReminderGuest {
  id: string
  full_name: string
  email: string | null
  language_preference: string | null
  push_subscription: string | null
  trip_reminder_sent_at: string | null
  waiver_signed: boolean
  waiver_reminder_sent_at: string | null
  deleted_at: string | null
}

interface ReminderTrip {
  id: string
  slug: string
  trip_date: string
  departure_time: string
  duration_hours: number
  operator_id: string
  boats: {
    boat_name: string
    marina_name: string
    marina_address: string | null
    slip_number: string | null
    parking_instructions: string | null
    captain_name: string | null
    lat: number | null
    lng: number | null
  }
  guests: ReminderGuest[]
}

export async function runReminderWorker(): Promise<{
  remindersSent: number
  waiverAlerts: number
  errors: number
}> {
  const supabase = createServiceClient()

  const now = new Date()
  // Window: trips departing 20–28 hours from now
  const windowStart = new Date(now.getTime() + 20 * 3600000)
  const windowEnd   = new Date(now.getTime() + 28 * 3600000)

  const windowStartDate = windowStart.toISOString().split('T')[0]!
  const windowEndDate   = windowEnd.toISOString().split('T')[0]!

  // Fetch trips in the reminder window
  const { data: rawTrips } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours,
      operator_id,
      boats (
        boat_name, marina_name, marina_address, slip_number,
        parking_instructions, captain_name, lat, lng
      ),
      guests (
        id, full_name, email, language_preference,
        push_subscription, trip_reminder_sent_at,
        waiver_signed, waiver_reminder_sent_at,
        deleted_at
      )
    `)
    .in('status', ['upcoming'])
    .gte('trip_date', windowStartDate)
    .lte('trip_date', windowEndDate)

  let remindersSent = 0
  let waiverAlerts = 0
  let errors = 0

  const trips = (rawTrips ?? []) as unknown as ReminderTrip[]

  for (const trip of trips) {
    try {
      const boat = trip.boats
      const guests = trip.guests ?? []
      const eligibleGuests = guests.filter(
        (g: ReminderGuest) => !g.deleted_at && !g.trip_reminder_sent_at
      )

      if (eligibleGuests.length === 0) continue

      // Fetch weather for reminder context
      let weatherData: { icon: string; label: string; temperature: number } | null = null
      if (boat?.lat && boat?.lng) {
        try {
          const weather = await getWeatherData(
            Number(boat.lat), Number(boat.lng), trip.trip_date
          )
          if (weather && weather.severity !== 'dangerous') {
            weatherData = {
              icon: weather.icon,
              label: weather.label,
              temperature: weather.temperature,
            }
          }
        } catch {
          // Non-fatal — proceed without weather
        }
      }

      for (const guest of eligibleGuests) {
        try {
          // 1. Email reminder (if email provided)
          if (guest.email) {
            await sendTripReminderEmail({
              to: guest.email,
              guestName: guest.full_name,
              language: guest.language_preference ?? 'en',
              boatName: boat?.boat_name ?? '',
              tripDate: formatTripDate(trip.trip_date),
              departureTime: formatTime(trip.departure_time),
              marinaName: boat?.marina_name ?? '',
              slipNumber: boat?.slip_number ?? null,
              parkingInstructions: boat?.parking_instructions ?? null,
              captainName: boat?.captain_name ?? null,
              tripSlug: trip.slug,
              weather: weatherData,
            })
          }

          // 2. Push notification (if subscribed)
          if (guest.push_subscription) {
            const { sendPush } = await import(
              '../../web/lib/notifications/push'
            )
            const sub = typeof guest.push_subscription === 'string'
              ? JSON.parse(guest.push_subscription) as object
              : guest.push_subscription as object
            await sendPush(sub, {
              title: 'Your charter is tomorrow ⚓',
              body: `${boat?.boat_name} departs at ${formatTime(trip.departure_time)} from ${boat?.marina_name}`,
              url: `/trip/${trip.slug}`,
              tag: `reminder-${trip.id}`,
            }).catch(() => null)
          }

          // Mark as sent
          await supabase
            .from('guests')
            .update({ trip_reminder_sent_at: new Date().toISOString() })
            .eq('id', guest.id)

          remindersSent++
        } catch (guestErr: unknown) {
          const message = guestErr instanceof Error ? guestErr.message : String(guestErr)
          console.error(
            `[reminder] guest ${guest.id} error:`, message
          )
          errors++
        }
      }

    } catch (tripErr: unknown) {
      const message = tripErr instanceof Error ? tripErr.message : String(tripErr)
      console.error(`[reminder] trip ${trip.id} error:`, message)
      errors++
    }
  }

  // ── Waiver alerts (48-hour window) ──────
  const waiverWindowStart = new Date(now.getTime() + 44 * 3600000)
  const waiverWindowEnd   = new Date(now.getTime() + 52 * 3600000)

  const { data: waiverRawTrips } = await supabase
    .from('trips')
    .select(`
      id, operator_id,
      boats ( boat_name ),
      guests (
        id, full_name, waiver_signed, deleted_at
      )
    `)
    .in('status', ['upcoming'])
    .gte('trip_date', waiverWindowStart.toISOString().split('T')[0]!)
    .lte('trip_date', waiverWindowEnd.toISOString().split('T')[0]!)

  interface WaiverGuest {
    id: string
    full_name: string
    waiver_signed: boolean
    deleted_at: string | null
  }

  interface WaiverTrip {
    id: string
    operator_id: string
    boats: { boat_name: string }
    guests: WaiverGuest[]
  }

  const waiverTrips = (waiverRawTrips ?? []) as unknown as WaiverTrip[]

  for (const trip of waiverTrips) {
    const unsigned = trip.guests
      .filter((g: WaiverGuest) => !g.deleted_at && !g.waiver_signed)

    if (unsigned.length === 0) continue

    // Notify operator once about unsigned waivers
    await supabase.from('operator_notifications').insert({
      operator_id: trip.operator_id,
      type: 'unsigned_waivers',
      title: `⚠️ ${unsigned.length} unsigned waiver${unsigned.length !== 1 ? 's' : ''}`,
      body: `${unsigned.map((g: WaiverGuest) => g.full_name.split(' ')[0]).join(', ')} ${unsigned.length === 1 ? "hasn't" : "haven't"} signed yet`,
      data: {
        tripId: trip.id,
        unsignedNames: unsigned.map((g: WaiverGuest) => g.full_name),
      },
    }).then(null, () => null)

    waiverAlerts++
  }

  console.log(
    `[reminder] done: sent=${remindersSent}, waiverAlerts=${waiverAlerts}, errors=${errors}`
  )
  return { remindersSent, waiverAlerts, errors }
}
