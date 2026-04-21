import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { getRedis } from '@/lib/redis/upstash'
import type { FleetTodayRow } from '@/lib/webhooks/types'

/**
 * GET /api/dashboard/today
 *
 * Returns v_fleet_today for the operator's boats.
 * Cached 30s in Upstash Redis (cache invalidated on trip status changes).
 *
 * Used by: Fleet Today Board (new /dashboard home)
 */

const CACHE_TTL = 30 // seconds

export async function GET(req: NextRequest) {
  const { operator } = await requireOperator()

  const limited = await rateLimit(req, {
    max: 120, window: 60,
    key: `today-board:${operator.id}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  const cacheKey = `cache:today:${operator.id}`
  const redis    = getRedis()

  // ── Cache check ───────────────────────────────────────────────────────────
  const cached = await redis.get(cacheKey).catch(() => null)
  if (cached) {
    return NextResponse.json({ data: cached, cached: true })
  }

  // ── Query v_fleet_today ────────────────────────────────────────────────────
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('v_fleet_today')
    .select('*')
    .eq('operator_id', operator.id)
    .order('departure_time', { ascending: true, nullsFirst: false })

  if (error) {
    console.error('[today] v_fleet_today query error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch fleet data' }, { status: 500 })
  }

  // ── Shape to FleetTodayRow interface ──────────────────────────────────────
  const rows: FleetTodayRow[] = (data ?? []).map(r => ({
    boatId:                r.boat_id as string,
    operatorId:            r.operator_id as string,
    boatName:              r.boat_name as string,
    slipNumber:            (r.slip_number as string | null) ?? null,
    tripId:                (r.trip_id as string | null) ?? null,
    tripType:              (r.trip_type as FleetTodayRow['tripType']) ?? null,
    departureTime:         (r.departure_time as string | null) ?? null,
    durationHours:         (r.duration_hours as number | null) ?? null,
    durationDays:          (r.duration_days as number | null) ?? null,
    tripStatus:            (r.trip_status as FleetTodayRow['tripStatus']) ?? null,
    tripCode:              (r.trip_code as string | null) ?? null,
    tripSlug:              (r.trip_slug as string | null) ?? null,
    requiresQualification: (r.requires_qualification as boolean | null) ?? null,
    totalGuests:           (r.total_guests as number) ?? 0,
    waiversSigned:         (r.waivers_signed as number) ?? 0,
    checkedIn:             (r.checked_in as number) ?? 0,
    flags:                 (r.flags as number) ?? 0,
    addonsPendingPrep:     (r.addons_pending_prep as number) ?? 0,
    addonRevenueCents:     (r.addon_revenue_cents as number | null) ?? null,
  }))

  // ── Cache result ──────────────────────────────────────────────────────────
  await redis.set(cacheKey, rows, { ex: CACHE_TTL }).catch(() => null)

  return NextResponse.json({ data: rows, cached: false })
}
