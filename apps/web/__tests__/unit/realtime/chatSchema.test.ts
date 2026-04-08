import { QUICK_CHIPS, CHANNELS } from '@/types'
import { z } from 'zod'

// ─── messageSchema (mirrors the API validation) ─────────────────

const messageSchema = z.object({
  body: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .transform(s => s.trim()),
  senderType: z.enum(['guest', 'captain', 'operator', 'system']),
  senderName: z.string().min(1).max(100).transform(s => s.trim()),
  senderId: z.string().min(1).max(100),
  chipKey: z.string().max(50).nullable().optional(),
  isQuickChip: z.boolean().optional().default(false),
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('messageSchema', () => {
  const valid = {
    body: 'Where do I park?',
    senderType: 'guest' as const,
    senderName: 'Alice',
    senderId: 'guest-123',
  }

  it('accepts a minimal valid message', () => {
    const result = messageSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('rejects empty body', () => {
    const result = messageSchema.safeParse({ ...valid, body: '' })
    expect(result.success).toBe(false)
  })

  it('rejects body > 500 chars', () => {
    const result = messageSchema.safeParse({
      ...valid,
      body: 'x'.repeat(501),
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid senderType', () => {
    const result = messageSchema.safeParse({
      ...valid,
      senderType: 'hacker',
    })
    expect(result.success).toBe(false)
  })

  it('trims whitespace from body', () => {
    const result = messageSchema.safeParse({
      ...valid,
      body: '  Where do I park?  ',
    })
    if (result.success) {
      expect(result.data.body).toBe('Where do I park?')
    }
  })

  it('accepts quick chip with chipKey', () => {
    expect(messageSchema.safeParse({
      ...valid,
      chipKey: 'parking',
      isQuickChip: true,
    }).success).toBe(true)
  })
})

describe('QUICK_CHIPS', () => {
  it('has 6 chips', () => {
    expect(QUICK_CHIPS).toHaveLength(6)
  })

  it('each chip has key, icon, label', () => {
    for (const chip of QUICK_CHIPS) {
      expect(chip.key).toBeTruthy()
      expect(chip.icon).toBeTruthy()
      expect(chip.label).toBeTruthy()
    }
  })

  it('keys are unique', () => {
    const keys = QUICK_CHIPS.map(c => c.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('CHANNELS', () => {
  it('generates scoped channel names', () => {
    const tripId = 'trip-abc-123'
    expect(CHANNELS.tripGuests(tripId))
      .toBe(`trip-guests-${tripId}`)
    expect(CHANNELS.tripChat(tripId))
      .toBe(`trip-chat-${tripId}`)
    expect(CHANNELS.tripStatus(tripId))
      .toBe(`trip-status-${tripId}`)
  })

  it('different trips get different channels', () => {
    expect(CHANNELS.tripChat('trip-1'))
      .not.toBe(CHANNELS.tripChat('trip-2'))
  })
})
