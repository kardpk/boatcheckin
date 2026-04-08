import type { WeatherData } from '@/lib/trip/getWeatherData'

// ─── Types ───────────────────────────────────────────────────────────────────

export type AlertSeverity = 'fair' | 'poor' | 'dangerous'

export interface WeatherAlert {
  severity: AlertSeverity
  shouldAlert: boolean
  headline: string
  detail: string
  emoji: string
  colour: string
  bgColour: string
  operatorAction: string
}

// ─── Alert thresholds (WMO codes + wind mph) ─────────────────────────────────

export function evaluateWeatherAlert(
  weather: WeatherData
): WeatherAlert {
  const { code, windspeed, precipitation } = weather

  // Dangerous: thunderstorm, severe wind, heavy storms
  if (code >= 95 || windspeed >= 40) {
    return {
      severity: 'dangerous',
      shouldAlert: true,
      headline: 'Dangerous conditions forecast',
      detail: `${weather.label}. Wind: ${windspeed} mph. We strongly recommend contacting your guests about postponement.`,
      emoji: '🌩️',
      colour: '#D63B3B',
      bgColour: '#FDEAEA',
      operatorAction: 'Consider cancelling or postponing this charter.',
    }
  }

  // Poor: heavy rain, high wind, snow
  if (code >= 80 || windspeed >= 28 || precipitation > 10) {
    return {
      severity: 'poor',
      shouldAlert: true,
      headline: 'Poor conditions forecast',
      detail: `${weather.label}. Wind: ${windspeed} mph. Rain: ${precipitation}mm. Your guests should be aware.`,
      emoji: '⛈️',
      colour: '#E8593C',
      bgColour: '#FDEAEA',
      operatorAction: 'Notify guests. Consider rescheduling if conditions worsen.',
    }
  }

  // Fair: light rain or elevated wind — advisory only
  if (code >= 51 || windspeed >= 18) {
    return {
      severity: 'fair',
      shouldAlert: true,
      headline: 'Marginal conditions forecast',
      detail: `${weather.label}. Wind: ${windspeed} mph. Trip can proceed — guests should be prepared.`,
      emoji: '🌧️',
      colour: '#E5910A',
      bgColour: '#FEF3DC',
      operatorAction: 'No action required. Consider updating guests.',
    }
  }

  // Good — no alert
  return {
    severity: 'fair', // ignored since shouldAlert = false
    shouldAlert: false,
    headline: 'Good conditions',
    detail: `${weather.label}. Wind: ${windspeed} mph. Clear for departure.`,
    emoji: weather.icon,
    colour: '#1D9E75',
    bgColour: '#E8F9F4',
    operatorAction: '',
  }
}

// ─── Deduplication: determine if a NEW alert should fire ─────────────────────

export function shouldSendNewAlert(
  alert: WeatherAlert,
  previousSeverity: string | null,
  lastAlertSentAt: string | null
): boolean {
  if (!alert.shouldAlert) return false

  // Never alerted before → always send
  if (!lastAlertSentAt) return true

  // Only re-alert if severity has escalated
  const severityRank: Record<string, number> = {
    fair: 1, poor: 2, dangerous: 3,
  }
  const prev = severityRank[previousSeverity ?? ''] ?? 0
  const current = severityRank[alert.severity] ?? 0

  // Re-alert if escalated OR if last alert was >6 hours ago
  // for dangerous conditions
  const hoursSinceLast = lastAlertSentAt
    ? (Date.now() - new Date(lastAlertSentAt).getTime()) / 3600000
    : 999

  if (current > prev) return true
  if (alert.severity === 'dangerous' && hoursSinceLast >= 6) return true

  return false
}
