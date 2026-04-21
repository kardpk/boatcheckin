import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'

const schema = z.object({
  addonPaymentMode: z.enum(['stripe', 'external', 'free']),
})

/**
 * PATCH /api/dashboard/operators/payment-mode
 * Operator toggles addon_payment_mode for their account.
 */
export async function PATCH(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 10, window: 60, key: `payment-mode:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('operators')
    .update({ addon_payment_mode: parsed.data.addonPaymentMode })
    .eq('id', operator.id)

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  return NextResponse.json({ data: { addonPaymentMode: parsed.data.addonPaymentMode } })
}
