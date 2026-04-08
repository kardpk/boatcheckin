'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, FileText } from 'lucide-react'
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
    `Hi! Just a reminder about your charter tomorrow ⚓`,
    ``,
    `📋 ${total} of ${trip.maxGuests} guests checked in`,
    pending > 0
      ? `⏳ ${pending} guest${pending !== 1 ? 's' : ''} still need${pending === 1 ? 's' : ''} to sign the waiver`
      : `✅ All waivers signed!`,
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
    <div className="bg-[#0C447C] rounded-[20px] p-5 text-white">
      {/* Trip header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[17px] font-bold">
            {trip.boat.boatName}
          </p>
          <p className="text-white/70 text-[13px] mt-0.5">
            {formatTripDate(trip.tripDate)} ·{' '}
            {formatTime(trip.departureTime)} ·{' '}
            {formatDuration(trip.durationHours)}
          </p>
          {trip.boat.slipNumber && (
            <p className="text-white/60 text-[12px] mt-0.5">
              📍 Slip {trip.boat.slipNumber} · {trip.boat.marinaName}
            </p>
          )}
        </div>
        <span className={cn(
          'text-[11px] font-bold px-2.5 py-1 rounded-full',
          trip.status === 'active'
            ? 'bg-[#1D9E75] text-white'
            : 'bg-white/20 text-white'
        )}>
          {trip.status === 'active' ? 'Active ●' : 'Today'}
        </span>
        <RealtimeIndicator status={connectionStatus} />
      </div>

      {/* Guest progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[14px] font-semibold">
            {total} / {trip.maxGuests} checked in
          </span>
          <span className="text-[13px] text-white/70">
            {signed} signed · {pending > 0 ? (
              <span className="text-[#FEF3DC]">{pending} pending</span>
            ) : '✓ all signed'}
          </span>
        </div>
        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1D9E75] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Mini guest list (first 4) */}
      {guests.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {guests.slice(0, 4).map(guest => (
            <div
              key={guest.id}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-[10px]',
                guest.waiverSigned
                  ? 'bg-white/10'
                  : 'bg-[#E5910A]/20'
              )}
            >
              {/* Avatar */}
              <div className="
                w-7 h-7 rounded-full bg-white/20
                flex items-center justify-center
                text-[11px] font-bold flex-shrink-0
              ">
                {guest.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>

              <span className="text-[13px] font-medium flex-1 truncate">
                {guest.fullName.split(' ')[0]}
              </span>

              {/* Addon emojis */}
              <span className="text-[12px]">
                {guest.addonOrders.map(o => o.emoji).join(' ')}
              </span>

              {/* Waiver badge */}
              <span className={cn(
                'text-[11px] font-semibold',
                guest.waiverSigned ? 'text-[#4ADE80]' : 'text-[#FEF3DC]'
              )}>
                {guest.waiverSigned ? '✓' : '…'}
              </span>
            </div>
          ))}
          {guests.length > 4 && (
            <p className="text-[12px] text-white/60 pl-3">
              +{guests.length - 4} more · See full list →
            </p>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={downloadPdf}
          disabled={downloadingPdf || guests.length === 0}
          className="
            flex items-center justify-center gap-2
            h-[44px] rounded-[10px]
            bg-white/15 hover:bg-white/25
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
            flex items-center justify-center gap-2
            h-[44px] rounded-[10px]
            bg-white/15 hover:bg-white/25
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
          block text-center text-[13px] text-white/70
          underline mt-3 min-h-[44px] flex items-center
          justify-center hover:text-white transition-colors
        "
      >
        View full guest list →
      </Link>
    </div>
  )
}
