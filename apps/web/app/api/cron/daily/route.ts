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

  // ── STEP 4: License expiry SMS alerts (F-1) ─────────────
  const { data: captains, error: captainsErr } = await supabase
    .from('captains')
    .select('id, full_name, phone, license_expiry, operator_id')
    .eq('is_active', true)
    .not('license_expiry', 'is', null)

  const alertMilestones = [60, 30, 14, 7, 1]
  const smsQueue: string[] = []

  if (!captainsErr && captains) {
    for (const captain of captains) {
      if (!captain.license_expiry) continue
      const daysLeft = Math.ceil((new Date(captain.license_expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      
      if (alertMilestones.includes(daysLeft)) {
        smsQueue.push(`[SMS QUEUED] To Operator ${captain.operator_id}: Captain ${captain.full_name}'s license expires in ${daysLeft} days. (Phone: ${captain.phone || 'N/A'})`)
      }
    }
  }

  if (smsQueue.length > 0) {
    console.log('[cron/daily] License expiries:', smsQueue.join(' | '))
    results.push(`queued ${smsQueue.length} license SMS alerts`)
  }

  console.log(`[cron/daily] done: ${results.join(', ')}`)
  return NextResponse.json({ ok: true, results, smsQueue })
}
