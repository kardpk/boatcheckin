import 'server-only'

import type { NormalizedBookingEvent } from '../types'

/**
 * lib/webhooks/adapters/bookeo.ts
 *
 * Bookeo webhook payload adapter.
 * Scaffolded for 4B — structurally complete, untested until Bookeo account available.
 *
 * Bookeo uses HTTP Basic Auth (not HMAC) for webhook security.
 * The base64-encoded "username:password" is stored as integration.api_key.
 *
 * Bookeo webhook payload structure (relevant fields):
 * {
 *   "id": "booking123",
 *   "bookingNumber": "BKO-2026-0001",
 *   "status": "confirmed" | "cancelled" | "pending",
 *   "startTime": "20260620T090000",
 *   "endTime":   "20260620T130000",
 *   "productId": "product_abc",
 *   "title": "Morning Charter — Wild Child",
 *   "numParticipants": 4,
 *   "customer": {
 *     "firstName": "John",
 *     "lastName": "Smith",
 *     "email": "john@example.com",
 *     "phoneNumbers": [{"number": "+13055551234"}]
 *   }
 * }
 */

export interface BookeoPayload {
  id: string
  bookingNumber: string
  status: string
  startTime: string     // "YYYYMMDDTHHmmss" (Bookeo ISO-compact)
  endTime?: string
  productId?: string
  title?: string        // product/experience title
  numParticipants?: number
  customer: {
    firstName?: string
    lastName?: string
    email: string
    phoneNumbers?: Array<{ number: string }>
  }
}

const STATUS_MAP: Record<string, NormalizedBookingEvent['eventType']> = {
  confirmed: 'booking.confirmed',
  cancelled: 'booking.cancelled',
  pending:   'booking.modified',
}

/** Parse Bookeo's compact ISO format: "20260620T090000" → Date */
function parseBookeoTime(bookeoTime: string): Date | null {
  // "YYYYMMDDTHHmmss" → standard ISO "YYYY-MM-DDTHH:mm:ss"
  const m = bookeoTime.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/)
  if (!m) return null
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`)
}

export function normalizeBookeo(
  payload: BookeoPayload
): NormalizedBookingEvent | null {
  const eventType = STATUS_MAP[payload.status]
  if (!eventType) return null

  const startAt = parseBookeoTime(payload.startTime)
  if (!startAt || isNaN(startAt.getTime())) return null

  const date          = startAt.toISOString().slice(0, 10)
  const departureTime = startAt.toISOString().slice(11, 16)

  let durationHours = 4
  if (payload.endTime) {
    const endAt = parseBookeoTime(payload.endTime)
    if (endAt && !isNaN(endAt.getTime())) {
      const ms = endAt.getTime() - startAt.getTime()
      durationHours = Math.round((ms / (1000 * 60 * 60)) * 2) / 2
    }
  }

  const bookerName = [payload.customer.firstName, payload.customer.lastName]
    .filter(Boolean).join(' ') || 'Guest'
  const bookerPhone = payload.customer.phoneNumbers?.[0]?.number ?? ''

  // boatName: use product title; operator maps to boat in the UI
  const boatName = payload.title ?? payload.productId ?? 'Unknown'

  return {
    eventType,
    externalRef:   payload.bookingNumber,
    platform:      'bookeo',
    boatName,
    date,
    departureTime,
    durationHours,
    durationDays:  null,
    bookerName,
    bookerEmail:   payload.customer.email,
    bookerPhone,
    guestCount:    payload.numParticipants ?? 1,
    rawPayload:    payload as unknown as object,
  }
}
