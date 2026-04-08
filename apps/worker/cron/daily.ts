import { createServiceClient } from '../../web/lib/supabase/service'

export async function runDailyCron(): Promise<void> {
  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]!

  // ── STEP 1: Activate today's upcoming trips ──
  const { data: activated, error: activateErr } = await supabase
    .from('trips')
    .update({ status: 'active' })
    .eq('status', 'upcoming')
    .eq('trip_date', today)
    .select('id, slug, operator_id, boats(boat_name)')

  if (activateErr) {
    console.error('[daily] activation error:', activateErr.message)
  } else {
    console.log(`[daily] activated ${activated?.length ?? 0} trips`)

    // Notify operators whose trips just activated
    for (const trip of activated ?? []) {
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'trip_activated',
        title: '⚓ Trip activated',
        body: `${(trip.boats as unknown as { boat_name: string })?.boat_name} is active today`,
        data: { tripId: trip.id },
      }).then(null, () => null)
    }
  }

  // ── STEP 2: Complete yesterday's active trips ──
  const { data: completed, error: completeErr } = await supabase
    .from('trips')
    .update({ status: 'completed', ended_at: new Date().toISOString() })
    .eq('status', 'active')
    .lt('trip_date', today)
    .select('id')

  if (completeErr) {
    console.error('[daily] completion error:', completeErr.message)
  } else {
    console.log(`[daily] completed ${completed?.length ?? 0} trips`)
  }

  // ── STEP 3: GDPR cleanup ─────────────────
  // Anonymise guests from trips older than 90 days
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 90)

  const { error: gdprErr } = await supabase
    .from('guests')
    .update({
      full_name: 'DELETED',
      emergency_contact_name: 'DELETED',
      emergency_contact_phone: 'DELETED',
      dietary_requirements: null,
      date_of_birth: null,
      email: null,
      waiver_signature_text: 'DELETED',
      waiver_ip_address: null,
      waiver_user_agent: null,
      push_subscription: null,
      deleted_at: new Date().toISOString(),
    })
    .lt('created_at', cutoff.toISOString())
    .is('deleted_at', null)

  if (gdprErr) {
    console.error('[daily] GDPR cleanup error:', gdprErr.message)
  } else {
    console.log('[daily] GDPR cleanup complete')
  }
}
