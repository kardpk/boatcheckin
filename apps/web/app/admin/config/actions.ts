'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireAdmin } from '@/lib/security/auth'
import { revalidatePath } from 'next/cache'

/**
 * Upsert a platform config key.
 */
export async function upsertConfig(key: string, value: string, description?: string) {
  const { operator } = await requireAdmin('founder')
  const supabase = createServiceClient()

  // Parse as JSON if it looks like JSON, otherwise wrap as string
  let jsonValue: unknown
  try {
    jsonValue = JSON.parse(value)
  } catch {
    jsonValue = value
  }

  const { error } = await supabase
    .from('platform_config')
    .upsert(
      {
        key,
        value: jsonValue,
        description: description || undefined,
        updated_by: operator.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

  if (error) return { error: error.message }

  revalidatePath('/admin/config')
  return { success: true }
}

/**
 * Delete a config key (founder-only).
 */
export async function deleteConfig(key: string) {
  await requireAdmin('founder')
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('platform_config')
    .delete()
    .eq('key', key)

  if (error) return { error: error.message }

  revalidatePath('/admin/config')
  return { success: true }
}
