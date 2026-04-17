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

/**
 * Set max_boats for an operator (founder-only).
 * Use 999 for unlimited.
 */
export async function setMaxBoats(operatorId: string, maxBoats: number, tier: string) {
  await requireAdmin('founder')
  const supabase = createServiceClient()

  const validTiers = ['solo', 'captain', 'fleet', 'marina']
  if (!validTiers.includes(tier)) return { error: 'Invalid tier' }
  if (maxBoats < 1 || maxBoats > 999) return { error: 'max_boats must be 1–999' }

  const { error } = await supabase
    .from('operators')
    .update({
      max_boats: maxBoats,
      subscription_tier: tier,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', operatorId)

  if (error) return { error: error.message }

  revalidatePath('/admin/operators')
  return { success: true }
}

