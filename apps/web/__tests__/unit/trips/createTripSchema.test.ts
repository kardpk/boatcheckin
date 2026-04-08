import { describe, it, expect } from 'vitest'
import { createTripSchema } from '@/lib/security/sanitise'

describe('createTripSchema', () => {
  const valid = {
    boatId: '550e8400-e29b-41d4-a716-446655440000',
    tripDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]!,
    departureTime: '09:00',
    durationHours: 4,
    maxGuests: 8,
    bookingType: 'private' as const,
    requiresApproval: false,
    charterType: 'captained' as const,
  }

  it('accepts valid trip data', () => {
    expect(createTripSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects past trip dates', () => {
    const result = createTripSchema.safeParse({ ...valid, tripDate: '2020-01-01' })
    expect(result.success).toBe(false)
    expect(JSON.stringify(result.error)).toContain('past')
  })

  it('rejects invalid UUID for boatId', () => {
    expect(
      createTripSchema.safeParse({ ...valid, boatId: 'not-a-uuid' }).success,
    ).toBe(false)
  })

  it('rejects duration below 0.5', () => {
    expect(
      createTripSchema.safeParse({ ...valid, durationHours: 0.25 }).success,
    ).toBe(false)
  })

  it('rejects maxGuests of 0', () => {
    expect(
      createTripSchema.safeParse({ ...valid, maxGuests: 0 }).success,
    ).toBe(false)
  })

  it('rejects maxGuests over 500', () => {
    expect(
      createTripSchema.safeParse({ ...valid, maxGuests: 501 }).success,
    ).toBe(false)
  })

  it('rejects invalid time format', () => {
    expect(
      createTripSchema.safeParse({ ...valid, departureTime: '9am' }).success,
    ).toBe(false)
  })

  it('accepts optional custom trip code', () => {
    expect(
      createTripSchema.safeParse({ ...valid, tripCode: 'SUN4' }).success,
    ).toBe(true)
  })

  it('rejects trip code with lowercase', () => {
    expect(
      createTripSchema.safeParse({ ...valid, tripCode: 'sun4' }).success,
    ).toBe(false)
  })

  it('rejects notes over 500 chars', () => {
    expect(
      createTripSchema.safeParse({ ...valid, specialNotes: 'x'.repeat(501) }).success,
    ).toBe(false)
  })

  it('accepts notes exactly at 500 chars', () => {
    expect(
      createTripSchema.safeParse({ ...valid, specialNotes: 'x'.repeat(500) }).success,
    ).toBe(true)
  })
})
