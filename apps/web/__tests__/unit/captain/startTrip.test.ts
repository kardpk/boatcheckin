import { describe, it, expect } from 'vitest'
import { z } from 'zod'

// Re-test the start schema directly
const startSchema = z.object({
  snapshotToken: z.string().min(10),
  captainName: z.string().max(100).optional(),
  confirmedGuestCount: z.number().int().min(0),
  checklistConfirmed: z.boolean().refine(v => v === true),
})

describe('trip start validation', () => {
  it('accepts valid start request', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'valid-token-longer-than-ten',
      confirmedGuestCount: 7,
      checklistConfirmed: true,
    }).success).toBe(true)
  })

  it('rejects checklistConfirmed: false', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'valid-token-longer-than-ten',
      confirmedGuestCount: 7,
      checklistConfirmed: false,
    }).success).toBe(false)
  })

  it('rejects token under 10 chars', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'short',
      confirmedGuestCount: 7,
      checklistConfirmed: true,
    }).success).toBe(false)
  })

  it('rejects negative guest count', () => {
    expect(startSchema.safeParse({
      snapshotToken: 'valid-token-longer-than-ten',
      confirmedGuestCount: -1,
      checklistConfirmed: true,
    }).success).toBe(false)
  })
})
