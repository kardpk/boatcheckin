import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { PreferencesClient } from '@/components/dashboard/PreferencesClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Platform Preferences — BoatCheckin' }

export default async function PreferencesPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data: prefs } = await supabase
    .from('operators')
    .select(`
      default_requires_approval,
      review_request_delay_hours,
      review_redirect_threshold,
      notify_on_guest_register,
      notify_on_trip_start,
      notify_on_trip_end,
      notify_on_weather_alert
    `)
    .eq('id', operator.id)
    .single()

  return (
    <PreferencesClient
      initialPrefs={{
        default_requires_approval:  (prefs?.default_requires_approval as boolean | null)  ?? false,
        review_request_delay_hours: (prefs?.review_request_delay_hours as number | null)  ?? 2,
        review_redirect_threshold:  (prefs?.review_redirect_threshold as number | null)   ?? 5,
        notify_on_guest_register:   (prefs?.notify_on_guest_register as boolean | null)   ?? true,
        notify_on_trip_start:       (prefs?.notify_on_trip_start as boolean | null)       ?? true,
        notify_on_trip_end:         (prefs?.notify_on_trip_end as boolean | null)         ?? true,
        notify_on_weather_alert:    (prefs?.notify_on_weather_alert as boolean | null)    ?? true,
      }}
    />
  )
}
