'use client'

import { useState } from 'react'
import { Send, X, Check, CloudRain, CloudLightning, AlertTriangle, CloudSun } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { evaluateWeatherAlert } from '@/lib/weather/alertRules'
import type { WeatherData } from '@/lib/trip/getWeatherData'

interface WeatherAlertCardProps {
  tripId: string
  weather: WeatherData
  guestCount: number
  onDismiss?: () => void
}

const weatherIcons: Record<string, typeof CloudSun> = {
  dangerous: AlertTriangle,
  poor: CloudLightning,
  marginal: CloudRain,
}

export function WeatherAlertCard({
  tripId, weather, guestCount, onDismiss,
}: WeatherAlertCardProps) {
  const [customMessage, setCustomMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)

  const alert = evaluateWeatherAlert(weather)

  if (!alert.shouldAlert || dismissed) return null

  const Icon = weatherIcons[alert.severity] ?? CloudSun

  // Default message operator can customise
  const defaultMessage = alert.severity === 'dangerous'
    ? `Important weather update for your charter: ${alert.detail} Please check your email for details.`
    : `Weather update: ${alert.detail} Your trip is still on we'll keep you posted.`

  const messageToSend = customMessage.trim() || defaultMessage

  async function notifyGuests() {
    if (!messageToSend.trim()) return
    setSending(true)
    setError('')

    try {
      const res = await fetch(
        `/api/dashboard/trips/${tripId}/notify-weather`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: messageToSend }),
        }
      )
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Failed to send notification')
        return
      }

      setSent(true)
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={cn(
        'rounded-[14px] border overflow-hidden relative',
        alert.severity === 'dangerous'
          ? 'border-error'
          : alert.severity === 'poor'
          ? 'border-[#E8593C]'
          : 'border-warn'
      )}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px]"
        style={{ background: alert.colour }}
      />

      {/* Alert header */}
      <div
        style={{ background: alert.bgColour }}
        className="px-card py-[14px]"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-[10px]">
            <Icon size={22} style={{ color: alert.colour }} className="shrink-0 mt-[2px]" />
            <div>
              <h3
                className="text-[15px] font-bold leading-tight"
                style={{ color: alert.colour }}
              >
                {alert.headline}
              </h3>
              <p className="text-[13px] text-text mt-[4px] leading-relaxed">
                {alert.detail}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setDismissed(true); onDismiss?.() }}
            className="text-text-dim hover:text-text flex-shrink-0 ml-[8px]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Recommended action */}
        <div className="mt-[10px] pt-[10px] border-t border-black/10">
          <p className="text-[13px] font-medium" style={{ color: alert.colour }}>
            → {alert.operatorAction}
          </p>
        </div>
      </div>

      {/* Notify guests section */}
      {guestCount > 0 && (
        <div className="bg-white px-card py-[14px]">
          {sent ? (
            <div className="flex items-center gap-[8px] text-teal">
              <Check size={18} />
              <p className="text-[14px] font-semibold">
                Notification sent to {guestCount} guest{guestCount !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-semibold text-navy mb-[8px]">
                Notify all {guestCount} guests:
              </p>
              <textarea
                rows={2}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder={defaultMessage}
                maxLength={200}
                className="
                  w-full px-[12px] py-[10px] rounded-[10px] text-[13px] resize-none
                  border border-border text-text mb-[10px]
                  placeholder:text-text-dim
                  focus:outline-none focus:border-gold
                "
              />
              {error && (
                <p className="text-[12px] text-error mb-[8px]">{error}</p>
              )}
              <button
                onClick={notifyGuests}
                disabled={sending}
                className="
                  flex items-center gap-[6px] h-[42px] px-[18px] rounded-[10px]
                  bg-gold text-white font-semibold text-[14px]
                  hover:bg-gold-hi transition-colors
                  disabled:opacity-40
                "
              >
                <Send size={15} />
                {sending ? 'Sending...' : 'Send to all guests'}
              </button>
              <p className="text-[11px] text-text-dim mt-[8px] font-medium">
                Sent via push notification + chat message
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
