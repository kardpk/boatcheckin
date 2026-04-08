import { describe, it, expect } from 'vitest'
import {
  evaluateWeatherAlert,
  shouldSendNewAlert,
} from '@/lib/weather/alertRules'
import type { WeatherData } from '@/lib/trip/getWeatherData'

function makeWeather(
  override: Partial<WeatherData> = {}
): WeatherData {
  return {
    code: 1,
    temperature: 78,
    windspeed: 8,
    precipitation: 0,
    label: 'Mainly clear',
    severity: 'good',
    icon: '🌤️',
    color: '#1D9E75',
    bgColor: '#E8F9F4',
    ...override,
  }
}

describe('evaluateWeatherAlert', () => {
  it('returns shouldAlert:false for good conditions', () => {
    const w = makeWeather({ code: 1, windspeed: 8 })
    expect(evaluateWeatherAlert(w).shouldAlert).toBe(false)
  })

  it('returns fair severity for light drizzle', () => {
    const w = makeWeather({ code: 51, windspeed: 10 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('fair')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns fair severity for elevated wind', () => {
    const w = makeWeather({ code: 1, windspeed: 20 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('fair')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns poor severity for heavy showers', () => {
    const w = makeWeather({ code: 82, windspeed: 15 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('poor')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns poor severity for high wind 28mph', () => {
    const w = makeWeather({ code: 2, windspeed: 28 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('poor')
  })

  it('returns dangerous for thunderstorm', () => {
    const w = makeWeather({ code: 95, windspeed: 15 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('dangerous')
    expect(alert.shouldAlert).toBe(true)
  })

  it('returns dangerous for extreme wind 40mph', () => {
    const w = makeWeather({ code: 2, windspeed: 40 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.severity).toBe('dangerous')
  })

  it('alert has all required fields', () => {
    const w = makeWeather({ code: 95, windspeed: 45 })
    const alert = evaluateWeatherAlert(w)
    expect(alert.headline).toBeTruthy()
    expect(alert.detail).toBeTruthy()
    expect(alert.emoji).toBeTruthy()
    expect(alert.colour).toMatch(/^#/)
    expect(alert.bgColour).toMatch(/^#/)
    expect(alert.operatorAction).toBeTruthy()
  })
})

describe('shouldSendNewAlert', () => {
  const fairAlert = evaluateWeatherAlert(
    makeWeather({ code: 51, windspeed: 20 })
  )
  const poorAlert = evaluateWeatherAlert(
    makeWeather({ code: 82, windspeed: 25 })
  )
  const dangerousAlert = evaluateWeatherAlert(
    makeWeather({ code: 95, windspeed: 45 })
  )

  it('sends when never alerted before', () => {
    expect(shouldSendNewAlert(fairAlert, null, null)).toBe(true)
  })

  it('does not re-send at same severity', () => {
    const recentTime = new Date(Date.now() - 60000).toISOString()
    expect(
      shouldSendNewAlert(fairAlert, 'fair', recentTime)
    ).toBe(false)
  })

  it('sends when severity escalates fair → poor', () => {
    const recentTime = new Date(Date.now() - 60000).toISOString()
    expect(
      shouldSendNewAlert(poorAlert, 'fair', recentTime)
    ).toBe(true)
  })

  it('sends when severity escalates poor → dangerous', () => {
    const recentTime = new Date(Date.now() - 60000).toISOString()
    expect(
      shouldSendNewAlert(dangerousAlert, 'poor', recentTime)
    ).toBe(true)
  })

  it('re-sends dangerous after 6 hours', () => {
    const oldTime = new Date(Date.now() - 7 * 3600000).toISOString()
    expect(
      shouldSendNewAlert(dangerousAlert, 'dangerous', oldTime)
    ).toBe(true)
  })

  it('does not re-send dangerous within 6 hours', () => {
    const recentTime = new Date(Date.now() - 3 * 3600000).toISOString()
    expect(
      shouldSendNewAlert(dangerousAlert, 'dangerous', recentTime)
    ).toBe(false)
  })

  it('does not alert for good weather', () => {
    const goodAlert = evaluateWeatherAlert(makeWeather({ code: 1 }))
    expect(shouldSendNewAlert(goodAlert, null, null)).toBe(false)
  })
})
