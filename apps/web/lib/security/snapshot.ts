import 'server-only'

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Snapshot token: HMAC signed, 1hr TTL.
 * Gives captain read-only access to trip data.
 * No login required — token IS the authentication.
 */
export function generateSnapshotToken(tripId: string): string {
  const nonce = randomBytes(8).toString('hex')
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const payload = `${tripId}:${nonce}:${expiresAt}`
  const hmac = createHmac('sha256', process.env.TRIP_LINK_SECRET!)
  hmac.update(payload)
  const sig = hmac.digest('base64url')
  return `${Buffer.from(payload).toString('base64url')}.${sig}`
}

export function verifySnapshotToken(token: string): {
  tripId: string
  expired: boolean
} | null {
  try {
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return null

    const payload = Buffer.from(payloadB64, 'base64url').toString()
    const hmac = createHmac('sha256', process.env.TRIP_LINK_SECRET!)
    hmac.update(payload)
    const expected = hmac.digest('base64url')

    if (expected.length !== sig.length) return null
    const a = Buffer.from(expected)
    const b = Buffer.from(sig)
    const match = timingSafeEqual(a, b)
    if (!match) return null

    const [tripId, , expiryStr] = payload.split(':')
    const expiry = parseInt(expiryStr ?? '0')
    const expired = Date.now() / 1000 > expiry

    return { tripId: tripId!, expired }
  } catch {
    return null
  }
}
