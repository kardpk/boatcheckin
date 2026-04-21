import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

const confirmSchema = z.object({
  paymentIntentId: z.string().startsWith('pi_'),
  guestId:         z.string().uuid(),
})

/**
 * POST /api/trips/[slug]/addons/confirm
 *
 * Called by client after stripe.confirmPayment() succeeds.
 * Verifies PaymentIntent status with Stripe, then flips
 * pending orders to confirmed.
 *
 * Idempotent: safe to call twice (checks status before updating).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, { max: 10, window: 300, key: `addons-confirm:${slug}` })
  if (limited.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = confirmSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
  }

  const { paymentIntentId, guestId } = parsed.data

  // ── 1. Verify with Stripe ─────────────────────────────────────────────────
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId).catch(() => null)

  if (!pi) return NextResponse.json({ error: 'Payment intent not found' }, { status: 404 })
  if (pi.status !== 'succeeded') {
    return NextResponse.json({ error: `Payment not completed (status: ${pi.status})` }, { status: 422 })
  }

  // Verify metadata matches (prevent cross-guest exploitation)
  if (pi.metadata.guestId !== guestId || pi.metadata.tripSlug !== slug) {
    return NextResponse.json({ error: 'Payment intent mismatch' }, { status: 403 })
  }

  const chargeId = typeof pi.latest_charge === 'string'
    ? pi.latest_charge
    : (pi.latest_charge as { id: string } | null)?.id ?? null

  // ── 2. Flip pending orders to confirmed ───────────────────────────────────
  const supabase = createServiceClient()

  const { data: updated, error } = await supabase
    .from('guest_addon_orders')
    .update({
      status:               'confirmed',
      stripe_charge_id:     chargeId,
      payment_captured_at:  new Date().toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntentId)
    .eq('guest_id', guestId)
    .eq('status', 'pending')
    .select('id, addon_id, quantity, total_cents')

  if (error) {
    console.error('[addons/confirm]', error.message)
    return NextResponse.json({ error: 'Failed to confirm orders' }, { status: 500 })
  }

  if (!updated || updated.length === 0) {
    // Already confirmed (idempotent) — return success
    return NextResponse.json({ confirmed: true, alreadyConfirmed: true })
  }

  const totalCents = updated.reduce((s, r) => s + (r.total_cents as number), 0)

  auditLog({
    action: 'addon_order_payment_captured',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'guest',
    entityId: guestId,
    changes: { paymentIntentId, chargeId, orderCount: updated.length, totalCents },
  })

  return NextResponse.json({ confirmed: true, data: updated, totalCents })
}
