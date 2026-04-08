import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { getRedis } from '@/lib/redis/upstash'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface RouteStop {
  name: string
  lat?: number
  lng?: number
  duration?: string
}

export interface SafetyPoint {
  id: string
  text: string
  icon?: string
}

export interface CustomRuleSection {
  id: string
  title: string
  items: string[]
  type: 'bullet' | 'numbered' | 'check'
}

export interface TripPageData {
  // Trip core
  id: string
  slug: string
  tripCode: string
  tripDate: string
  departureTime: string
  durationHours: number
  maxGuests: number
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  charterType: 'captained' | 'bareboat' | 'both'
  specialNotes: string | null
  requiresApproval: boolean
  routeDescription: string | null
  routeStops: RouteStop[]
  startedAt: string | null
  endedAt: string | null

  // Boat profile
  boat: {
    id: string
    boatName: string
    boatType: string
    boatTypeKey: string
    marinaName: string
    marinaAddress: string
    slipNumber: string | null
    parkingInstructions: string | null
    operatingArea: string | null
    lat: number | null
    lng: number | null
    captainName: string | null
    captainPhotoUrl: string | null
    captainBio: string | null
    captainLicense: string | null
    captainLicenseType: string | null
    captainLanguages: string[]
    captainYearsExp: number | null
    captainTripCount: number | null
    captainRating: number | null
    captainCertifications: string[]
    whatToBring: string | null
    whatNotToBring: string | null
    houseRules: string | null
    prohibitedItems: string | null
    customDos: string[]
    customDonts: string[]
    customRuleSections: CustomRuleSection[]
    safetyPoints: SafetyPoint[]
    waiverText: string
    cancellationPolicy: string | null
    selectedEquipment: string[]
    selectedAmenities: Record<string, boolean>
    specificFieldValues: Record<string, unknown>
    onboardInfo: Record<string, unknown>
  }

  // Photos
  photos: {
    id: string
    publicUrl: string
    displayOrder: number
    isCover: boolean
  }[]

  // Add-ons available
  addons: {
    id: string
    name: string
    description: string | null
    emoji: string
    priceCents: number
    maxQuantity: number
  }[]

  // Live counts (not cached — always fresh)
  guestCount: number
  isFull: boolean

  // Operator display
  operator: {
    id: string
    companyName: string | null
  }
}

export type GetTripResult =
  | { found: true; data: TripPageData }
  | { found: false; reason: 'not_found' | 'cancelled' }

// ─── Main fetcher ─────────────────────────────────────────────────────────────

export async function getTripPageData(slug: string): Promise<GetTripResult> {
  const redis = getRedis()
  const cacheKey = `cache:trip:${slug}`

  // ── Check Redis cache ──────────────────────────────────────────────────────
  try {
    const cached = await redis.get<TripPageData>(cacheKey)
    if (cached) {
      const liveCount = await getLiveGuestCount(cached.id)
      return {
        found: true,
        data: {
          ...cached,
          guestCount: liveCount,
          isFull: liveCount >= cached.maxGuests,
        },
      }
    }
  } catch {
    // Redis unavailable — proceed to DB
  }

  const supabase = createServiceClient()

  // ── Database query ─────────────────────────────────────────────────────────
  const { data: trip, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      special_notes, requires_approval, route_description,
      route_stops, started_at, ended_at,
      operators ( id, company_name ),
      boats (
        id, boat_name, boat_type, boat_type_key,
        marina_name, marina_address, slip_number,
        parking_instructions, operating_area, lat, lng,
        captain_name, captain_photo_url, captain_bio,
        captain_license, captain_license_type,
        captain_languages, captain_years_exp,
        captain_trip_count, captain_rating,
        captain_certifications,
        what_to_bring, what_not_to_bring,
        house_rules, prohibited_items,
        custom_dos, custom_donts, custom_rule_sections,
        safety_points, waiver_text, cancellation_policy,
        selected_equipment, selected_amenities,
        specific_field_values, onboard_info,
        boat_photos (
          id, public_url, display_order, is_cover
        ),
        addons (
          id, name, description, emoji,
          price_cents, max_quantity, is_available, sort_order
        )
      )
    `)
    .eq('slug', slug)
    .order('display_order', {
      referencedTable: 'boats.boat_photos',
      ascending: true,
    })
    .order('sort_order', {
      referencedTable: 'boats.addons',
      ascending: true,
    })
    .single()

  if (error || !trip) {
    return { found: false, reason: 'not_found' }
  }

  if (trip.status === 'cancelled') {
    return { found: false, reason: 'cancelled' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boat = trip.boats as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const operator = trip.operators as any

  // ── Shape data ─────────────────────────────────────────────────────────────
  const data: TripPageData = {
    id: trip.id,
    slug: trip.slug,
    tripCode: trip.trip_code,
    tripDate: trip.trip_date,
    departureTime: trip.departure_time,
    durationHours: trip.duration_hours,
    maxGuests: trip.max_guests,
    status: trip.status as TripPageData['status'],
    charterType: trip.charter_type as TripPageData['charterType'],
    specialNotes: trip.special_notes,
    requiresApproval: trip.requires_approval,
    routeDescription: trip.route_description ?? null,
    routeStops: (trip.route_stops as RouteStop[]) ?? [],
    startedAt: trip.started_at ?? null,
    endedAt: trip.ended_at ?? null,
    boat: {
      id: boat.id,
      boatName: boat.boat_name,
      boatType: boat.boat_type,
      boatTypeKey: boat.boat_type_key ?? boat.boat_type,
      marinaName: boat.marina_name,
      marinaAddress: boat.marina_address ?? '',
      slipNumber: boat.slip_number ?? null,
      parkingInstructions: boat.parking_instructions ?? null,
      operatingArea: boat.operating_area ?? null,
      lat: boat.lat ? Number(boat.lat) : null,
      lng: boat.lng ? Number(boat.lng) : null,
      captainName: boat.captain_name ?? null,
      captainPhotoUrl: boat.captain_photo_url ?? null,
      captainBio: boat.captain_bio ?? null,
      captainLicense: boat.captain_license ?? null,
      captainLicenseType: boat.captain_license_type ?? null,
      captainLanguages: (boat.captain_languages as string[]) ?? ['en'],
      captainYearsExp: boat.captain_years_exp ?? null,
      captainTripCount: boat.captain_trip_count ?? null,
      captainRating: boat.captain_rating ? Number(boat.captain_rating) : null,
      captainCertifications: (boat.captain_certifications as string[]) ?? [],
      whatToBring: boat.what_to_bring ?? null,
      whatNotToBring: boat.what_not_to_bring ?? null,
      houseRules: boat.house_rules ?? null,
      prohibitedItems: boat.prohibited_items ?? null,
      customDos: (boat.custom_dos as string[]) ?? [],
      customDonts: (boat.custom_donts as string[]) ?? [],
      customRuleSections: (boat.custom_rule_sections as CustomRuleSection[]) ?? [],
      safetyPoints: (boat.safety_points as SafetyPoint[]) ?? [],
      waiverText: boat.waiver_text ?? '',
      cancellationPolicy: boat.cancellation_policy ?? null,
      selectedEquipment: (boat.selected_equipment as string[]) ?? [],
      selectedAmenities: (boat.selected_amenities as Record<string, boolean>) ?? {},
      specificFieldValues: (boat.specific_field_values as Record<string, unknown>) ?? {},
      onboardInfo: (boat.onboard_info as Record<string, unknown>) ?? {},
    },
    photos: ((boat.boat_photos as Record<string, unknown>[]) ?? []).map((p) => ({
      id: p['id'] as string,
      publicUrl: p['public_url'] as string,
      displayOrder: p['display_order'] as number,
      isCover: p['is_cover'] as boolean,
    })),
    addons: ((boat.addons as Record<string, unknown>[]) ?? [])
      .filter((a) => a['is_available'] === true)
      .map((a) => ({
        id: a['id'] as string,
        name: a['name'] as string,
        description: (a['description'] as string) ?? null,
        emoji: a['emoji'] as string,
        priceCents: a['price_cents'] as number,
        maxQuantity: a['max_quantity'] as number,
      })),
    operator: {
      id: operator?.id ?? '',
      companyName: operator?.company_name ?? null,
    },
    guestCount: 0, // overwritten below
    isFull: false,
  }

  // ── Cache to Redis (exclude live counts) ──────────────────────────────────
  try {
    await redis.set(cacheKey, data, { ex: 300 })
  } catch {
    // Non-fatal
  }

  // ── Get live guest count ──────────────────────────────────────────────────
  const liveCount = await getLiveGuestCount(trip.id)

  return {
    found: true,
    data: {
      ...data,
      guestCount: liveCount,
      isFull: liveCount >= trip.max_guests,
    },
  }
}

// ── Live guest count (bypasses cache) ─────────────────────────────────────────
async function getLiveGuestCount(tripId: string): Promise<number> {
  const supabase = createServiceClient()
  const { count } = await supabase
    .from('guests')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', tripId)
    .is('deleted_at', null)
  return count ?? 0
}
