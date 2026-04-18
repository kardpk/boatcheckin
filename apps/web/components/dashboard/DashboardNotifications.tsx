'use client'

import dynamic from 'next/dynamic'
import { useOperatorNotifications } from '@/hooks/useOperatorNotifications'

// Lazy load NotificationToasts (uses framer-motion ~160KB)
// Only loaded when there are actual toasts to show
const NotificationToasts = dynamic(
  () => import('./NotificationToast').then(m => m.NotificationToasts),
  { ssr: false }
)

export function DashboardNotifications({
  operatorId,
}: {
  operatorId: string
}) {
  const { toasts, dismissToast } =
    useOperatorNotifications(operatorId)

  // Don't render anything (or load framer-motion) until there are toasts
  if (toasts.length === 0) return null

  return (
    <NotificationToasts toasts={toasts} onDismiss={dismissToast} />
  )
}
