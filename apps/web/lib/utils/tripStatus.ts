import type { TripStatus } from '@/types'

/**
 * correctTripStatus — Read-time date-aware status correction
 *
 * Computes the REAL trip status based on the current date,
 * regardless of what the DB says. This is a safety net for
 * when the daily cron fails to transition trip statuses.
 *
 * Rules:
 * 1. If DB says 'cancelled' or 'completed' → trust it (terminal states)
 * 2. If trip_date < today AND status is 'upcoming' → 'completed'
 *    (the trip date has fully passed without being started)
 * 3. If trip_date < today AND status is 'active' → 'completed'
 *    (the trip ran yesterday and wasn't ended)
 * 4. If trip_date === today AND status is 'upcoming' → 'active'
 *    (it's departure day — treat as active)
 * 5. Otherwise → trust the DB status
 *
 * @param tripDate - The trip_date column value (YYYY-MM-DD string)
 * @param dbStatus - The current status from the database
 * @returns The corrected status
 */
export function correctTripStatus(
  tripDate: string,
  dbStatus: TripStatus | string,
): TripStatus {
  // Terminal states are always trusted
  if (dbStatus === 'cancelled' || dbStatus === 'completed') {
    return dbStatus as TripStatus
  }

  const today = getToday()
  const tripDay = tripDate // Already YYYY-MM-DD

  if (tripDay < today) {
    // Trip date has passed
    return 'completed'
  }

  if (tripDay === today && dbStatus === 'upcoming') {
    // It's departure day — auto-activate
    return 'active'
  }

  return dbStatus as TripStatus
}

/**
 * isTripRelevant — Should this trip appear in the "upcoming" list?
 *
 * Returns true for trips that are today or in the future.
 * Past trips (even if status is stale) are filtered out.
 */
export function isTripRelevant(tripDate: string): boolean {
  const today = getToday()
  return tripDate >= today
}

/**
 * getToday — Returns today's date as YYYY-MM-DD string
 *
 * Uses a single consistent date source. If you need timezone
 * awareness, this is the one place to change it.
 */
export function getToday(): string {
  return new Date().toISOString().split('T')[0]!
}
