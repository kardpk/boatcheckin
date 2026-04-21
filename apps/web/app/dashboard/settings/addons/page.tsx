import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { AddonSettingsClient } from '@/components/dashboard/AddonSettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add-On Menu — BoatCheckin' }

export default async function AddonSettingsPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const [{ data: addons }, { data: operatorRow }] = await Promise.all([
    supabase
      .from('addons')
      .select('id, name, description, price_cents, max_quantity, is_active, category, prep_time_hours, cutoff_hours, is_seasonal, seasonal_from, seasonal_until, requires_staff_confirmation')
      .eq('operator_id', operator.id)
      .order('category')
      .order('name'),
    supabase
      .from('operators')
      .select('addon_payment_mode, stripe_connect_account_id, stripe_connect_onboarded')
      .eq('id', operator.id)
      .single(),
  ])

  return (
    <AddonSettingsClient
      operatorId={operator.id}
      addons={addons ?? []}
      paymentMode={(operatorRow?.addon_payment_mode as string | null) ?? 'external'}
      stripeConnected={!!(operatorRow?.stripe_connect_onboarded)}
    />
  )
}
