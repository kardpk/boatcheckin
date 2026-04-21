import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { getWeatherData } from '@/lib/trip/getWeatherData'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `post-trip:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const supabase = createServiceClient()

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time,
      duration_hours, duration_days, status,
      operator_id,
      return_inspected_at, return_has_issues, return_fuel_level,
      operators ( id, company_name, seasonal_promo_label, seasonal_promo_dates, seasonal_promo_url ),
      boats (
        boat_name, captain_name, marina_name,
        lat, lng, boatsetter_url, google_review_url,
        boatsetter_review_url
      )
    `)
    .eq('slug', slug)
    .eq('status', 'completed')
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found or not completed' },
      { status: 404 }
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boat     = trip.boats as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operator = trip.operators as any

  const durationDays = (trip.duration_days as number | null) ?? 1
  const isMultiDay   = durationDays > 1

  // ── Fetch weather ─────────────────────────────────────────────────────────
  const weather = boat?.lat && boat?.lng
    ? await getWeatherData(Number(boat.lat), Number(boat.lng), trip.trip_date as string)
    : null

  // ── Base data ─────────────────────────────────────────────────────────────
  const baseData = {
    tripId:              trip.id,
    slug:                trip.slug,
    tripDate:            trip.trip_date,
    departureTime:       trip.departure_time,
    durationHours:       trip.duration_hours,
    durationDays:        durationDays,
    isMultiDay,
    boatName:            boat?.boat_name ?? '',
    captainName:         boat?.captain_name ?? null,
    marinaName:          boat?.marina_name ?? '',
    operatorCompanyName: operator?.company_name ?? null,
    boatsetterUrl:       boat?.boatsetter_url ?? null,
    googleReviewUrl:     boat?.google_review_url ?? null,
    boatsetterReviewUrl: boat?.boatsetter_review_url ?? null,
    weather: weather ? { icon: weather.icon, label: weather.label, temperature: weather.temperature } : null,
    // Phase 4E extensions (init null, filled below)
    rentalDaySummary:   null as unknown,
    returnCondition:    null as unknown,
    addonOrderSummary:  null as unknown,
    seasonalPromo:      null as unknown,
  }

  // ── Multi-day rental day summary ──────────────────────────────────────────
  if (isMultiDay) {
    try {
      const { data: rentalDays } = await supabase
        .from('rental_days')
        .select('day_number, day_date, status, photos_in, photos_out, issues_reported')
        .eq('trip_id', trip.id)
        .order('day_number')

      baseData.rentalDaySummary = (rentalDays ?? []).map((d) => ({
        dayNumber:  d.day_number,
        dayDate:    d.day_date,
        status:     d.status,
        photosIn:   ((d.photos_in as { url: string }[] | null) ?? []).map(p => p.url),
        photosOut:  ((d.photos_out as { url: string }[] | null) ?? []).map(p => p.url),
        hasIssues:  d.status === 'issue',
      }))
    } catch { /* non-fatal */ }
  }

  // ── Return condition ──────────────────────────────────────────────────────
  if (trip.return_inspected_at) {
    baseData.returnCondition = {
      inspectedAt: trip.return_inspected_at,
      hasIssues:   trip.return_has_issues,
      fuelLevel:   trip.return_fuel_level,
    }
  }

  // ── Add-on order summary ──────────────────────────────────────────────────
  try {
    const { data: orders } = await supabase
      .from('guest_addon_orders')
      .select('addons ( name ), quantity, total_cents, fulfillment_status')
      .eq('trip_id', trip.id)
      .eq('status', 'confirmed')

    if (orders && orders.length > 0) {
      baseData.addonOrderSummary = orders.map((o) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        name:              (o.addons as any)?.name ?? '',
        quantity:          o.quantity,
        totalCents:        o.total_cents,
        fulfillmentStatus: o.fulfillment_status ?? 'pending',
      }))
    }
  } catch { /* non-fatal */ }

  // ── Seasonal promo ────────────────────────────────────────────────────────
  if (operator?.seasonal_promo_label) {
    baseData.seasonalPromo = {
      label: operator.seasonal_promo_label,
      dates: operator.seasonal_promo_dates ?? '',
      url:   operator.seasonal_promo_url ?? null,
    }
  }

  return NextResponse.json({ data: baseData })
}
