import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

/**
 * GET  /api/dashboard/addons  — list operator's addons with all resort fields
 * POST /api/dashboard/addons  — create addon
 */

const ADDON_CATEGORIES = ['food','beverage','gear','safety','experience','seasonal','other','general'] as const

const createSchema = z.object({
  name:                         z.string().min(1).max(80),
  description:                  z.string().max(300).optional(),
  priceCents:                   z.number().int().min(0),
  maxQuantity:                  z.number().int().min(1).max(20).default(4),
  category:                     z.enum(ADDON_CATEGORIES).default('general'),
  prepTimeHours:                z.number().min(0).max(72).default(0),
  cutoffHours:                  z.number().min(0).max(96).default(2),
  isSeasonal:                   z.boolean().default(false),
  seasonalFrom:                 z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  seasonalUntil:                z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  requiresStaffConfirmation:    z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 60, window: 60, key: `addons-list:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('addons')
    .select(`
      id, name, description, price_cents, max_quantity, is_active,
      category, prep_time_hours, cutoff_hours,
      is_seasonal, seasonal_from, seasonal_until,
      requires_staff_confirmation, created_at
    `)
    .eq('operator_id', operator.id)
    .order('category')
    .order('name')

  if (error) return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })

  return NextResponse.json({
    data: (data ?? []).map(r => ({
      id:                        r.id,
      name:                      r.name,
      description:               r.description,
      priceCents:                r.price_cents,
      maxQuantity:               r.max_quantity,
      isActive:                  r.is_active,
      category:                  r.category,
      prepTimeHours:             r.prep_time_hours,
      cutoffHours:               r.cutoff_hours,
      isSeasonal:                r.is_seasonal,
      seasonalFrom:              r.seasonal_from,
      seasonalUntil:             r.seasonal_until,
      requiresStaffConfirmation: r.requires_staff_confirmation,
      createdAt:                 r.created_at,
    }))
  })
}

export async function POST(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 20, window: 3600, key: `addons-create:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const d = parsed.data

  if (d.isSeasonal && (!d.seasonalFrom || !d.seasonalUntil)) {
    return NextResponse.json({ error: 'Seasonal addons require seasonalFrom and seasonalUntil dates' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('addons')
    .insert({
      operator_id:                  operator.id,
      name:                         d.name,
      description:                  d.description ?? null,
      price_cents:                  d.priceCents,
      max_quantity:                 d.maxQuantity,
      is_active:                    true,
      category:                     d.category,
      prep_time_hours:              d.prepTimeHours,
      cutoff_hours:                 d.cutoffHours,
      is_seasonal:                  d.isSeasonal,
      seasonal_from:                d.seasonalFrom ?? null,
      seasonal_until:               d.seasonalUntil ?? null,
      requires_staff_confirmation:  d.requiresStaffConfirmation,
    })
    .select('id, name, category, price_cents')
    .single()

  if (error || !data) return NextResponse.json({ error: 'Failed to create addon' }, { status: 500 })

  auditLog({
    action: 'addon_created',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.id,
    entityType: 'addon',
    entityId: data.id,
    changes: { name: d.name, category: d.category, priceCents: d.priceCents },
  })

  return NextResponse.json({ data }, { status: 201 })
}
