import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

const ADDON_CATEGORIES = ['food','beverage','gear','safety','experience','seasonal','other','general'] as const

const patchSchema = z.object({
  name:                         z.string().min(1).max(80).optional(),
  description:                  z.string().max(300).nullable().optional(),
  priceCents:                   z.number().int().min(0).optional(),
  maxQuantity:                  z.number().int().min(1).max(20).optional(),
  isActive:                     z.boolean().optional(),
  category:                     z.enum(ADDON_CATEGORIES).optional(),
  prepTimeHours:                z.number().min(0).max(72).optional(),
  cutoffHours:                  z.number().min(0).max(96).optional(),
  isSeasonal:                   z.boolean().optional(),
  seasonalFrom:                 z.string().nullable().optional(),
  seasonalUntil:                z.string().nullable().optional(),
  requiresStaffConfirmation:    z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 30, window: 60, key: `addon-patch:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const d = parsed.data
  const updates: Record<string, unknown> = {}

  if (d.name                       !== undefined) updates.name                         = d.name
  if (d.description                !== undefined) updates.description                  = d.description
  if (d.priceCents                 !== undefined) updates.price_cents                  = d.priceCents
  if (d.maxQuantity                !== undefined) updates.max_quantity                 = d.maxQuantity
  if (d.isActive                   !== undefined) updates.is_active                    = d.isActive
  if (d.category                   !== undefined) updates.category                     = d.category
  if (d.prepTimeHours              !== undefined) updates.prep_time_hours              = d.prepTimeHours
  if (d.cutoffHours                !== undefined) updates.cutoff_hours                 = d.cutoffHours
  if (d.isSeasonal                 !== undefined) updates.is_seasonal                  = d.isSeasonal
  if (d.seasonalFrom               !== undefined) updates.seasonal_from                = d.seasonalFrom
  if (d.seasonalUntil              !== undefined) updates.seasonal_until               = d.seasonalUntil
  if (d.requiresStaffConfirmation  !== undefined) updates.requires_staff_confirmation  = d.requiresStaffConfirmation

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('addons')
    .update(updates)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select('id, name, category, price_cents, is_active')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Update failed or not found' }, { status: 500 })

  auditLog({
    action: 'addon_updated',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'addon',
    entityId: id,
    changes: d,
  })

  return NextResponse.json({ data })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const supabase = createServiceClient()
  // Soft-delete: preserve order history
  const { error } = await supabase
    .from('addons')
    .update({ is_active: false })
    .eq('id', id)
    .eq('operator_id', operator.id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  return NextResponse.json({ data: { success: true } })
}
