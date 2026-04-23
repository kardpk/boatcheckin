import 'server-only'

import { createHmac, timingSafeEqual } from 'crypto'
import { generateCaptainToken, type CaptainTokenPayload } from './tokens'

/**
 * Generate a snapshot token for a trip.
 * Delegates to generateCaptainToken with version=1.
 */
export function generateSnapshotToken(tripId: string, expiresAt: Date): string {
  const { token } = generateCaptainToken(tripId, 1, expiresAt)
  return token
}

/**
 * Verify a captain snapshot token.
 *
 * Unlike verifyCaptainToken (which returns null for BOTH invalid AND expired
 * tokens), this function distinguishes the two cases:
 *   - tampered / bad signature  → returns null
 *   - valid HMAC but expired    → returns { ..., expired: true }
 *
 * This lets callers show <TokenExpiredPage /> vs <TokenInvalidPage />.
 */
export function verifySnapshotToken(
  token: string
): { tripId: string; expired: boolean } | null {
  try {
    const secret = process.env.CAPTAIN_TOKEN_SECRET
    if (!secret) {
      console.error('[snapshot] CAPTAIN_TOKEN_SECRET not configured')
      return null
    }

    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    // Verify HMAC signature — must pass before we trust any payload data
    const hmac = createHmac('sha256', secret)
    hmac.update(payloadB64)
    const expectedSig = hmac.digest('base64url')

    const sigBuf = Buffer.from(signature, 'base64url')
    const expectedBuf = Buffer.from(expectedSig, 'base64url')
    if (sigBuf.length !== expectedBuf.length) return null
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null

    // Decode payload — HMAC already verified, content is trusted
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString()
    ) as CaptainTokenPayload

    if (!payload.tripId) return null

    // Distinguish expired vs invalid — callers can show the right message
    const expired = Date.now() > payload.expiresAt
    return { tripId: payload.tripId, expired }
  } catch {
    return null
  }
}
