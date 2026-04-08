import { describe, it, expect } from 'vitest'
import { t, SUPPORTED_LANGUAGES } from '@/lib/i18n/tripTranslations'

describe('tripTranslations', () => {
  it('has all 6 languages', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(6)
    expect(SUPPORTED_LANGUAGES).toContain('en')
    expect(SUPPORTED_LANGUAGES).toContain('es')
    expect(SUPPORTED_LANGUAGES).toContain('fr')
    expect(SUPPORTED_LANGUAGES).toContain('pt')
    expect(SUPPORTED_LANGUAGES).toContain('de')
    expect(SUPPORTED_LANGUAGES).toContain('it')
  })

  it('falls back to English for unknown language', () => {
    // @ts-expect-error — testing invalid input
    const tr = t('zh')
    expect(tr.joinCta).toBe('Check in for this trip →')
  })

  const REQUIRED_KEYS = [
    'joinCta', 'findDock', 'weather', 'captain', 'safety',
    'rules', 'addons', 'whatToBring', 'cancellation', 'activeBanner',
  ] as const

  SUPPORTED_LANGUAGES.forEach((lang) => {
    it(`${lang} has all required keys`, () => {
      const tr = t(lang)
      for (const key of REQUIRED_KEYS) {
        expect(tr[key], `${lang}.${key} should be truthy`).toBeTruthy()
      }
    })
  })

  it('guestCount returns correct string with replacements for en', () => {
    const tr = t('en')
    expect(tr.guestCount.replace('{n}','7').replace('{max}','8')).toBe('7 of 8 checked in')
  })

  it('guestCount works for es', () => {
    const tr = t('es')
    expect(tr.guestCount.replace('{n}','3').replace('{max}','10')).toBe('3 de 10 registrados')
  })

  it('guestCount works for fr', () => {
    const tr = t('fr')
    expect(tr.guestCount.replace('{n}','5').replace('{max}','12')).toBe('5 sur 12 enregistrés')
  })

  it('guestCount works for de', () => {
    const tr = t('de')
    expect(tr.guestCount.replace('{n}','2').replace('{max}','8')).toBe('2 von 8 eingecheckt')
  })

  it('charter type labels exist for all types in all languages', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const tr = t(lang)
      expect(tr.charterType.captained).toBeTruthy()
      expect(tr.charterType.bareboat).toBeTruthy()
      expect(tr.charterType.both).toBeTruthy()
    }
  })
})
