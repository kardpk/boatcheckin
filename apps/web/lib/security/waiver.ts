import 'server-only'

import { createHash, timingSafeEqual } from 'crypto'

/**
 * SHA-256 hash of the exact waiver text.
 * Ties a guest's signature to the precise text they read.
 * Must be called server-side — imported from waiver.ts (server-only).
 */
export function hashWaiverText(waiverText: string): string {
  return createHash('sha256')
    .update(waiverText.trim())
    .digest('hex')
}

/**
 * Verify that a submitted hash matches the current waiver text.
 * Uses timing-safe comparison to prevent timing attacks.
 * Returns false if the waiver text has changed since the guest started the flow.
 */
export function verifyWaiverHash(
  submittedHash: string,
  currentWaiverText: string
): boolean {
  const expected = hashWaiverText(currentWaiverText)
  if (submittedHash.length !== expected.length) return false
  try {
    return timingSafeEqual(
      Buffer.from(submittedHash, 'utf8'),
      Buffer.from(expected, 'utf8')
    )
  } catch {
    return false
  }
}
