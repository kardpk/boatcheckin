import { describe, it, expect, vi } from 'vitest'

// Mock server-only so it doesn't error in test environment
vi.mock('server-only', () => ({}))

// Need TRIP_LINK_SECRET for HMAC operations
process.env.TRIP_LINK_SECRET = 'test-secret-for-snapshot-tokens-must-be-32-chars'

import {
  generateSnapshotToken,
  verifySnapshotToken,
} from '@/lib/security/snapshot'

describe('snapshot tokens', () => {
  const tripId = 'trip-abc-123'

  it('generates a verifiable token', () => {
    const token = generateSnapshotToken(tripId)
    const result = verifySnapshotToken(token)
    expect(result).not.toBeNull()
    expect(result?.tripId).toBe(tripId)
    expect(result?.expired).toBe(false)
  })

  it('rejects tampered token', () => {
    const token = generateSnapshotToken(tripId)
    const [p, s] = token.split('.')
    expect(verifySnapshotToken(`${p}.TAMPERED${s}`)).toBeNull()
  })

  it('detects expired token', async () => {
    const { createHmac, randomBytes } = await import('crypto')
    const nonce = randomBytes(8).toString('hex')
    const expiredAt = Math.floor(Date.now() / 1000) - 1
    const payload = `${tripId}:${nonce}:${expiredAt}`
    const hmac = createHmac('sha256', process.env.TRIP_LINK_SECRET!)
    hmac.update(payload)
    const sig = hmac.digest('base64url')
    const token = `${Buffer.from(payload).toString('base64url')}.${sig}`

    const result = verifySnapshotToken(token)
    expect(result?.expired).toBe(true)
  })

  it('each call generates unique token', () => {
    const t1 = generateSnapshotToken(tripId)
    const t2 = generateSnapshotToken(tripId)
    expect(t1).not.toBe(t2)
  })
})
