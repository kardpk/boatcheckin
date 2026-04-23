import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/**
 * GET /api/billing
 * Creates (or reuses) a Stripe customer for the operator, then redirects
 * them to Stripe's hosted Billing Portal — which provides invoice history,
 * plan upgrades/downgrades, and payment method management without any
 * custom UI on our side.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  void req
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json(
      { error: 'Billing not configured. Contact hello@boatcheckin.com.' },
      { status: 503 }
    )
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' })
  const { operator } = await requireOperator()
  const supabase = createServiceClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boatcheckin.com'

  // Fetch current operator row for Stripe customer ID
  const { data: opRow } = await supabase
    .from('operators')
    .select('stripe_customer_id, email, full_name, company_name')
    .eq('id', operator.id)
    .single()

  let customerId = opRow?.stripe_customer_id as string | null | undefined

  // Create Stripe customer on first use
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (opRow?.email as string) ?? operator.email,
      name: (opRow?.company_name as string | null) ?? (opRow?.full_name as string) ?? 'Operator',
      metadata: { operatorId: operator.id },
    })
    customerId = customer.id

    await supabase
      .from('operators')
      .update({ stripe_customer_id: customerId })
      .eq('id', operator.id)
  }

  // Create a Billing Portal session — returns a short-lived URL
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/dashboard/billing`,
  })

  return NextResponse.redirect(session.url)
}
