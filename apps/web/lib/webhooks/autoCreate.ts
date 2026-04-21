import 'server-only'

import { createServiceClient } from '@/lib/supabase/service'
import { generateTripSlug, generateTripCode } from '@/lib/security/tokens'
import { auditLog } from '@/lib/security/audit'
import { sendBookingAutoLinkEmail } from '@/lib/notifications/email'
import type { NormalizedBookingEvent, IntegrationRow } from './types'

/**
 * lib/webhooks/autoCreate.ts
 *
 * Core booking event processor — called by all webhook handlers
 * after signature verification + normalization.
 *
 * Responsibilities:
 *  1. Map platform boat name → DockPass boat_id via integration.boat_name_map
 *  2. Guard against duplicate trips (idempotency on external_booking_ref)
 *  3. On booking.confirmed: auto-create trip
 *  4. On booking.cancelled: cancel existing trip
 *  5. Send auto-link email to booker (if integration.auto_send_link)
 *  6. Notify operator
 *  7. Update webhook_event as processed/failed
 */

export interface ProcessResult {
  tripId: string | null
  error: string | null
}

/**
 * Main entry point — process a normalized booking event.
 * Always resolves (never throws) so that webhook handlers can
 * always return 200 OK.
 */
export async function processBookingEvent(
  event: NormalizedBookingEvent,
  integration: IntegrationRow,
  webhookEventId: string
): Promise<ProcessResult> {
  const supabase = createServiceClient()

  try {
    // ── 1. Resolve boat_id from name map ─────────────────────────────────────
    const boatId: string | undefined = integration.boatNameMap[event.boatName]

    if (!boatId) {
      const errorMsg = `No boat mapping for: "${event.boatName}"`
      await markEventError(webhookEventId, errorMsg)
      return { tripId: null, error: errorMsg }
    }

    // ── 2. Fetch boat details (operator_id, trip type settings, max_capacity) ─
    const { data: boat } = await supabase
      .from('boats')
      .select('id, operator_id, boat_name, marina_name, slip_number, max_capacity, charter_type, requires_qualification, is_active')
      .eq('id', boatId)
      .eq('operator_id', integration.operatorId)
      .single()

    if (!boat) {
      const errorMsg = `Boat ${boatId} not found or not owned by this operator`
      await markEventError(webhookEventId, errorMsg)
      return { tripId: null, error: errorMsg }
    }

    if (!boat.is_active) {
      const errorMsg = `Boat "${boat.boat_name}" is inactive — cannot auto-create trip`
      await markEventError(webhookEventId, errorMsg)
      return { tripId: null, error: errorMsg }
    }

    // ── 3. Handle cancellation ────────────────────────────────────────────────
    if (event.eventType === 'booking.cancelled') {
      return await handleCancellation(event, integration, webhookEventId, supabase)
    }

    // ── 4. Guard: duplicate booking ref ──────────────────────────────────────
    const { data: existing } = await supabase
      .from('trips')
      .select('id, status')
      .eq('external_booking_ref', event.externalRef)
      .eq('external_platform', event.platform)
      .maybeSingle()

    if (existing) {
      // Idempotent: already created — mark event processed and return
      await markEventProcessed(webhookEventId, existing.id)
      return { tripId: existing.id, error: null }
    }

    // ── 5. Determine trip_type from boat settings ─────────────────────────────
    const tripType = boat.requires_qualification ? 'self_drive' : 'captained'

    // ── 6. Generate slug + code ───────────────────────────────────────────────
    const slug     = generateTripSlug()
    const tripCode = generateTripCode()

    // ── 7. Create trip ────────────────────────────────────────────────────────
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .insert({
        operator_id:          boat.operator_id,
        boat_id:              boatId,
        slug,
        trip_code:            tripCode,
        trip_date:            event.date,
        departure_time:       event.departureTime,
        duration_hours:       event.durationHours,
        duration_days:        event.durationDays,
        max_guests:           event.guestCount || boat.max_capacity,
        status:               'upcoming',
        charter_type:         boat.charter_type ?? 'captained',
        trip_type:            tripType,
        requires_qualification: boat.requires_qualification ?? false,
        external_booking_ref: event.externalRef,
        external_platform:    event.platform,
        integration_id:       integration.id,
        // Auto-created trips don't need requires_approval — the booking already confirmed
        requires_approval:    false,
      })
      .select('id, slug, trip_code')
      .single()

    if (tripError || !trip) {
      const errorMsg = `DB insert failed: ${tripError?.message ?? 'unknown'}`
      await markEventError(webhookEventId, errorMsg)
      return { tripId: null, error: errorMsg }
    }

    // ── 8. Mark webhook event processed ──────────────────────────────────────
    await markEventProcessed(webhookEventId, trip.id)

    // ── 9. Update integration.last_event_at ──────────────────────────────────
    await supabase
      .from('integrations')
      .update({ last_event_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', integration.id)

    // ── 10. Non-blocking: auto-send link email to booker ─────────────────────
    if (integration.autoSendLink) {
      const sendLink = async () => {
        const appUrl     = process.env.NEXT_PUBLIC_APP_URL!
        const tripLink   = `${appUrl}/trip/${trip.slug}`

        await sendBookingAutoLinkEmail({
          to:                   event.bookerEmail,
          bookerName:           event.bookerName,
          boatName:             boat.boat_name,
          tripDate:             event.date,
          departureTime:        event.departureTime,
          marinaName:           boat.marina_name,
          slipNumber:           boat.slip_number,
          tripSlug:             trip.slug,
          tripCode:             trip.trip_code,
          tripLink,
          requiresQualification: boat.requires_qualification ?? false,
          linkDelayHours:       integration.linkDelayHours,
        })
      }

      // Delay is informational for Phase 4B — eager send with logged delay note
      // TODO Phase 4C: replace with Upstash QStash scheduled task for link_delay_hours
      sendLink().catch(err =>
        console.error('[autoCreate] auto-link email failed:', err)
      )
    }

    // ── 11. Non-blocking: audit log ───────────────────────────────────────────
    auditLog({
      action:          'trip_auto_created',
      operatorId:      boat.operator_id,
      actorType:       'system',
      actorIdentifier: `webhook:${event.platform}`,
      entityType:      'trip',
      entityId:        trip.id,
      changes: {
        externalRef:   event.externalRef,
        platform:      event.platform,
        boatName:      boat.boat_name,
        date:          event.date,
        departureTime: event.departureTime,
        guestCount:    event.guestCount,
      },
    })

    return { tripId: trip.id, error: null }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unexpected error in processBookingEvent'
    console.error('[autoCreate] processBookingEvent error:', errorMsg)
    await markEventError(webhookEventId, errorMsg).catch(() => null)
    return { tripId: null, error: errorMsg }
  }
}

// ─── Cancellation handler ─────────────────────────────────────────────────────

async function handleCancellation(
  event: NormalizedBookingEvent,
  _integration: IntegrationRow,
  webhookEventId: string,
  supabase: ReturnType<typeof createServiceClient>
): Promise<ProcessResult> {
  const { data: trip } = await supabase
    .from('trips')
    .select('id, status')
    .eq('external_booking_ref', event.externalRef)
    .eq('external_platform', event.platform)
    .maybeSingle()

  if (!trip) {
    // Cancellation for a booking we never auto-created — safe to ignore
    await markEventProcessed(webhookEventId, null)
    return { tripId: null, error: null }
  }

  if (trip.status === 'cancelled') {
    await markEventProcessed(webhookEventId, trip.id)
    return { tripId: trip.id, error: null }
  }

  await supabase
    .from('trips')
    .update({ status: 'cancelled' })
    .eq('id', trip.id)

  await markEventProcessed(webhookEventId, trip.id)
  return { tripId: trip.id, error: null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function markEventProcessed(
  eventId: string,
  tripId: string | null
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('webhook_events')
    .update({
      processed:     true,
      trip_id:       tripId,
      error_message: null,
    })
    .eq('id', eventId)
}

async function markEventError(
  eventId: string,
  errorMessage: string
): Promise<void> {
  const supabase = createServiceClient()
  await supabase
    .from('webhook_events')
    .update({
      processed:     false,
      error_message: errorMessage,
      retry_count:   supabase.rpc('increment_retry_count' as never, { event_id: eventId } as never),
    })
    .eq('id', eventId)
    .catch(() =>
      // Fallback: update without RPC if increment fails
      supabase
        .from('webhook_events')
        .update({ processed: false, error_message: errorMessage })
        .eq('id', eventId)
    )
}
