import { notFound } from 'next/navigation'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { shapeTripDetail, buildAddonSummary } from '@/lib/dashboard/getDashboardData'
import { getWeatherData } from '@/lib/trip/getWeatherData'
import { correctTripStatus } from '@/lib/utils/tripStatus'
import { TripDetailHeader } from '@/components/dashboard/TripDetailHeader'
import { GuestManagementTable } from '@/components/dashboard/GuestManagementTable'
import { TripStatusBar } from '@/components/dashboard/TripStatusBar'
import { AddonOrdersSummary } from '@/components/dashboard/AddonOrdersSummary'
import { TripReviewsSummary } from '@/components/dashboard/TripReviewsSummary'
import { TripActionBar } from '@/components/dashboard/TripActionBar'
import { TripCommunicationsPanel } from '@/components/dashboard/TripCommunicationsPanel'
import { WeatherAlertCard } from '@/components/dashboard/WeatherAlertCard'
import { TripCrewPanel } from '@/components/dashboard/TripCrewPanel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trip detail — BoatCheckin' }

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: raw, error } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, charter_type,
      requires_approval, special_notes,
      started_at,
      bookings ( id, organiser_name, organiser_email,
        max_guests, booking_code, notes ),
      boats (
        id, boat_name, boat_type, marina_name,
        marina_address, slip_number, lat, lng,
        captain_name, waiver_text, safety_cards
      ),
      guests (
        id, full_name, language_preference,
        dietary_requirements, is_non_swimmer,
        is_seasickness_prone, waiver_signed,
        waiver_signed_at, approval_status,
        checked_in_at, created_at,
        safety_acknowledgments, waiver_text_hash,
        guest_addon_orders (
          quantity, total_cents,
          addons ( name, emoji )
        )
      )
    `)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .is('guests.deleted_at', null)
    .order('created_at', {
      referencedTable: 'guests',
      ascending: true,
    })
    .single()

  if (error || !raw) {
    console.error('[TRIP_DETAIL_404]', { id, error: error?.message })
    notFound()
  }

  const rawTrip = shapeTripDetail(raw as Record<string, unknown>)
  // Read-time date correction — ensure correct status regardless of cron
  const trip = {
    ...rawTrip,
    status: correctTripStatus(rawTrip.tripDate, rawTrip.status),
  }
  const addonSummary = buildAddonSummary(trip.guests)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // Waiver completion: all guests must have signed or be firma_template
  const allWaiversSigned = trip.guests.length > 0 &&
    trip.guests.every(g => g.waiverSigned || g.waiverTextHash === 'firma_template')

  // Fetch weather for alert card
  const boat = raw.boats as unknown as { lat: number | null; lng: number | null } | null
  const weather = boat?.lat && boat?.lng
    ? await getWeatherData(boat.lat, boat.lng, trip.tripDate)
    : null

  // Fetch crew assignments for this trip
  const { data: crewAssignments } = await supabase
    .from('trip_assignments')
    .select('captain_id, role, captains ( full_name )')
    .eq('trip_id', id)
    .eq('operator_id', operator.id)

  const assignments = (crewAssignments ?? []).map(a => ({
    captainId: a.captain_id as string,
    captainName: (a.captains as unknown as { full_name: string })?.full_name ?? 'Unknown',
    role: a.role as string,
  }))

  const tripDate = new Date(trip.tripDate + 'T00:00:00')
  const formattedDate = tripDate.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
  const shareMessage = [
    `Hi! Everything for our ${formattedDate} charter is here:`,
    ``,
    `${appUrl}/trip/${trip.slug}`,
    ``,
    `Your check-in code is: ${trip.tripCode}`,
    ``,
    `Sign your waiver and check the weather before you arrive.`,
  ].join('\n')

  const tripLink = `${appUrl}/trip/${trip.slug}`

  return (
    <div className="max-w-[560px] mx-auto px-5 pb-[100px]">
      {/* ── Header ─────────────────────────────────────── */}
      <TripDetailHeader trip={trip} />

      {/* ── Weather alert ──────────────────────────────── */}
      {weather && (
        <div style={{ marginTop: 'var(--s-4)' }}>
          <WeatherAlertCard
            tripId={trip.id}
            weather={weather}
            guestCount={trip.guests.length}
          />
        </div>
      )}

      {/* ── Guests ─────────────────────────────────────── */}
      <GuestManagementTable
        tripId={trip.id}
        initialGuests={trip.guests}
        maxGuests={trip.maxGuests}
        requiresApproval={trip.requiresApproval}
      />

      {/* ── Crew assignment ────────────────────────────── */}
      <div style={{ marginTop: 'var(--s-4)' }}>
        <TripCrewPanel
          tripId={trip.id}
          tripStatus={trip.status}
          initialAssignments={assignments}
        />
      </div>

      {/* ── Trip control (start/end + compliance) ──────────── */}
      <TripStatusBar
        tripId={trip.id}
        tripSlug={trip.slug}
        initialStatus={trip.status}
        initialStartedAt={trip.startedAt}
        initialGuests={trip.guests}
        requiredSafetyCards={trip.boat.safetyCards?.length ?? 0}
      />

      {/* ── Communications (guest msg + captain notes) ───── */}
      <TripCommunicationsPanel
        tripId={trip.id}
        shareMessage={shareMessage}
        tripLink={tripLink}
        specialNotes={trip.specialNotes ?? null}
      />

      {/* ── Add-ons ───────────────────────────────── */}
      {addonSummary.length > 0 && (
        <AddonOrdersSummary
          summary={addonSummary}
          className="mt-4"
        />
      )}

      {/* ── Reviews (completed only) ────────────────── */}
      {trip.status === 'completed' && (
        <TripReviewsSummary
          tripId={trip.id}
          operatorId={operator.id}
        />
      )}

      {/* ── Share + Documents ────────────────────────── */}
      <TripActionBar
        tripId={trip.id}
        tripSlug={trip.slug}
        status={trip.status}
        allWaiversSigned={allWaiversSigned}
      />
    </div>
  )
}
