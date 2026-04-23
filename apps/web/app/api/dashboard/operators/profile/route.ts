import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

const profileSchema = z.object({
  full_name:    z.string().min(2).max(100).optional(),
  company_name: z.string().max(100).nullable().optional(),
  phone:        z.string().max(30).nullable().optional(),
})

/**
 * PATCH /api/dashboard/operators/profile
 * Update operator display name, company and phone.
 */
export async function PATCH(req: NextRequest) {
  const { operator } = await requireOperator()

  const body = await req.json().catch(() => null)
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const changes = parsed.data
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('operators')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', operator.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  auditLog({
    action: 'operator_profile_updated',
    operatorId: operator.id,
    actorType: 'operator',
    actorIdentifier: operator.email,
    entityType: 'operator',
    entityId: operator.id,
    changes,
  })

  return NextResponse.json({ data: { ok: true } })
}
