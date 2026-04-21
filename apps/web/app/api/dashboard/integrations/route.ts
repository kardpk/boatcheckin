import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'

/**
 * GET  /api/dashboard/integrations
 * POST /api/dashboard/integrations
 *
 * List and create booking platform integrations.
 * Auth: requireOperator()
 *
 * POST returns webhook_secret only on creation — never again.
 * The webhook URL format: /api/webhooks/[platform]/[endpoint_token]
 */

const createSchema = z.object({
  platform: z.enum(['fareharbor', 'rezdy', 'bookeo', 'checkfront', 'manual']),
  autoCreateTrips: z.boolean().default(true),
  autoSendLink:    z.boolean().default(true),
  linkDelayHours:  z.number().int().min(0).max(72).default(0),
})

export async function GET(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `integrations-list:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('integrations')
    .select(`
      id, platform, boat_name_map, auto_create_trips, auto_send_link,
      link_delay_hours, is_active, last_event_at, created_at, updated_at,
      webhook_endpoint_token
    `)
    .eq('operator_id', operator.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  // Enrich with webhook URLs (never return the secret in list)
  const integrations = (data ?? []).map(row => ({
    id:              row.id,
    platform:        row.platform,
    boatNameMap:     row.boat_name_map as Record<string, string>,
    autoCreateTrips: row.auto_create_trips,
    autoSendLink:    row.auto_send_link,
    linkDelayHours:  row.link_delay_hours,
    isActive:        row.is_active,
    lastEventAt:     row.last_event_at,
    createdAt:       row.created_at,
    webhookUrl:      `${appUrl}/api/webhooks/${row.platform}/${row.webhook_endpoint_token}`,
  }))

  return NextResponse.json({ data: integrations })
}

export async function POST(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 10, window: 3600,
    key: `integrations-create:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const data = parsed.data
  const supabase = createServiceClient()

  // Check for existing active integration for this platform
  const { data: existing } = await supabase
    .from('integrations')
    .select('id')
    .eq('operator_id', operator.id)
    .eq('platform', data.platform)
    .eq('is_active', true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `You already have an active ${data.platform} integration. Update or disable it first.` },
      { status: 409 }
    )
  }

  // Generate the two secrets
  const webhookSecret        = randomBytes(32).toString('hex')
  const webhookEndpointToken = randomBytes(16).toString('hex')

  const { data: integration, error: insertError } = await supabase
    .from('integrations')
    .insert({
      operator_id:            operator.id,
      platform:               data.platform,
      webhook_secret:         webhookSecret,
      webhook_endpoint_token: webhookEndpointToken,
      boat_name_map:          {},
      auto_create_trips:      data.autoCreateTrips,
      auto_send_link:         data.autoSendLink,
      link_delay_hours:       data.linkDelayHours,
      is_active:              true,
    })
    .select('id, platform, webhook_endpoint_token, created_at')
    .single()

  if (insertError || !integration) {
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 })
  }

  auditLog({
    action:          'integration_created',
    operatorId:      operator.id,
    actorType:       'operator',
    actorIdentifier: operator.id,
    entityType:      'integration',
    entityId:        integration.id,
    changes:         { platform: data.platform },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL

  return NextResponse.json({
    data: {
      id:          integration.id,
      platform:    integration.platform,
      webhookUrl:  `${appUrl}/api/webhooks/${integration.platform}/${integration.webhook_endpoint_token}`,
      // Secret shown ONCE — store it now
      webhookSecret,
      createdAt:   integration.created_at,
    },
  }, { status: 201 })
}
