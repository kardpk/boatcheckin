import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { IntegrationSettingsClient } from '@/components/dashboard/IntegrationSettingsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Integrations — BoatCheckin' }

export default async function IntegrationsPage() {
  const { operator } = await requireOperator()
  const supabase     = createServiceClient()

  const [{ data: integrationsRaw }, { data: boatsRaw }] = await Promise.all([
    supabase
      .from('integrations')
      .select('id, platform, boat_name_map, auto_create_trips, auto_send_link, link_delay_hours, is_active, last_event_at, created_at, webhook_endpoint_token')
      .eq('operator_id', operator.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('boats')
      .select('id, boat_name')
      .eq('operator_id', operator.id)
      .eq('is_active', true)
      .order('boat_name'),
  ])

  const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://boatcheckin.com'
  const boats      = (boatsRaw ?? []) as { id: string; boat_name: string }[]
  const integrations = (integrationsRaw ?? []).map(r => ({
    id:              r.id as string,
    platform:        r.platform as string,
    boatNameMap:     (r.boat_name_map as Record<string, string>) ?? {},
    autoCreateTrips: r.auto_create_trips as boolean,
    autoSendLink:    r.auto_send_link as boolean,
    linkDelayHours:  r.link_delay_hours as number,
    isActive:        r.is_active as boolean,
    lastEventAt:     (r.last_event_at as string | null) ?? null,
    createdAt:       r.created_at as string,
    webhookUrl:      `${appUrl}/api/webhooks/${r.platform}/${r.webhook_endpoint_token}`,
  }))

  return (
    <IntegrationSettingsClient
      integrations={integrations}
      boats={boats}
    />
  )
}
