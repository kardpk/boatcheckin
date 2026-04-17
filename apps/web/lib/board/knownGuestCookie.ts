import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

/**
 * Per-boat known-guest cookie utilities.
 *
 * When a guest completes registration on /trip/[slug], the server writes
 * a signed HTTP-only cookie scoped to the specific boat they registered on.
 * When they later scan the permanent /board/[publicSlug] QR code, the cookie
 * lets us recognise them and show their boarding pass directly.
 *
 * Cookie format:
 *   Name:  bck-guest-{boatId}
 *   Value: base64url(guestId).base64url(HMAC-SHA256(guestId:boatId))
 *
 * Security properties:
 *   - HttpOnly: true — not accessible from JS
 *   - SameSite: Lax   — survives QR redirect, blocked on cross-site POST
 *   - Secure: true in production
 *   - Max-Age: 30 days
 *   - Scoped per boat (not per operator) to minimise scope on compromise
 *   - Signed with QR_HMAC_SECRET — tamper-evident
 *   - timingSafeEqual comparison — no timing oracle
 */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/** Cookie name for a specific boat */
export function cookieName(boatId: string): string {
  return `bck-guest-${boatId}`;
}

/** Build the HMAC-signed cookie value for (guestId, boatId) */
export function buildKnownGuestCookieValue(
  guestId: string,
  boatId: string
): string {
  const secret = process.env.QR_HMAC_SECRET!;
  const payload = `${guestId}:${boatId}`;
  const payloadB64 = Buffer.from(payload).toString("base64url");

  const hmac = createHmac("sha256", secret);
  hmac.update(payload);
  const sig = hmac.digest("base64url");

  return `${payloadB64}.${sig}`;
}

/**
 * Verify a known-guest cookie value.
 * Returns the guest UUID if valid; null otherwise.
 * Never throws — all failures return null.
 */
export function verifyKnownGuestCookie(
  cookieValue: string,
  boatId: string
): string | null {
  try {
    const dotIndex = cookieValue.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const payloadB64 = cookieValue.slice(0, dotIndex);
    const signature = cookieValue.slice(dotIndex + 1);
    if (!payloadB64 || !signature) return null;

    const payload = Buffer.from(payloadB64, "base64url").toString();
    const parts = payload.split(":");
    if (parts.length !== 2) return null;

    const [guestId, cookieBoatId] = parts;
    if (!guestId || cookieBoatId !== boatId) return null;

    // Recompute expected signature
    const secret = process.env.QR_HMAC_SECRET!;
    const hmac = createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSig = hmac.digest("base64url");

    // Timing-safe comparison
    const sigBuf = Buffer.from(signature, "base64url");
    const expBuf = Buffer.from(expectedSig, "base64url");
    if (sigBuf.length !== expBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expBuf)) return null;

    return guestId;
  } catch {
    return null;
  }
}

/** Cookie options for Set-Cookie header */
export function knownGuestCookieOptions(boatId: string) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    name: cookieName(boatId),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}
