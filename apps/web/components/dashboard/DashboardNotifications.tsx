'use client'

import { useOperatorNotifications } from '@/hooks/useOperatorNotifications'
import { NotificationToasts } from './NotificationToast'

export function DashboardNotifications({
  operatorId,
}: {
  operatorId: string
}) {
  const { toasts, dismissToast } =
    useOperatorNotifications(operatorId)

  return (
    <NotificationToasts toasts={toasts} onDismiss={dismissToast} />
  )
}
