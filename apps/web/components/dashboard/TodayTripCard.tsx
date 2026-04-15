'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, FileText, MapPin, Calendar, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { formatTime, formatTripDate, formatDuration } from '@/lib/utils/format'
import { useTripGuests } from '@/hooks/useTripGuests'
import { RealtimeIndicator } from './RealtimeIndicator'
import type { OperatorTripDetail } from '@/types'

export function TodayTripCard({ trip }: { trip: OperatorTripDetail }) {
  const { guests, connectionStatus } = useTripGuests(trip.id, trip.guests)
  const [copiedMsg, setCopiedMsg] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)

  const signed = guests.filter(g => g.waiverSigned).length
  const pending = guests.filter(g => !g.waiverSigned).length
  const total = guests.length
  const progress = (total / trip.maxGuests) * 100

  // Pre-written WhatsApp reminder message
  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const reminderMsg = [
    `Hi! Just a reminder about your charter tomorrow`,
    ``,
    `${total} of ${trip.maxGuests} guests checked in`,
    pending > 0
      ? `${pending} guest${pending !== 1 ? 's' : ''} still need${pending === 1 ? 's' : ''} to sign the waiver`
      : `All waivers signed!`,
    ``,
    `Join link: ${appUrl}/trip/${trip.slug}`,
    `Code: ${trip.tripCode}`,
  ].join('\n')

  async function copyReminder() {
    await navigator.clipboard.writeText(reminderMsg)
    setCopiedMsg(true)
    setTimeout(() => setCopiedMsg(false), 2000)
  }

  async function downloadPdf() {
    setDownloadingPdf(true)
    try {
      const res = await fetch(`/api/dashboard/manifest/${trip.id}`)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `manifest-${trip.tripDate}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      alert('Download failed. Please try again.')
    } finally {
      setDownloadingPdf(false)
    }
  }

  return (
    <div className="bg-navy rounded-[14px] p-card text-white relative overflow-hidden">
      {/* Subtle gold glow */}
      <div className="absolute top-[-20px] right-[-20px] w-[140px] h-[140px] bg-[radial-gradient(circle,rgba(184,136,42,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Trip header */}
      <div className="flex items-start justify-between mb-[14px]">
        <div>
          <p className="text-[17px] font-bold">{trip.boat.boatName}</p>
          <p className="text-white/70 text-[13px] mt-[3px] flex items-center gap-[5px]">
            <Calendar size={13} />
            {formatTripDate(trip.tripDate)} · {formatTime(trip.departureTime)} · {formatDuration(trip.durationHours)}
          </p>
          {trip.boat.slipNumber && (
            <p className="text-white/60 text-[12px] mt-[3px] flex items-center gap-[4px]">
              <MapPin size={12} />
              Slip {trip.boat.slipNumber} · {trip.boat.marinaName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-[6px]">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-[0.05em] px-[10px] py-[4px] rounded-[5px]',
            trip.status === 'active'
              ? 'bg-teal text-white'
              : 'bg-white/15 text-white'
          )}>
            {trip.status === 'active' ? 'Active' : 'Today'}
          </span>
          <RealtimeIndicator status={connectionStatus} />
        </div>
      </div>

      {/* Guest progress */}
      <div className="mb-[14px]">
        <div className="flex items-center justify-between mb-[6px]">
          <span className="text-[14px] font-semibold">
            {total} / {trip.maxGuests} checked in
          </span>
          <span className="text-[13px] text-white/70">
            {signed} signed · {pending > 0 ? (
              <span className="text-gold">{pending} pending</span>
            ) : (
              <span className="text-teal">all signed</span>
            )}
          </span>
        </div>
        <div className="w-full h-[6px] bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-[8px]">
        <button
          onClick={downloadPdf}
          disabled={downloadingPdf || guests.length === 0}
          className="
            flex items-center justify-center gap-[6px]
            h-[42px] rounded-[10px]
            bg-white/12 hover:bg-white/20
            text-[13px] font-medium text-white
            transition-colors disabled:opacity-40
          "
        >
          <FileText size={15} />
          {downloadingPdf ? 'Generating...' : 'Download PDF'}
        </button>

        <button
          onClick={copyReminder}
          className="
            flex items-center justify-center gap-[6px]
            h-[42px] rounded-[10px]
            bg-white/12 hover:bg-white/20
            text-[13px] font-medium text-white
            transition-colors
          "
        >
          {copiedMsg ? <Check size={15} /> : <Copy size={15} />}
          {copiedMsg ? 'Copied!' : 'Copy reminder'}
        </button>
      </div>

      <Link
        href={`/dashboard/trips/${trip.id}`}
        className="
          block text-center text-[13px] text-white/60
          underline mt-[10px] min-h-[40px] flex items-center
          justify-center hover:text-white transition-colors
        "
      >
        View full guest list →
      </Link>
    </div>
  )
}
