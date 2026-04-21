import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { verifyWebhookHmac } from '@/lib/webhooks/verify'
import { normalizeFareHarbor, FAREHARBOR_SIGNATURE_HEADER } from '@/lib/webhooks/adapters/fareharbor'
import { processBookingEvent } from '@/lib/webhooks/autoCreate'
import type { IntegrationRow } from '@/lib/webhooks/types'

/**
 * POST /api/webhooks/fareharbor/[token]
 *
 * FareHarbor webhook receiver.
 * The [token] is integration.webhook_endpoint_token — unique per integration.
 *
 * Security:
 *   - HMAC-SHA256 signature verification (X-FareHarbor-Signature)
 *   - Rate limit: 100 requests/min per integration
 *   - Always returns 200 OK (FareHarbor retries on non-200, causing spam)
 *   - Raw body read before JSON parse (HMAC requires exact bytes)
 *
 * Flow:
 *   1. Look up integration by token
 *   2. Rate limit by integration.id
 *   3. Verify HMAC signature
 *   4. Parse + normalize payload
 *   5. Insert webhook_events record
 *   6. Call processBookingEvent()
 *   7. Return 200 always
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  // Always return 200 — even on errors — so FareHarbor doesn't retry
  const ok = () => NextResponse.json({ received: true }, { status: 200 })

  // ── 1. Read raw body (required for HMAC) ──────────────────────────────────
  const rawBody = await req.text().catch(() => '')
  if (!rawBody) return ok()

  const supabase = createServiceClient()

  // ── 2. Look up integration by endpoint token ──────────────────────────────
  const { data: integrationRaw } = await supabase
    .from('integrations')
    .select('id, operator_id, platform, webhook_secret, webhook_endpoint_token, boat_name_map, auto_create_trips, auto_send_link, link_delay_hours, is_active, last_event_at, created_at')
    .eq('webhook_endpoint_token', token)
    .eq('platform', 'fareharbor')
    .single()

  if (!integrationRaw || !integrationRaw.is_active) return ok()

  const integration: IntegrationRow = {
    id:                   integrationRaw.id,
    operatorId:           integrationRaw.operator_id,
    platform:             integrationRaw.platform as IntegrationRow['platform'],
    webhookSecret:        integrationRaw.webhook_secret,
    webhookEndpointToken: integrationRaw.webhook_endpoint_token,
    boatNameMap:          (integrationRaw.boat_name_map as Record<string, string>) ?? {},
    autoCreateTrips:      integrationRaw.auto_create_trips,
    autoSendLink:         integrationRaw.auto_send_link,
    linkDelayHours:       integrationRaw.link_delay_hours,
    isActive:             integrationRaw.is_active,
    lastEventAt:          integrationRaw.last_event_at,
    createdAt:            integrationRaw.created_at,
  }

  // ── 3. Rate limit by integration ─────────────────────────────────────────
  const limited = await rateLimit(req, {
    max: 100, window: 60,
    key: `webhook:fareharbor:${integration.id}`,
  })
  if (limited.blocked) return ok()

  // ── 4. Parse JSON body ────────────────────────────────────────────────────
  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    await insertEvent({
      supabase, integration, payload: {}, eventType: 'parse_error',
      externalRef: null, errorMessage: 'Invalid JSON body',
    })
    return ok()
  }

  // ── 5. Verify HMAC signature ──────────────────────────────────────────────
  const signature = req.headers.get(FAREHARBOR_SIGNATURE_HEADER) ?? ''
  const validSig  = verifyWebhookHmac(integration.webhookSecret, rawBody, signature)

  if (!validSig) {
    await insertEvent({
      supabase, integration, payload: payload as object,
      eventType: 'booking', externalRef: null,
      errorMessage: 'invalid_signature',
    })
    return ok()
  }

  // ── 6. Normalize payload ──────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalized = normalizeFareHarbor(payload as any)

  if (!normalized) {
    // Not a booking event we handle (e.g. availability ping) — silently ignore
    return ok()
  }

  // ── 7. Insert webhook_events record ──────────────────────────────────────
  const { data: eventRow } = await insertEvent({
    supabase, integration,
    payload:     payload as object,
    eventType:   normalized.eventType,
    externalRef: normalized.externalRef,
    errorMessage: null,
  })

  if (!eventRow) return ok()

  // ── 8. Process event (auto-create or cancel trip) ────────────────────────
  if (integration.autoCreateTrips) {
    await processBookingEvent(normalized, integration, eventRow.id)
  } else {
    // Auto-create disabled — just log it so operator can manually create
    await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('id', eventRow.id)
  }

  return ok()
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function insertEvent(args: {
  supabase: ReturnType<typeof createServiceClient>
  integration: IntegrationRow
  payload: object
  eventType: string
  externalRef: string | null
  errorMessage: string | null
}) {
  return args.supabase
    .from('webhook_events')
    .insert({
      integration_id: args.integration.id,
      operator_id:    args.integration.operatorId,
      platform:       'fareharbor',
      event_type:     args.eventType,
      external_ref:   args.externalRef,
      payload:        args.payload,
      processed:      false,
      error_message:  args.errorMessage,
    })
    .select('id')
    .single()
}
