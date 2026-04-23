import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { NotificationsClient } from '@/components/dashboard/NotificationsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Notifications — BoatCheckin' }

export default async function NotificationsPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('operator_notifications')
    .select('id, type, title, body, data, read_at, created_at')
    .eq('operator_id', operator.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const unreadCount = (data ?? []).filter(n => !n.read_at).length

  return (
    <NotificationsClient
      initialNotifications={data ?? []}
      unreadCount={unreadCount}
    />
  )
}
