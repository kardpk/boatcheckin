import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { addonOrderSchema } from '@/lib/security/sanitise'
import { auditLog } from '@/lib/security/audit'
import { sendAddonOrderNotification } from '@/lib/notifications/email'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-01-27.acacia' })

type AddonPaymentMode = 'stripe' | 'external' | 'free'

/**
 * POST /api/trips/[slug]/addons
 *
 * Tri-mode payment based on operator.addon_payment_mode:
 *   'stripe'   → Creates Stripe PaymentIntent, returns clientSecret
 *                Client confirms then calls /addons/confirm
 *   'external' → Inserts orders as confirmed, dispatches order notification
 *                to operator so resort can handle billing in their system
 *   'free'     → Inserts orders as confirmed, total_cents = 0
 *
 * All modes:
 *   - Server-side price calculation (never trust client)
 *   - Cutoff validation (reject past cutoff_hours)
 *   - Seasonal filter (reject out-of-season addons)
 *   - Property code discount applied (category-scoped)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, { max: 20, window: 3600, key: `addons:${slug}` })
  if (limited.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const parsed = addonOrderSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid order data' }, { status: 400 })

  const { guestId, orders } = parsed.data
  // Optional: propertyCodeId from client (we re-verify server-side)
  const propertyCodeId = (body as Record<string, unknown>).propertyCodeId as string | null ?? null

  const supabase = createServiceClient()

  // ── 1. Verify guest + trip ────────────────────────────────────────────────
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id, operator_id')
    .eq('id', guestId)
    .is('deleted_at', null)
    .single()

  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id, slug, trip_date, departure_time, external_booking_ref, trip_code, boat_id')
    .eq('id', guest.trip_id)
    .eq('slug', slug)
    .single()

  if (!trip) return NextResponse.json({ error: 'Guest not found' }, { status: 404 })

  // ── 2. Read operator payment mode + Stripe Connect ────────────────────────
  const { data: operator } = await supabase
    .from('operators')
    .select('id, company_name, addon_payment_mode, stripe_connect_account_id')
    .eq('id', guest.operator_id)
    .single()

  if (!operator) return NextResponse.json({ error: 'Operator not found' }, { status: 500 })

  const paymentMode = (operator.addon_payment_mode as AddonPaymentMode) ?? 'external'

  // ── 3. Compute departure datetime for cutoff validation ───────────────────
  const departureDateTime = new Date(`${trip.trip_date}T${trip.departure_time ?? '09:00:00'}`)
  const nowMs = Date.now()

  // ── 4. Fetch addons with all resort fields SERVER-SIDE ────────────────────
  const addonIds = orders.map(o => o.addonId)
  const { data: addons } = await supabase
    .from('addons')
    .select('id, price_cents, max_quantity, is_active, name, category, cutoff_hours, is_seasonal, seasonal_from, seasonal_until')
    .in('id', addonIds)
    .eq('operator_id', guest.operator_id)
    .eq('is_active', true)

  if (!addons || addons.length !== addonIds.length) {
    return NextResponse.json({ error: 'One or more addons not available' }, { status: 400 })
  }

  // ── 5. Validate: cutoff + seasonal per addon ──────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  for (const addon of addons) {
    // Seasonal: if marked seasonal and today is outside the window, reject
    if (addon.is_seasonal && addon.seasonal_from && addon.seasonal_until) {
      if (today < addon.seasonal_from || today > addon.seasonal_until) {
        return NextResponse.json(
          { error: `"${addon.name}" is not available this time of year` },
          { status: 400 }
        )
      }
    }
    // Cutoff: if cutoff_hours > 0 and we're past the window, reject
    if ((addon.cutoff_hours ?? 0) > 0) {
      const cutoffMs = departureDateTime.getTime() - (addon.cutoff_hours ?? 0) * 3_600_000
      if (nowMs > cutoffMs) {
        return NextResponse.json(
          { error: `The order window for "${addon.name}" has closed` },
          { status: 400 }
        )
      }
    }
    // Validate quantities
    const order = orders.find(o => o.addonId === addon.id)!
    if (order.quantity > (addon.max_quantity ?? 4)) {
      return NextResponse.json(
        { error: `"${addon.name}" max quantity is ${addon.max_quantity}` },
        { status: 400 }
      )
    }
  }

  const addonMap = new Map(addons.map(a => [a.id, a]))

  // ── 6. Build order rows with server prices ────────────────────────────────
  const baseRows = orders.map(order => {
    const addon = addonMap.get(order.addonId)!
    return {
      addon,
      addonId:    order.addonId,
      quantity:   order.quantity,
      unitCents:  addon.price_cents as number,
      totalCents: (addon.price_cents as number) * order.quantity,
      category:   addon.category as string,
    }
  })

  // ── 7. Apply property code discount (re-verified server-side) ─────────────
  let discountedRows = [...baseRows]
  const externalRef  = (trip.external_booking_ref as string | null) ?? (trip.trip_code as string)

  if (propertyCodeId) {
    const { data: propCode } = await supabase
      .from('property_codes')
      .select('id, discount_type, discount_value, applicable_categories, valid_from, valid_until, max_uses, use_count, boat_id')
      .eq('id', propertyCodeId)
      .eq('operator_id', guest.operator_id)
      .eq('is_active', true)
      .single()

    if (propCode) {
      const applicableCategories = (propCode.applicable_categories as string[] | null) ?? null
      discountedRows = baseRows.map(row => {
        const applies = !applicableCategories || applicableCategories.includes(row.category)
        if (!applies) return row

        let discounted = row.totalCents
        if (propCode.discount_type === 'percent') {
          discounted = Math.round(row.totalCents * (1 - (propCode.discount_value as number) / 100))
        } else if (propCode.discount_type === 'fixed_cents') {
          discounted = Math.max(0, row.totalCents - (propCode.discount_value as number))
        }
        return { ...row, totalCents: discounted }
      })
    }
  }

  const grandTotalCents = discountedRows.reduce((s, r) => s + r.totalCents, 0)

  // ── 8. Route by payment mode ──────────────────────────────────────────────

  // ─── MODE: free ───────────────────────────────────────────────────────────
  if (paymentMode === 'free' || grandTotalCents === 0) {
    return insertConfirmedOrders({
      supabase, guestId, tripId: trip.id, operatorId: guest.operator_id,
      rows: discountedRows, externalRef, platformFeeCents: 0,
      stripePaymentIntentId: null, stripeChargeId: null,
    })
  }

  // ─── MODE: external ───────────────────────────────────────────────────────
  if (paymentMode === 'external') {
    const result = await insertConfirmedOrders({
      supabase, guestId, tripId: trip.id, operatorId: guest.operator_id,
      rows: discountedRows, externalRef, platformFeeCents: 0,
      stripePaymentIntentId: null, stripeChargeId: null,
    })

    // Dispatch order notification to operator (fire and forget)
    const orderSummary = discountedRows.map(r =>
      `${addonMap.get(r.addonId)?.name ?? r.addonId} × ${r.quantity} — $${(r.totalCents / 100).toFixed(2)}`
    ).join(', ')

    sendAddonOrderNotification({
      operatorId:    guest.operator_id,
      operatorName:  (operator.company_name as string | null) ?? 'Operator',
      externalRef,
      guestId,
      orderSummary,
      totalCents:    grandTotalCents,
    }).catch(err => console.error('[addons:external-notify]', err))

    return result
  }

  // ─── MODE: stripe ─────────────────────────────────────────────────────────
  const stripeAccountId = operator.stripe_connect_account_id as string | null
  if (!stripeAccountId) {
    return NextResponse.json(
      { error: 'stripe_not_configured', message: 'Connect your Stripe account in Settings → Add-On Menu to collect payments.' },
      { status: 422 }
    )
  }

  const platformFeeCents = Math.round(grandTotalCents * 0.03)

  const paymentIntent = await stripe.paymentIntents.create({
    amount:                  grandTotalCents,
    currency:                'usd',
    application_fee_amount:  platformFeeCents,
    transfer_data:           { destination: stripeAccountId },
    metadata: {
      guestId,
      tripSlug:  slug,
      tripId:    trip.id,
      operatorId: guest.operator_id,
    },
  })

  // Insert as pending — confirm route will flip to confirmed after payment
  const pendingRows = discountedRows.map(r => ({
    guest_id:                  guestId,
    trip_id:                   trip.id,
    addon_id:                  r.addonId,
    operator_id:               guest.operator_id,
    quantity:                  r.quantity,
    unit_price_cents:          r.unitCents,
    total_cents:               r.totalCents,
    fulfillment_status:        'ordered' as const,
    status:                    'pending' as const,
    stripe_payment_intent_id:  paymentIntent.id,
    platform_fee_cents:        platformFeeCents,
    external_reference:        externalRef,
  }))

  const { data: pending, error: pendingError } = await supabase
    .from('guest_addon_orders')
    .insert(pendingRows)
    .select('id')

  if (pendingError) {
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  return NextResponse.json({
    mode:             'stripe',
    clientSecret:     paymentIntent.client_secret,
    paymentIntentId:  paymentIntent.id,
    totalCents:       grandTotalCents,
    platformFeeCents,
    orderIds:         pending?.map(p => p.id) ?? [],
  })
}

// ─── Helper: insert confirmed orders (external/free modes) ─────────────────────

async function insertConfirmedOrders(args: {
  supabase: ReturnType<typeof createServiceClient>
  guestId: string
  tripId: string
  operatorId: string
  rows: Array<{ addonId: string; quantity: number; unitCents: number; totalCents: number; category: string }>
  externalRef: string
  platformFeeCents: number
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
}) {
  const insertRows = args.rows.map(r => ({
    guest_id:                 args.guestId,
    trip_id:                  args.tripId,
    addon_id:                 r.addonId,
    operator_id:              args.operatorId,
    quantity:                 r.quantity,
    unit_price_cents:         r.unitCents,
    total_cents:              r.totalCents,
    fulfillment_status:       'ordered' as const,
    status:                   'confirmed' as const,
    stripe_payment_intent_id: args.stripePaymentIntentId,
    stripe_charge_id:         args.stripeChargeId,
    platform_fee_cents:       args.platformFeeCents,
    external_reference:       args.externalRef,
    payment_captured_at:      args.stripeChargeId ? new Date().toISOString() : null,
  }))

  const { data: inserted, error } = await args.supabase
    .from('guest_addon_orders')
    .insert(insertRows)
    .select('id, addon_id, quantity, total_cents')

  if (error) {
    return NextResponse.json({ error: 'Order failed. Please try again.' }, { status: 500 })
  }

  const totalCents = insertRows.reduce((s, r) => s + r.total_cents, 0)

  auditLog({
    action: 'addon_ordered',
    actorType: 'guest',
    actorIdentifier: args.guestId,
    entityType: 'guest',
    entityId: args.guestId,
    changes: { tripId: args.tripId, orderCount: insertRows.length, totalCents },
  })

  return NextResponse.json({ mode: 'external', confirmed: true, data: inserted, totalCents })
}
