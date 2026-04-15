import { requireAdmin } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ConfigEditorClient } from './ConfigEditorClient'

interface ConfigRow {
  key: string
  value: unknown
  description: string | null
  updated_by: string | null
  updated_at: string
}

async function getConfig() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('platform_config')
    .select('*')
    .order('key')

  if (error) {
    console.error('[getConfig]', error)
    return []
  }

  return (data ?? []) as ConfigRow[]
}

export default async function ConfigPage() {
  await requireAdmin('founder')
  const config = await getConfig()

  return <ConfigEditorClient config={config} />
}
