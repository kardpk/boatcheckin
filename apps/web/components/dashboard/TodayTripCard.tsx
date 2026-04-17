'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Copy, Check, FileText, MapPin, Calendar, Clock, ArrowRight, Loader2 } from 'lucide-react'
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
    <div className="tile tile--dark" style={{ overflow: 'hidden' }}>

      {/* Trip header */}
      <div className="flex items-start justify-between" style={{ marginBottom: 'var(--s-4)' }}>
        <div>
          <p
            className="font-display"
            style={{ fontSize: 'var(--t-tile)', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--color-bone)' }}
          >
            {trip.boat.boatName}
          </p>
          <p
            className="mono flex items-center"
            style={{ color: 'rgba(244,239,230,0.7)', fontSize: 'var(--t-mono-sm)', marginTop: 'var(--s-1)', gap: 'var(--s-1)' }}
          >
            <Calendar size={12} strokeWidth={2} aria-hidden="true" />
            {formatTripDate(trip.tripDate)} · {formatTime(trip.departureTime)} · {formatDuration(trip.durationHours)}
          </p>
          {trip.boat.slipNumber && (
            <p
              className="mono flex items-center"
              style={{ color: 'rgba(244,239,230,0.55)', fontSize: 'var(--t-mono-xs)', marginTop: '3px', gap: '4px' }}
            >
              <MapPin size={11} strokeWidth={2} aria-hidden="true" />
              Slip {trip.boat.slipNumber} · {trip.boat.marinaName}
            </p>
          )}
        </div>
        <div className="flex items-center" style={{ gap: 'var(--s-2)' }}>
          <span className={cn(
            'pill',
            trip.status === 'active' ? 'pill--ok' : 'pill--ghost'
          )} style={trip.status !== 'active' ? { background: 'rgba(244,239,230,0.15)', color: 'var(--color-bone)', borderColor: 'transparent' } : {}}>
            {trip.status === 'active' ? 'Active' : 'Today'}
          </span>
          <RealtimeIndicator status={connectionStatus} />
        </div>
      </div>

      {/* Guest progress */}
      <div style={{ marginBottom: 'var(--s-4)' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--s-2)' }}>
          <span
            className="mono"
            style={{ fontSize: 'var(--t-mono-md)', fontWeight: 600, color: 'var(--color-bone)' }}
          >
            {total} / {trip.maxGuests} checked in
          </span>
          <span
            className="mono"
            style={{ fontSize: 'var(--t-mono-sm)', color: 'rgba(244,239,230,0.7)' }}
          >
            {signed} signed · {pending > 0 ? (
              <span style={{ color: 'var(--color-rust-soft)' }}>{pending} pending</span>
            ) : (
              <span style={{ color: 'var(--color-status-ok)' }}>all signed</span>
            )}
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'rgba(244,239,230,0.15)',
            borderRadius: 'var(--r-1)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(progress, 100)}%`,
              background: 'var(--color-status-ok)',
              borderRadius: 'var(--r-1)',
              transition: 'width 700ms var(--ease)',
            }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2" style={{ gap: 'var(--s-2)' }}>
        <button
          onClick={downloadPdf}
          disabled={downloadingPdf || guests.length === 0}
          className="btn btn--sm"
          style={{
            background: 'rgba(244,239,230,0.12)',
            border: '1px solid rgba(244,239,230,0.15)',
            color: 'var(--color-bone)',
          }}
        >
          {downloadingPdf ? (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          ) : (
            <FileText size={14} strokeWidth={2} aria-hidden="true" />
          )}
          {downloadingPdf ? 'Generating...' : 'Download PDF'}
        </button>

        <button
          onClick={copyReminder}
          className="btn btn--sm"
          style={{
            background: 'rgba(244,239,230,0.12)',
            border: '1px solid rgba(244,239,230,0.15)',
            color: 'var(--color-bone)',
          }}
        >
          {copiedMsg ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} strokeWidth={2} />}
          {copiedMsg ? 'Copied' : 'Copy reminder'}
        </button>
      </div>

      <Link
        href={`/dashboard/trips/${trip.id}`}
        className="editorial-link"
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 'var(--s-3)',
          color: 'var(--color-bone)',
          borderColor: 'rgba(244,239,230,0.3)',
          fontSize: 'var(--t-mono-xs)',
        }}
      >
        View full guest list
        <ArrowRight size={12} strokeWidth={2} aria-hidden="true" />
      </Link>
    </div>
  )
}
