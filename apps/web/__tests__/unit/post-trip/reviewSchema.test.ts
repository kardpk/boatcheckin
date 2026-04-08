import { describe, it, expect } from 'vitest'
import { reviewSchema, postcardSchema } from '@/lib/security/sanitise'

const validReview = {
  tripSlug: 'xK9m2aQr7nB4xyz012345678',
  guestId: '550e8400-e29b-41d4-a716-446655440000',
  rating: 5,
}

describe('reviewSchema', () => {
  it('accepts 5-star review with no feedback', () => {
    expect(reviewSchema.safeParse(validReview).success).toBe(true)
  })

  it('accepts 1-star review with feedback', () => {
    expect(reviewSchema.safeParse({
      ...validReview, rating: 1, feedbackText: 'Not great',
    }).success).toBe(true)
  })

  it('rejects rating 0', () => {
    expect(reviewSchema.safeParse({
      ...validReview, rating: 0,
    }).success).toBe(false)
  })

  it('rejects rating 6', () => {
    expect(reviewSchema.safeParse({
      ...validReview, rating: 6,
    }).success).toBe(false)
  })

  it('rejects feedback over 2000 chars', () => {
    expect(reviewSchema.safeParse({
      ...validReview, rating: 2,
      feedbackText: 'x'.repeat(2001),
    }).success).toBe(false)
  })

  it('trims feedback whitespace', () => {
    const result = reviewSchema.safeParse({
      ...validReview, rating: 3,
      feedbackText: '  too hot  ',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect((result.data as any).feedbackText).toBe('too hot')
    }
  })

  it('accepts rating exactly 4 with no feedback', () => {
    expect(reviewSchema.safeParse({
      ...validReview, rating: 4,
    }).success).toBe(true)
  })
})

describe('postcardSchema', () => {
  it('accepts valid postcard creation', () => {
    expect(postcardSchema.safeParse({
      tripId: '550e8400-e29b-41d4-a716-446655440000',
      guestId: '550e8400-e29b-41d4-a716-446655440001',
      style: 'classic',
    }).success).toBe(true)
  })

  it('rejects unknown style', () => {
    expect(postcardSchema.safeParse({
      tripId: '550e8400-e29b-41d4-a716-446655440000',
      guestId: '550e8400-e29b-41d4-a716-446655440001',
      style: 'vintage',
    }).success).toBe(false)
  })

  it('accepts all three valid styles', () => {
    for (const style of ['classic', 'minimal', 'sunset']) {
      expect(postcardSchema.safeParse({
        tripId: '550e8400-e29b-41d4-a716-446655440000',
        guestId: '550e8400-e29b-41d4-a716-446655440001',
        style,
      }).success).toBe(true)
    }
  })
})
