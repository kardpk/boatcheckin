import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'

const patchSchema = z.object({
  description:           z.string().max(100).optional(),
  discountType:          z.enum(['percent', 'fixed_cents', 'unlock_addons']).optional(),
  discountValue:         z.number().int().min(0).optional(),
  validFrom:             z.string().nullable().optional(),
  validUntil:            z.string().nullable().optional(),
  maxUses:               z.number().int().min(1).nullable().optional(),
  applicableCategories:  z.array(z.string()).nullable().optional(),
  isActive:              z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 30, window: 60, key: `prop-code-patch:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  const d = parsed.data
  if (d.description         !== undefined) updates.description          = d.description
  if (d.discountType        !== undefined) updates.discount_type        = d.discountType
  if (d.discountValue       !== undefined) updates.discount_value       = d.discountValue
  if (d.validFrom           !== undefined) updates.valid_from           = d.validFrom
  if (d.validUntil          !== undefined) updates.valid_until          = d.validUntil
  if (d.maxUses             !== undefined) updates.max_uses             = d.maxUses
  if (d.applicableCategories !== undefined) updates.applicable_categories = d.applicableCategories?.length ? d.applicableCategories : null
  if (d.isActive            !== undefined) updates.is_active            = d.isActive

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('property_codes')
    .update(updates)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select('id, code, discount_type, discount_value, is_active')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed or not found' }, { status: 500 })

  return NextResponse.json({ data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('property_codes')
    .delete()
    .eq('id', id)
    .eq('operator_id', operator.id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  return NextResponse.json({ data: { success: true } })
}
