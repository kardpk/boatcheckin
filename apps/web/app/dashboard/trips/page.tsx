import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { TripCard } from '@/components/dashboard/TripCard'
import { Anchor, Plus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Trips — BoatCheckin' }

export default async function TripsPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: trips } = await supabase
    .from('trips')
    .select(`
      id, slug, trip_code, trip_date, departure_time,
      duration_hours, max_guests, status, special_notes,
      requires_approval,
      boats ( boat_name, marina_name, slip_number, lat, lng ),
      guests ( id, waiver_signed )
    `)
    .eq('operator_id', operator.id)
    .in('status', ['upcoming', 'active'])
    .is('guests.deleted_at', null)
    .order('trip_date', { ascending: true })
    .order('departure_time', { ascending: true })
    .limit(50)

  const upcomingTrips = trips ?? []

  return (
    <div className="px-page py-[16px]">
      <div className="flex items-center justify-between mb-[16px]">
        <div>
          <h1 className="text-[22px] font-bold text-navy">Trips</h1>
          <p className="text-[14px] text-text-mid mt-[3px] font-medium">
            {upcomingTrips.length} upcoming
          </p>
        </div>
        <Link
          href="/dashboard/trips/new"
          className="
            h-[42px] px-[18px] rounded-[10px]
            bg-gold text-white font-semibold text-[14px]
            flex items-center gap-[6px]
            hover:bg-gold-hi transition-colors
          "
        >
          <Plus size={16} />
          New trip
        </Link>
      </div>

      {upcomingTrips.length === 0 ? (
        <div className="text-center py-[48px]">
          <div className="w-[64px] h-[64px] mx-auto mb-[14px] rounded-full bg-gold-dim border border-gold-line flex items-center justify-center">
            <Anchor size={28} className="text-gold" />
          </div>
          <h2 className="text-[18px] font-bold text-navy mb-[6px]">No trips yet</h2>
          <p className="text-[15px] text-text-mid mb-[20px]">
            Create your first trip and share the link with guests
          </p>
          <Link
            href="/dashboard/trips/new"
            className="
              inline-flex items-center justify-center gap-[6px]
              h-[48px] px-[24px] rounded-[10px]
              bg-gold text-white font-semibold text-[15px]
              hover:bg-gold-hi transition-colors
            "
          >
            Create my first trip →
          </Link>
        </div>
      ) : (
        <div className="space-y-[10px]">
          {upcomingTrips.map((trip) => {
            const guests = (trip.guests as { id: string; waiver_signed: boolean }[]) ?? []
            return (
              <TripCard
                key={trip.id}
                tripId={trip.id}
                slug={trip.slug}
                tripCode={trip.trip_code}
                tripDate={trip.trip_date}
                departureTime={trip.departure_time}
                durationHours={trip.duration_hours}
                maxGuests={trip.max_guests}
                status={trip.status as 'upcoming' | 'active' | 'completed' | 'cancelled'}
                boatName={(trip.boats as unknown as { boat_name: string } | null)?.boat_name ?? ''}
                marinaName={(trip.boats as unknown as { marina_name: string } | null)?.marina_name ?? ''}
                slipNumber={(trip.boats as unknown as { slip_number: string | null } | null)?.slip_number ?? null}
                guestCount={guests.length}
                waiversSigned={guests.filter((g) => g.waiver_signed).length}
                requiresApproval={trip.requires_approval}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
