'use client'

import { useState } from 'react'
import { Send, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { evaluateWeatherAlert } from '@/lib/weather/alertRules'
import type { WeatherData } from '@/lib/trip/getWeatherData'

interface WeatherAlertCardProps {
  tripId: string
  weather: WeatherData
  guestCount: number
  onDismiss?: () => void
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

  // Default message operator can customise
  const defaultMessage = alert.severity === 'dangerous'
    ? `Important weather update for your charter: ${alert.detail} Please check your email for details.`
    : `Weather update: ${alert.detail} Your trip is still on — we'll keep you posted.`

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
        'rounded-[20px] border overflow-hidden',
        'shadow-[0_1px_4px_rgba(12,68,124,0.06)]',
        alert.severity === 'dangerous'
          ? 'border-[#D63B3B]'
          : alert.severity === 'poor'
          ? 'border-[#E8593C]'
          : 'border-[#E5910A]'
      )}
    >
      {/* Alert header */}
      <div
        style={{ background: alert.bgColour }}
        className="px-5 py-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-[28px] flex-shrink-0">{alert.emoji}</span>
            <div>
              <h3
                className="text-[15px] font-bold leading-tight"
                style={{ color: alert.colour }}
              >
                {alert.headline}
              </h3>
              <p className="text-[13px] text-[#0D1B2A] mt-1 leading-relaxed">
                {alert.detail}
              </p>
            </div>
          </div>
          <button
            onClick={() => { setDismissed(true); onDismiss?.() }}
            className="text-[#6B7C93] hover:text-[#0D1B2A] flex-shrink-0 ml-2"
          >
            <X size={16} />
          </button>
        </div>

        {/* Recommended action */}
        <div className="mt-3 pt-3 border-t border-black/10">
          <p className="text-[13px] font-medium" style={{ color: alert.colour }}>
            → {alert.operatorAction}
          </p>
        </div>
      </div>

      {/* Notify guests section */}
      {guestCount > 0 && (
        <div className="bg-white px-5 py-4">
          {sent ? (
            <div className="flex items-center gap-2 text-[#1D9E75]">
              <span className="text-[18px]">✓</span>
              <p className="text-[14px] font-semibold">
                Notification sent to {guestCount} guest{guestCount !== 1 ? 's' : ''}
              </p>
            </div>
          ) : (
            <>
              <p className="text-[13px] font-medium text-[#0D1B2A] mb-2">
                Notify all {guestCount} guests:
              </p>
              <textarea
                rows={2}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                placeholder={defaultMessage}
                maxLength={200}
                className="
                  w-full px-3 py-2 rounded-[10px] text-[13px] resize-none
                  border border-[#D0E2F3] text-[#0D1B2A] mb-3
                  placeholder:text-[#6B7C93]
                  focus:outline-none focus:border-[#0C447C]
                "
              />
              {error && (
                <p className="text-[12px] text-[#D63B3B] mb-2">{error}</p>
              )}
              <button
                onClick={notifyGuests}
                disabled={sending}
                className="
                  flex items-center gap-2 h-[44px] px-5 rounded-[12px]
                  bg-[#0C447C] text-white font-semibold text-[14px]
                  hover:bg-[#093a6b] transition-colors
                  disabled:opacity-40
                "
              >
                <Send size={15} />
                {sending ? 'Sending...' : 'Send to all guests'}
              </button>
              <p className="text-[11px] text-[#6B7C93] mt-2">
                Sent via push notification + chat message
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
