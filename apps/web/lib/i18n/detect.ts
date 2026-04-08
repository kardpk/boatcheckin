import { headers } from 'next/headers'

export const SUPPORTED_LANGUAGES = ['en', 'es', 'pt', 'fr', 'de', 'it'] as const
export type SupportedLang = typeof SUPPORTED_LANGUAGES[number]

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

export const LANGUAGE_FLAGS: Record<SupportedLang, string> = {
  en: '🇬🇧', es: '🇪🇸', pt: '🇵🇹',
  fr: '🇫🇷', de: '🇩🇪', it: '🇮🇹',
}

export const LANGUAGE_NAMES: Record<SupportedLang, string> = {
  en: 'English', es: 'Español', pt: 'Português',
  fr: 'Français', de: 'Deutsch', it: 'Italiano',
}
