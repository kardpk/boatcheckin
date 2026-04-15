import { requireAdmin } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { OperatorTableClient } from './OperatorTableClient'

interface OperatorRow {
  id: string
  full_name: string
  email: string
  subscription_tier: string
  subscription_status: string
  is_active: boolean
  admin_role: string | null
  created_at: string
}

async function getOperators() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('operators')
    .select('id, full_name, email, subscription_tier, subscription_status, is_active, admin_role, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[getOperators]', error)
    return []
  }

  return (data ?? []) as OperatorRow[]
}

export default async function OperatorsPage() {
  const { adminRole } = await requireAdmin('admin')
  const operators = await getOperators()

  return <OperatorTableClient operators={operators} currentRole={adminRole} />
}
