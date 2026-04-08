import { headers } from 'next/headers'
import { SUPPORTED_LANGUAGES, type SupportedLang } from './constants'

export * from './constants'

export async function detectLanguage(langOverride?: string): Promise<SupportedLang> {
  // URL ?lang= override takes highest priority
  if (langOverride && SUPPORTED_LANGUAGES.includes(langOverride as SupportedLang)) {
    return langOverride as SupportedLang
  }

  // Accept-Language header fallback
  const headerStore = await headers()
  const acceptLang = headerStore.get('accept-language') ?? 'en'
  // Parse: "es-ES,es;q=0.9,en;q=0.8" → 'es'
  const primary = acceptLang.split(',')[0]?.split('-')[0]?.toLowerCase() ?? 'en'
  return SUPPORTED_LANGUAGES.includes(primary as SupportedLang)
    ? (primary as SupportedLang)
    : 'en'
}
