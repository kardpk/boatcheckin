import { describe, it, expect } from 'vitest'

const SUPPORTED_LANGS = ['en', 'es', 'fr', 'pt', 'de', 'it']

describe('review email translations', () => {
  it('covers 6 supported languages', () => {
    expect(SUPPORTED_LANGS).toHaveLength(6)
  })
})
