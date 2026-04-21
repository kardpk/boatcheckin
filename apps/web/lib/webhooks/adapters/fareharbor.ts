import 'server-only'

import type { NormalizedBookingEvent } from '../types'

/**
 * lib/webhooks/adapters/fareharbor.ts
 *
 * FareHarbor webhook payload adapter.
 * Normalizes FareHarbor's booking webhook to NormalizedBookingEvent.
 *
 * FareHarbor webhook payload structure (relevant fields):
 * {
 *   "type": "booking",
 *   "booking": {
 *     "pk": 12345,
 *     "uuid": "abc-def...",
 *     "status": "confirmed" | "cancelled" | "rebooked",
 *     "voucher_number": "FH-12345",
 *     "availability": {
 *       "pk": 999,
 *       "start_at": "2026-06-20T09:00:00-05:00",
 *       "end_at":   "2026-06-20T13:00:00-05:00",
 *       "capacity": 6,
 *       "item": {
 *         "pk": 77,
 *         "name": "Wild Child Morning Charter",
 *         "headline": "..."
 *       }
 *     },
 *     "contact": {
 *       "name": "John Smith",
 *       "email": "john@example.com",
 *       "phone": "+13055551234",
 *       "phone_country": "US"
 *     },
 *     "customers": [{"customer_type_rate": {...}}],
 *     "customer_count": 4
 *   }
 * }
 *
 * FareHarbor sends HMAC-SHA256 in X-FareHarbor-Signature header.
 * No prefix — raw hex digest.
 */

export interface FareHarborPayload {
  type: string
  booking: {
    pk: number
    uuid?: string
    status: string
    voucher_number?: string
    availability: {
      pk: number
      start_at: string     // ISO 8601 with timezone
      end_at: string
      capacity?: number
      item: {
        pk: number
        name: string       // experience/boat name
        headline?: string
      }
    }
    contact: {
      name: string
      email: string
      phone?: string
      phone_country?: string
    }
    customer_count?: number
    customers?: unknown[]
  }
}

const STATUS_MAP: Record<string, NormalizedBookingEvent['eventType']> = {
  confirmed:  'booking.confirmed',
  cancelled:  'booking.cancelled',
  rebooked:   'booking.modified',
}

/**
 * Normalize a FareHarbor webhook payload into a canonical NormalizedBookingEvent.
 * Returns null if the payload is not a recognized booking event.
 */
export function normalizeFareHarbor(
  payload: FareHarborPayload
): NormalizedBookingEvent | null {
  if (payload.type !== 'booking') return null

  const b = payload.booking
  const eventType = STATUS_MAP[b.status]
  if (!eventType) return null

  const startAt = new Date(b.availability.start_at)
  const endAt   = new Date(b.availability.end_at)

  if (isNaN(startAt.getTime()) || isNaN(endAt.getTime())) return null

  // Date: YYYY-MM-DD in local date of startAt
  const date = startAt.toISOString().slice(0, 10)

  // Departure time: HH:MM (24-hour) — use the timezone-offset time
  const departureTime = formatTime(startAt)

  // Duration in hours
  const durationMs    = endAt.getTime() - startAt.getTime()
  const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 2) / 2 // round to 0.5h

  // Guest count
  const guestCount = b.customer_count
    ?? (b.customers?.length ?? 1)

  return {
    eventType,
    externalRef:   String(b.pk),
    platform:      'fareharbor',
    boatName:      b.availability.item.name,
    date,
    departureTime,
    durationHours,
    durationDays:  null,  // FareHarbor doesn't natively surface multi-day — add duration_days via capacity
    bookerName:    b.contact.name,
    bookerEmail:   b.contact.email,
    bookerPhone:   b.contact.phone ?? '',
    guestCount,
    rawPayload:    payload as unknown as object,
  }
}

/** Format a Date as HH:MM (24-hour) using ISO string — timezone-safe */
function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16)
}

/** The HMAC signature header FareHarbor sends */
export const FAREHARBOR_SIGNATURE_HEADER = 'X-FareHarbor-Signature' as const
