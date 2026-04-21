import 'server-only'

import { timingSafeEqual, createHmac } from 'crypto'

/**
 * lib/webhooks/verify.ts
 *
 * Constant-time HMAC-SHA256 webhook signature verification.
 * Used by FareHarbor and Rezdy adapters.
 * Bookeo uses HTTP Basic Auth instead (handled separately).
 */

/**
 * Verifies a webhook HMAC-SHA256 signature.
 * Uses constant-time comparison to prevent timing attacks.
 *
 * @param secret - The integration's webhook_secret
 * @param rawBody - The raw request body string (must be pre-read before JSON parse)
 * @param signature - The signature header value from the platform
 * @param prefix - Optional prefix to strip (e.g. 'sha256=' for some platforms)
 */
export function verifyWebhookHmac(
  secret: string,
  rawBody: string,
  signature: string,
  prefix = ''
): boolean {
  try {
    const sigToCompare = prefix ? signature.replace(prefix, '') : signature

    const expected = createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex')

    // Constant-time comparison — both buffers must be the same length
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(sigToCompare, 'hex')

    if (a.length !== b.length) return false

    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

/**
 * Verifies HTTP Basic Auth for platforms that use it (e.g. Bookeo).
 *
 * @param authHeader - The Authorization header value
 * @param expectedApiKey - The stored api_key for this integration
 */
export function verifyBasicAuth(
  authHeader: string | null,
  expectedApiKey: string
): boolean {
  if (!authHeader?.startsWith('Basic ')) return false
  try {
    const encoded = authHeader.slice(6)
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    // Bookeo uses apiKey:secret format — we store the full base64 as api_key
    const expected = Buffer.from(expectedApiKey)
    const received = Buffer.from(decoded)
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  } catch {
    return false
  }
}
