import { describe, it, expect } from 'vitest'
import { guestRegistrationSchema } from '@/lib/security/sanitise'
import { hashWaiverText, verifyWaiverHash } from '@/lib/security/waiver'

const validBase = {
  tripSlug: 'xK9m2aQr7nB4xyz012345678',
  tripCode: 'SUN4',
  fullName: 'Sofia Martinez',
  emergencyContactName: 'Maria Martinez',
  emergencyContactPhone: '+1 305 555 0100',
  languagePreference: 'en' as const,
  safetyAcknowledgments: [],
  waiverSignatureText: 'Sofia Martinez',
  waiverAgreed: true as const,
  waiverTextHash: 'a'.repeat(64),
  turnstileToken: 'test-token',
}

describe('guestRegistrationSchema', () => {
  it('accepts valid base registration', () => {
    expect(guestRegistrationSchema.safeParse(validBase).success).toBe(true)
  })

  it('rejects name under 2 chars', () => {
    expect(
      guestRegistrationSchema.safeParse({ ...validBase, fullName: 'A' }).success
    ).toBe(false)
  })

  it('rejects invalid trip code format (lowercase)', () => {
    expect(
      guestRegistrationSchema.safeParse({ ...validBase, tripCode: 'ab12' }).success
    ).toBe(false)
  })

  it('requires waiverAgreed: true exactly (false fails)', () => {
    expect(
      guestRegistrationSchema.safeParse({ ...validBase, waiverAgreed: false }).success
    ).toBe(false)
  })

  it('rejects waiver hash shorter than 64 hex chars', () => {
    expect(
      guestRegistrationSchema.safeParse({
        ...validBase,
        waiverTextHash: 'tooshort',
      }).success
    ).toBe(false)
  })

  it('rejects phone number with letters', () => {
    expect(
      guestRegistrationSchema.safeParse({
        ...validBase,
        emergencyContactPhone: 'not-a-phone',
      }).success
    ).toBe(false)
  })

  it('trims whitespace from fullName via transform', () => {
    const result = guestRegistrationSchema.safeParse({
      ...validBase,
      fullName: '  Sofia Martinez  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.fullName).toBe('Sofia Martinez')
    }
  })

  it('accepts all optional fields', () => {
    expect(
      guestRegistrationSchema.safeParse({
        ...validBase,
        dateOfBirth: '1990-05-15',
        dietaryRequirements: 'Nut allergy',
        isNonSwimmer: true,
        isSeaSicknessProne: false,
        gdprConsent: true,
        marketingConsent: false,
      }).success
    ).toBe(true)
  })
})

describe('waiver hashing', () => {
  const waiverText = 'I agree to the terms of this charter. All risks accepted.'

  it('produces a 64-char hex hash', () => {
    const hash = hashWaiverText(waiverText)
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('same text always produces same hash (deterministic)', () => {
    expect(hashWaiverText(waiverText)).toBe(hashWaiverText(waiverText))
  })

  it('different text produces different hash', () => {
    expect(hashWaiverText(waiverText)).not.toBe(
      hashWaiverText(waiverText + ' extra clause')
    )
  })

  it('verifyWaiverHash returns true when hashes match', () => {
    const hash = hashWaiverText(waiverText)
    expect(verifyWaiverHash(hash, waiverText)).toBe(true)
  })

  it('verifyWaiverHash returns false for tampered hash', () => {
    expect(verifyWaiverHash('a'.repeat(64), waiverText)).toBe(false)
  })

  it('strips leading/trailing whitespace before hashing', () => {
    expect(hashWaiverText('  ' + waiverText + '  ')).toBe(
      hashWaiverText(waiverText)
    )
  })
})
