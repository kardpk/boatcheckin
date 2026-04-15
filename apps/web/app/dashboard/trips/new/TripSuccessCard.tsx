'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink, MessageCircle } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { cn } from '@/lib/utils/cn'
import type { TripCreatedResult } from '@/types'

interface TripSuccessCardProps {
  result: TripCreatedResult
  onCreateAnother: () => void
  onViewTrip: () => void
}

export function TripSuccessCard({ result, onCreateAnother, onViewTrip }: TripSuccessCardProps) {
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)
  const isSplit = result.bookings.length > 0

  async function copyToClipboard(text: string, type: 'link' | 'message') {
    await navigator.clipboard.writeText(text)
    if (type === 'link') {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } else {
      setCopiedMessage(true)
      setTimeout(() => setCopiedMessage(false), 2000)
    }
  }

  if (isSplit) {
    return <SplitSuccessCard result={result} onCreateAnother={onCreateAnother} />
  }

  return (
    <div className="space-y-4">
      {/* ── Success header ─────────────────────────────────────────────── */}
      <div className="p-6 rounded-[14px] bg-navy text-white text-center">
        
        <h2 className="text-[20px] font-bold mb-1">Your trip link is ready!</h2>
        <p className="text-[14px] text-white/80">Share it with your guests</p>

        <div className="mt-4 inline-flex items-center gap-3 bg-white/10 rounded-[12px] px-6 py-3">
          <span className="text-[13px] text-white/70">Code</span>
          <span className="text-[28px] font-mono font-black tracking-[0.15em] text-white">
            {result.tripCode}
          </span>
        </div>
      </div>

      {/* ── Trip link ──────────────────────────────────────────────────── */}
      <div className="border border-border rounded-[16px] overflow-hidden">
        <div className="p-4">
          <p className="text-[11px] font-semibold text-text-mid uppercase tracking-wider mb-2">
            Trip link
          </p>
          <p className="text-[14px] text-navy break-all font-medium">{result.tripLink}</p>
        </div>

        <div className="grid grid-cols-2 border-t border-border">
          <button
            onClick={() => copyToClipboard(result.tripLink, 'link')}
            className={cn(
              'flex items-center justify-center gap-2',
              'h-[52px] text-[14px] font-medium transition-colors',
              'border-r border-border',
              copiedLink
                ? 'bg-[#E8F9F4] text-teal'
                : 'text-navy hover:bg-gold-dim',
            )}
          >
            {copiedLink ? <Check size={16} /> : <Copy size={16} />}
            {copiedLink ? 'Copied!' : 'Copy link'}
          </button>
          <a
            href={result.tripLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-[52px] text-[14px] font-medium text-text-mid hover:bg-bg transition-colors"
          >
            <ExternalLink size={16} />
            Preview
          </a>
        </div>
      </div>

      {/* ── QR Code ────────────────────────────────────────────────────── */}
      <div className="border border-border rounded-[16px] p-4 flex flex-col items-center gap-3">
        <p className="text-[12px] text-text-mid font-medium">
          QR code — print and post at your marina
        </p>
        <div className="bg-white p-3 rounded-[12px] border border-border">
          <QRCodeSVG
            value={result.tripLink}
            size={160}
            fgColor="#0C447C"
            bgColor="#FFFFFF"
            level="M"
          />
        </div>
      </div>

      {/* ── WhatsApp message ───────────────────────────────────────────── */}
      <div className="border border-border rounded-[16px] overflow-hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} className="text-teal" />
            <p className="text-[11px] font-semibold text-text-mid uppercase tracking-wider">
              Ready-to-send WhatsApp message
            </p>
          </div>
          <pre className="text-[14px] text-navy whitespace-pre-wrap font-sans leading-relaxed">
            {result.whatsappMessage}
          </pre>
        </div>
        <button
          onClick={() => copyToClipboard(result.whatsappMessage, 'message')}
          className={cn(
            'w-full h-[52px] border-t border-border',
            'flex items-center justify-center gap-2',
            'text-[15px] font-semibold transition-colors',
            copiedMessage
              ? 'bg-[#E8F9F4] text-teal'
              : 'bg-white text-navy hover:bg-gold-dim',
          )}
        >
          {copiedMessage ? <Check size={16} /> : <Copy size={16} />}
          {copiedMessage ? 'Copied to clipboard!' : 'Copy WhatsApp message'}
        </button>
      </div>

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 pt-2">
        <button
          onClick={onViewTrip}
          className="w-full h-[52px] rounded-[12px] bg-navy text-white font-semibold text-[15px] hover:bg-navy/90 transition-colors"
        >
          View trip & guest list →
        </button>
        <button
          onClick={onCreateAnother}
          className="w-full h-[52px] rounded-[12px] border border-border text-navy font-medium text-[15px] hover:bg-gold-dim transition-colors"
        >
          Create another trip
        </button>
      </div>
    </div>
  )
}

// ─── Split booking success screen ─────────────────────────────────────────────

function SplitSuccessCard({
  result,
  onCreateAnother,
}: {
  result: TripCreatedResult
  onCreateAnother: () => void
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copyMessage(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-[14px] bg-navy text-white text-center">
        
        <h2 className="text-[20px] font-bold">
          {result.bookings.length} booking links ready!
        </h2>
        <p className="text-[13px] text-white/80 mt-1">
          Send each organiser their personal link
        </p>
      </div>

      {result.bookings.map((booking) => (
        <div
          key={booking.bookingId}
          className="border border-border rounded-[16px] overflow-hidden"
        >
          <div className="p-4 bg-bg border-b border-border">
            <p className="text-[13px] font-semibold text-navy">
              {booking.organiserName}
            </p>
            <p className="text-[12px] text-text-mid">
              Max {booking.maxGuests} guests · Code: {booking.bookingCode}
            </p>
          </div>
          <button
            onClick={() => copyMessage(booking.bookingId, booking.whatsappMessage)}
            className={cn(
              'w-full h-[48px]',
              'flex items-center justify-center gap-2',
              'text-[14px] font-medium transition-colors',
              copiedId === booking.bookingId
                ? 'bg-[#E8F9F4] text-teal'
                : 'bg-white text-navy hover:bg-gold-dim',
            )}
          >
            {copiedId === booking.bookingId ? (
              <><Check size={15} /> Copied!</>
            ) : (
              <><Copy size={15} /> Copy message for {booking.organiserName.split(' ')[0]}</>
            )}
          </button>
        </div>
      ))}

      <button
        onClick={onCreateAnother}
        className="w-full h-[52px] rounded-[12px] border border-border text-navy font-medium text-[15px] hover:bg-gold-dim transition-colors"
      >
        Create another trip
      </button>
    </div>
  )
}
