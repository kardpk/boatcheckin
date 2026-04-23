import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const schema = z.object({
  id: z.string().uuid().optional(), // omit to mark ALL as read
})

/**
 * PATCH /api/dashboard/notifications/mark-read
 * Mark one (by id) or all notifications as read for the operator.
 */
export async function PATCH(req: NextRequest) {
  const { operator } = await requireOperator()

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('operator_notifications')
    .update({ read_at: now })
    .eq('operator_id', operator.id)
    .is('read_at', null)

  if (parsed.data.id) {
    query = query.eq('id', parsed.data.id)
  }

  const { error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { ok: true } })
}
