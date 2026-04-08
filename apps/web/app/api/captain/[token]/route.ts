import { NextRequest, NextResponse } from 'next/server'
import { verifyCaptainToken } from '@/lib/security/tokens'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // 1. Verify HMAC signature + expiry (no DB call needed)
  const payload = verifyCaptainToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid or expired captain link' },
      { status: 401 }
    )
  }

  const supabase = createServiceClient()

  // 2. Verify the token version still matches DB (handles revocation)
  const { data: trip } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_date, departure_time, duration_hours, max_guests,
      status, charter_type, route_description, route_stops, special_notes,
      captain_token_version, captain_token_expires_at,
      started_at, ended_at,
      boats (
        id, boat_name, boat_type, marina_name, marina_address,
        slip_number, captain_name, captain_photo_url, captain_bio,
        lat, lng, what_to_bring, house_rules, safety_briefing,
        onboard_info, waiver_text
      )
    `)
    .eq('id', payload.tripId)
    .eq('captain_token_version', payload.version)
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Invalid or expired captain link' },
      { status: 401 }
    )
  }

  // 3. DB-level expiry check (belt-and-suspenders)
  if (
    trip.captain_token_expires_at &&
    new Date(trip.captain_token_expires_at) < new Date()
  ) {
    return NextResponse.json(
      { error: 'Invalid or expired captain link' },
      { status: 401 }
    )
  }

  // 4. Fetch guest list for this trip
  const { data: guests } = await supabase
    .from('guests')
    .select(`
      id, full_name, dietary_requirements, is_non_swimmer,
      is_seasickness_prone, waiver_signed, waiver_signed_at,
      approval_status, checked_in_at, language_preference,
      emergency_contact_name, emergency_contact_phone
    `)
    .eq('trip_id', trip.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  // 5. Fetch addon orders
  const { data: addonOrders } = await supabase
    .from('guest_addon_orders')
    .select('id, guest_id, quantity, unit_price_cents, total_cents, notes, addons(name, emoji)')
    .eq('trip_id', trip.id)
    .neq('status', 'cancelled')

  return NextResponse.json({
    data: {
      trip,
      guests: guests ?? [],
      addonOrders: addonOrders ?? [],
    },
  })
}
