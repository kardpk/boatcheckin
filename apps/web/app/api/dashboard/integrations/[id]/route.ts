import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import { processBookingEvent } from '@/lib/webhooks/autoCreate'
import type { IntegrationRow } from '@/lib/webhooks/types'

/**
 * GET    /api/dashboard/integrations/[id]   — fetch integration + last 20 events
 * PATCH  /api/dashboard/integrations/[id]   — update boat_name_map + settings
 * DELETE /api/dashboard/integrations/[id]   — soft-delete (is_active = false)
 */

const patchSchema = z.object({
  boatNameMap:     z.record(z.string(), z.string()).optional(),
  autoCreateTrips: z.boolean().optional(),
  autoSendLink:    z.boolean().optional(),
  linkDelayHours:  z.number().int().min(0).max(72).optional(),
  isActive:        z.boolean().optional(),
})

async function getIntegration(operatorId: string, integrationId: string) {
  const supabase = createServiceClient()
  return supabase
    .from('integrations')
    .select('*')
    .eq('id', integrationId)
    .eq('operator_id', operatorId)
    .single()
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 60, window: 60, key: `integration-get:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { data: integration, error } = await getIntegration(operator.id, id)
  if (error || !integration) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const supabase = createServiceClient()

  // Fetch last 20 webhook events for this integration
  const { data: events } = await supabase
    .from('webhook_events')
    .select('id, event_type, external_ref, trip_id, processed, error_message, retry_count, created_at')
    .eq('integration_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  return NextResponse.json({
    data: {
      id:              integration.id,
      platform:        integration.platform,
      boatNameMap:     integration.boat_name_map as Record<string, string>,
      autoCreateTrips: integration.auto_create_trips,
      autoSendLink:    integration.auto_send_link,
      linkDelayHours:  integration.link_delay_hours,
      isActive:        integration.is_active,
      lastEventAt:     integration.last_event_at,
      createdAt:       integration.created_at,
      webhookUrl:      `${appUrl}/api/webhooks/${integration.platform}/${integration.webhook_endpoint_token}`,
      // Never return webhook_secret in GET — shown only once at creation
      events:          events ?? [],
    }
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, { max: 30, window: 60, key: `integration-patch:${operator.id}` })
  if (limited.blocked) return NextResponse.json({ error: 'Rate limited' }, { status: 429 })

  const { data: existing, error: fetchError } = await getIntegration(operator.id, id)
  if (fetchError || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (parsed.data.boatNameMap     !== undefined) updates.boat_name_map     = parsed.data.boatNameMap
  if (parsed.data.autoCreateTrips !== undefined) updates.auto_create_trips = parsed.data.autoCreateTrips
  if (parsed.data.autoSendLink    !== undefined) updates.auto_send_link    = parsed.data.autoSendLink
  if (parsed.data.linkDelayHours  !== undefined) updates.link_delay_hours  = parsed.data.linkDelayHours
  if (parsed.data.isActive        !== undefined) updates.is_active         = parsed.data.isActive

  const supabase = createServiceClient()
  const { data: updated, error } = await supabase
    .from('integrations')
    .update(updates)
    .eq('id', id)
    .eq('operator_id', operator.id)
    .select('id, platform, boat_name_map, auto_create_trips, auto_send_link, link_delay_hours, is_active, updated_at')
    .single()

  if (error || !updated) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  auditLog({
    action:          'integration_updated',
    operatorId:      operator.id,
    actorType:       'operator',
    actorIdentifier: operator.id,
    entityType:      'integration',
    entityId:        id,
    changes:         parsed.data,
  })

  return NextResponse.json({ data: updated })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { operator } = await requireOperator()

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('integrations')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('operator_id', operator.id)

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 })

  return NextResponse.json({ data: { success: true } })
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// POST /api/dashboard/integrations/[id]/retry — retry a failed event
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Note: This is a sub-route but lives here for co-location.
// The actual retry route is: app/api/dashboard/integrations/[id]/retry/route.ts
