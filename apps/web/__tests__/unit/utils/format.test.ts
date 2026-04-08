import { describe, it, expect } from 'vitest'
import { formatTripDate, formatDuration, formatTime } from '@/lib/utils/format'

describe('formatDuration', () => {
  it('formats whole hours', () => {
    expect(formatDuration(4)).toBe('4hr')
  })

  it('formats half hour', () => {
    expect(formatDuration(0.5)).toBe('30min')
  })

  it('formats mixed hours and minutes', () => {
    expect(formatDuration(2.5)).toBe('2hr 30min')
  })

  it('formats a full day (12hr)', () => {
    expect(formatDuration(12)).toBe('12hr')
  })
})

describe('formatTime', () => {
  it('formats 14:30 as 2:30 PM', () => {
    expect(formatTime('14:30')).toBe('2:30 PM')
  })

  it('formats 09:00 as 9:00 AM', () => {
    expect(formatTime('09:00')).toBe('9:00 AM')
  })

  it('formats 12:00 as 12:00 PM', () => {
    expect(formatTime('12:00')).toBe('12:00 PM')
  })

  it('formats 00:00 as 12:00 AM', () => {
    expect(formatTime('00:00')).toBe('12:00 AM')
  })
})

describe('formatTripDate', () => {
  it('returns a readable short date', () => {
    // Static date — avoids locale flakiness by testing the shape
    const result = formatTripDate('2026-06-15')
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/)
    expect(result).toContain('Jun')
    expect(result).toContain('15')
  })
})
