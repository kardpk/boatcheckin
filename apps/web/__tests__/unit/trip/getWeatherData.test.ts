import { describe, it, expect, vi } from 'vitest'
import { getWeatherData } from '@/lib/trip/getWeatherData'

// Mock Redis — always cache miss so we test the fetch path
vi.mock('@/lib/redis/upstash', () => ({
  getRedis: () => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(null),
  }),
}))

const mockDaily = {
  weathercode: [1],
  temperature_2m_max: [82],
  temperature_2m_min: [72],
  windspeed_10m_max: [8],
  precipitation_sum: [0],
  sunrise: ['2024-10-21T07:12'],
  sunset: ['2024-10-21T19:34'],
}

describe('getWeatherData', () => {
  it('returns shaped weather data for valid coords', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ daily: mockDaily }),
    })

    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result).not.toBeNull()
    expect(result?.temperature).toBe(82)
    expect(result?.severity).toBe('good')
    expect(result?.code).toBe(1)
    expect(result?.icon).toBe('🌤️')
  })

  it('returns dangerous severity for storm codes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ daily: { ...mockDaily, weathercode: [95] } }),
    })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result?.severity).toBe('dangerous')
    expect(result?.icon).toBe('⛈️')
  })

  it('returns null on fetch failure (ok: false)', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result).toBeNull()
  })

  it('returns null on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result).toBeNull()
  })

  it('returns poor severity for high winds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ daily: { ...mockDaily, windspeed_10m_max: [28] } }),
    })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result?.severity).toBe('poor')
  })

  it('returns fair severity for moderate wind', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ daily: { ...mockDaily, windspeed_10m_max: [18] } }),
    })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result?.severity).toBe('fair')
  })

  it('includes correct color for good severity', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ daily: mockDaily }),
    })
    const result = await getWeatherData(25.7786, -80.1392, '2024-10-21')
    expect(result?.color).toBe('#1D9E75')
    expect(result?.bgColor).toBe('#E8F9F4')
  })
})
