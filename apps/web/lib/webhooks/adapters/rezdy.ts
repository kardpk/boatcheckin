import 'server-only'

import type { NormalizedBookingEvent } from '../types'

/**
 * lib/webhooks/adapters/rezdy.ts
 *
 * Rezdy webhook payload adapter.
 * Scaffolded for 4B — structurally complete, untested until Rezdy account available.
 *
 * Rezdy webhook payload structure (relevant fields):
 * {
 *   "resellerReference": "...",
 *   "orderNumber": "R2345678",
 *   "status": "CONFIRMED" | "CANCELLED" | "PROCESSING",
 *   "customer": {
 *     "firstName": "John",
 *     "lastName": "Smith",
 *     "email": "john@example.com",
 *     "phone": "+13055551234"
 *   },
 *   "items": [{
 *     "productName": "Morning Harbor Tour",
 *     "productCode": "PROD001",
 *     "startTime": "2026-06-20 09:00:00",
 *     "endTime":   "2026-06-20 13:00:00",
 *     "quantities": [{"value": 4, "label": "Adult"}]
 *   }]
 * }
 *
 * Rezdy sends HMAC-SHA256 in X-Rezdy-Signature header.
 */

export interface RezdyPayload {
  orderNumber: string
  status: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  items: Array<{
    productName: string
    productCode?: string
    startTime: string     // "YYYY-MM-DD HH:MM:SS"
    endTime?: string
    quantities?: Array<{ value: number; label: string }>
  }>
}

const STATUS_MAP: Record<string, NormalizedBookingEvent['eventType']> = {
  CONFIRMED:  'booking.confirmed',
  CANCELLED:  'booking.cancelled',
  PROCESSING: 'booking.modified',
}

export function normalizeRezdy(
  payload: RezdyPayload
): NormalizedBookingEvent | null {
  const eventType = STATUS_MAP[payload.status]
  if (!eventType) return null

  const item = payload.items[0]
  if (!item) return null

  // Rezdy uses "YYYY-MM-DD HH:MM:SS" format
  const startAt = new Date(item.startTime.replace(' ', 'T'))
  if (isNaN(startAt.getTime())) return null

  const date          = item.startTime.slice(0, 10)
  const departureTime = item.startTime.slice(11, 16)

  let durationHours = 4 // sensible default if endTime missing
  if (item.endTime) {
    const endAt = new Date(item.endTime.replace(' ', 'T'))
    const ms    = endAt.getTime() - startAt.getTime()
    durationHours = Math.round((ms / (1000 * 60 * 60)) * 2) / 2
  }

  const guestCount = (item.quantities ?? []).reduce(
    (sum, q) => sum + (q.value ?? 0), 0
  ) || 1

  const bookerName = [payload.customer.firstName, payload.customer.lastName]
    .filter(Boolean).join(' ')

  return {
    eventType,
    externalRef:   payload.orderNumber,
    platform:      'rezdy',
    boatName:      item.productName,
    date,
    departureTime,
    durationHours,
    durationDays:  null,
    bookerName,
    bookerEmail:   payload.customer.email,
    bookerPhone:   payload.customer.phone ?? '',
    guestCount,
    rawPayload:    payload as unknown as object,
  }
}

export const REZDY_SIGNATURE_HEADER = 'X-Rezdy-Signature' as const
