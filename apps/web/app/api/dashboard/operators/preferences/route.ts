import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { z } from 'zod'

const prefsSchema = z.object({
  default_requires_approval:   z.boolean().optional(),
  review_request_delay_hours:  z.number().int().min(0).max(48).optional(),
  review_redirect_threshold:   z.number().int().min(1).max(5).optional(),
  notify_on_guest_register:    z.boolean().optional(),
  notify_on_trip_start:        z.boolean().optional(),
  notify_on_trip_end:          z.boolean().optional(),
  notify_on_weather_alert:     z.boolean().optional(),
})

/**
 * PATCH /api/dashboard/operators/preferences
 * Update operator platform preference fields.
 */
export async function PATCH(req: NextRequest) {
  const { operator } = await requireOperator()

  const body = await req.json().catch(() => null)
  const parsed = prefsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid preferences' }, { status: 400 })
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('operators')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', operator.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { ok: true } })
}
