'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/security/auth'
import { revalidatePath } from 'next/cache'

/**
 * Toggle operator active status.
 */
export async function toggleOperatorActive(operatorId: string, isActive: boolean) {
  await requireAdmin('admin')
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('operators')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', operatorId)

  if (error) return { error: error.message }

  revalidatePath('/admin/operators')
  return { success: true }
}

/**
 * Set admin role for an operator (founder-only).
 */
export async function setAdminRole(operatorId: string, role: string | null) {
  await requireAdmin('founder')
  const supabase = createServiceClient()

  const validRoles = ['founder', 'admin', 'member', 'support', null]
  if (!validRoles.includes(role)) return { error: 'Invalid role' }

  const { error } = await supabase
    .from('operators')
    .update({ admin_role: role, updated_at: new Date().toISOString() })
    .eq('id', operatorId)

  if (error) return { error: error.message }

  revalidatePath('/admin/operators')
  return { success: true }
}
