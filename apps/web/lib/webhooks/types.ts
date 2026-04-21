/**
 * lib/webhooks/types.ts
 *
 * Canonical types for the Phase 4B webhook integration layer.
 * All booking platform adapters normalize to NormalizedBookingEvent.
 */

/** Supported third-party booking platforms */
export type WebhookPlatform = 'fareharbor' | 'rezdy' | 'bookeo' | 'checkfront' | 'manual'

/** Normalized booking event output by every platform adapter */
export interface NormalizedBookingEvent {
  /** Platform-agnostic event type */
  eventType: 'booking.confirmed' | 'booking.cancelled' | 'booking.modified'
  /** The platform's native booking ID (used as external_booking_ref on trips) */
  externalRef: string
  platform: WebhookPlatform
  /** Experience/vessel name exactly as the platform sends it — pre name-mapping */
  boatName: string
  /** Trip date: YYYY-MM-DD */
  date: string
  /** Departure time: HH:MM (24-hour) */
  departureTime: string
  /** Duration in hours (fractional: 2.5 = 2h30m) */
  durationHours: number
  /** Days count for multi-night rentals; null = same-day */
  durationDays: number | null
  /** Primary booker name (may be different from all guests if group booking) */
  bookerName: string
  /** Email to send the auto-link to */
  bookerEmail: string
  bookerPhone: string
  /** Total headcount from the booking */
  guestCount: number
  /** Raw unmodified payload from the platform for audit */
  rawPayload: object
}

/** DB row shape for the integrations table */
export interface IntegrationRow {
  id: string
  operatorId: string
  platform: WebhookPlatform
  webhookSecret: string
  webhookEndpointToken: string
  boatNameMap: Record<string, string>  // fareharbor_name → boat_uuid
  autoCreateTrips: boolean
  autoSendLink: boolean
  linkDelayHours: number
  isActive: boolean
  lastEventAt: string | null
  createdAt: string
}

/** DB row shape for webhook_events */
export interface WebhookEventRow {
  id: string
  integrationId: string | null
  operatorId: string | null
  platform: WebhookPlatform
  eventType: string
  externalRef: string | null
  payload: object
  tripId: string | null
  processed: boolean
  errorMessage: string | null
  retryCount: number
  createdAt: string
}

/** Row returned by v_fleet_today view */
export interface FleetTodayRow {
  boatId: string
  operatorId: string
  boatName: string
  slipNumber: string | null
  tripId: string | null
  tripType: 'captained' | 'self_drive' | 'bareboat' | null
  departureTime: string | null
  durationHours: number | null
  durationDays: number | null
  tripStatus: 'upcoming' | 'active' | 'completed' | 'cancelled' | null
  tripCode: string | null
  tripSlug: string | null
  requiresQualification: boolean | null
  totalGuests: number
  waiversSigned: number
  checkedIn: number
  flags: number
  addonsPendingPrep: number
  addonRevenueCents: number | null
}

/** Row returned by v_fulfillment_board view */
export interface FulfillmentOrderRow {
  tripId: string
  tripDate: string
  departureTime: string
  operatorId: string
  boatName: string
  slipNumber: string | null
  addonId: string
  addonName: string
  category: AddonCategory
  prepTimeHours: number
  orderId: string
  quantity: number
  fulfillmentStatus: FulfillmentStatus
  fulfillmentNotes: string | null
  totalCents: number
  notes: string | null
  guestName: string
}

/** Addon fulfillment status (ordered forward-only) */
export type FulfillmentStatus = 'ordered' | 'prepping' | 'ready' | 'loaded' | 'delivered'

/** Addon category for menu management */
export type AddonCategory =
  | 'food'
  | 'beverage'
  | 'gear'
  | 'safety'
  | 'experience'
  | 'seasonal'
  | 'other'
  | 'general'

/** Property code for hotel/marina guest discounts */
export interface PropertyCode {
  id: string
  operatorId: string
  boatId: string | null    // null = all boats for this operator
  code: string
  description: string | null
  discountType: 'percent' | 'fixed_cents' | 'unlock_addons'
  discountValue: number
  validFrom: string | null
  validUntil: string | null
  maxUses: number | null
  useCount: number
  isActive: boolean
  createdAt: string
}
