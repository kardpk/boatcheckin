import { requireAdmin } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { SafetyDictionaryClient } from './SafetyDictionaryClient'

interface DictRow {
  id: string
  topic_key: string
  language_code: string
  title: string
  instructions: string
  audio_url: string | null
  default_image_url: string | null
  emoji: string | null
  updated_at: string
}

async function getDictionaryData() {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('global_safety_dictionary')
    .select('*')
    .order('topic_key')
    .order('language_code')

  if (error) {
    console.error('[getDictionaryData]', error)
    return []
  }

  return (data ?? []) as DictRow[]
}

export default async function SafetyDictionaryPage() {
  await requireAdmin('admin')
  const rows = await getDictionaryData()

  // Group by topic_key
  const topicMap = new Map<string, DictRow[]>()
  for (const row of rows) {
    const existing = topicMap.get(row.topic_key) ?? []
    existing.push(row)
    topicMap.set(row.topic_key, existing)
  }

  const topics = Array.from(topicMap.entries()).map(([key, langs]) => ({
    topicKey: key,
    languages: langs,
  }))

  return <SafetyDictionaryClient topics={topics} />
}
