import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * Vercel Cron — Daily trip status transitions
 *
 * Schedule: 0 6 * * * (6:00 AM UTC daily, configured in vercel.json)
 *
 * 1. Activate today's upcoming trips → 'active'
 * 2. Complete yesterday's active trips → 'completed'
 *
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: Request) {
  // Verify Vercel Cron auth
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]!
  const results: string[] = []

  // ── STEP 1: Activate today's upcoming trips ────────────
  const { data: activated, error: activateErr } = await supabase
    .from('trips')
    .update({ status: 'active' })
    .eq('status', 'upcoming')
    .eq('trip_date', today)
    .select('id')

  if (activateErr) {
    console.error('[cron/daily] activation error:', activateErr.message)
    results.push(`activation error: ${activateErr.message}`)
  } else {
    results.push(`activated ${activated?.length ?? 0} trips`)
  }

  // ── STEP 2: Complete past active trips ─────────────────
  const { data: completed, error: completeErr } = await supabase
    .from('trips')
    .update({ status: 'completed' })
    .eq('status', 'active')
    .lt('trip_date', today)
    .select('id')

  if (completeErr) {
    console.error('[cron/daily] completion error:', completeErr.message)
    results.push(`completion error: ${completeErr.message}`)
  } else {
    results.push(`completed ${completed?.length ?? 0} trips`)
  }

  // ── STEP 3: Complete past upcoming trips (catch-all) ───
  // If a trip was never started and its date has passed, mark completed
  const { data: staleCompleted, error: staleErr } = await supabase
    .from('trips')
    .update({ status: 'completed' })
    .eq('status', 'upcoming')
    .lt('trip_date', today)
    .select('id')

  if (staleErr) {
    console.error('[cron/daily] stale completion error:', staleErr.message)
    results.push(`stale completion error: ${staleErr.message}`)
  } else {
    results.push(`stale-completed ${staleCompleted?.length ?? 0} trips`)
  }

  console.log(`[cron/daily] done: ${results.join(', ')}`)
  return NextResponse.json({ ok: true, results })
}
