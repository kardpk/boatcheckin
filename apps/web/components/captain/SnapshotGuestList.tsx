'use client'

import { useRef, useState } from 'react'
import {
  Anchor, Phone, ChevronDown, Check, FileText,
  Clock, Shield, LifeBuoy, Utensils, Baby, User
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface GuestRow {
  id: string
  fullName: string
  dateOfBirth: string | null
  waiverSigned: boolean
  waiverTextHash: string | null
  safetyAckCount: number
  languageFlag: string
  addonEmojis: string[]
  approvalStatus: string
  fwcLicenseUrl: string | null
  liveryBriefingVerifiedAt: string | null
  liveryBriefingVerifiedBy: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  dietaryRequirements?: string | null
  isNonSwimmer?: boolean
}

export function SnapshotGuestList({
  guests, maxGuests, captainToken,
}: {
  guests: GuestRow[]
  maxGuests: number
  captainToken?: string
}) {
  const signed = guests.filter(g => g.waiverSigned).length
  const pendingLivery = guests.filter(g => g.approvalStatus === 'pending_livery_briefing').length
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [targetGuest, setTargetGuest] = useState<string | null>(null)
  const [liveryVerifyId, setLiveryVerifyId] = useState<string | null>(null)
  const [liveryVerifierName, setLiveryVerifierName] = useState('')
  const [actioning, setActioning] = useState<string | null>(null)
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null)

  const handleUploadClick = (guestId: string) => {
    setTargetGuest(guestId)
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !targetGuest) return

    setUploadingId(targetGuest)
    console.log(`Uploading paper waiver for ${targetGuest}...`)
    await new Promise(r => setTimeout(r, 1000))
    setUploadingId(null)
    setTargetGuest(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function verifyLiveryBriefing(guestId: string) {
    if (!liveryVerifierName.trim() || !captainToken) return
    setActioning(guestId)
    try {
      await fetch(
        `/api/captain/${captainToken}/verify-livery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            guestId,
            verifierName: liveryVerifierName.trim(),
          }),
        }
      )
      setLiveryVerifyId(null)
      setLiveryVerifierName('')
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between"
        style={{ padding: 'var(--s-4) var(--s-5)', borderBottom: '1px solid var(--color-line-soft)' }}
      >
        <h2 className="mono" style={{ fontSize: 'var(--t-mono-sm)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-ink)' }}>
          Passengers
        </h2>
        <div className="flex items-center" style={{ gap: 'var(--s-2)' }}>
          <span className="mono" style={{ fontSize: 'var(--t-mono-sm)', fontWeight: 600, color: 'var(--color-ink)' }}>
            {guests.length} checked in · {signed} signed
          </span>
          {pendingLivery > 0 && (
            <span className="pill pill--warn" style={{ fontSize: 'var(--t-mono-xs)' }}>
              <Anchor size={10} strokeWidth={2} aria-hidden="true" /> {pendingLivery} livery
            </span>
          )}
        </div>
      </div>

      {/* Guest rows */}
      {guests.length === 0 ? (
        <div style={{ padding: 'var(--s-8) var(--s-5)', textAlign: 'center' }}>
          <p className="mono" style={{ fontSize: 'var(--t-mono-sm)', color: 'var(--color-ink-muted)' }}>No guests yet</p>
        </div>
      ) : (
        <div style={{ borderTop: 0 }}>
          {guests.map(guest => (
            <div
              key={guest.id}
              style={{
                borderBottom: '1px solid var(--color-line-soft)',
                background: guest.approvalStatus === 'pending_livery_briefing'
                  ? 'rgba(191,141,48,0.06)'
                  : guest.waiverSigned
                  ? 'transparent'
                  : 'rgba(191,141,48,0.04)',
                ...(expandedGuestId === guest.id ? { background: 'var(--color-bone)' } : {}),
              }}
            >
              <div
                className="flex items-center"
                style={{ gap: 'var(--s-3)', padding: 'var(--s-3) var(--s-5)', cursor: 'pointer' }}
                onClick={() => setExpandedGuestId(
                  expandedGuestId === guest.id ? null : guest.id
                )}
              >
                {/* Avatar */}
                <div
                  className="avatar avatar--sm flex-shrink-0"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--t-mono-xs)', fontWeight: 600, color: 'var(--color-ink)', background: 'var(--color-bone)', borderColor: 'var(--color-line)' }}
                >
                  {guest.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>

                {/* Name + expand indicator */}
                <div className="flex-1 min-w-0 flex items-center" style={{ gap: 'var(--s-2)' }}>
                  <span style={{ fontSize: 'var(--t-body-sm)', fontWeight: 500, color: 'var(--color-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {guest.fullName}
                  </span>
                  <ChevronDown
                    size={12}
                    strokeWidth={2}
                    style={{ color: 'var(--color-ink-muted)', flexShrink: 0, transition: 'transform var(--dur-fast) var(--ease)', transform: expandedGuestId === guest.id ? 'rotate(180deg)' : 'none' }}
                  />
                </div>

                {/* Status badges */}
                <div className="flex flex-col items-end" style={{ gap: 'var(--s-1)', flexShrink: 0 }}>
                  {/* Livery badge */}
                  {guest.approvalStatus === 'pending_livery_briefing' ? (
                    <span className="pill pill--warn" style={{ fontSize: 'var(--t-mono-xs)' }}>
                      <Anchor size={9} strokeWidth={2} aria-hidden="true" /> Briefing Required
                    </span>
                  ) : guest.liveryBriefingVerifiedAt ? (
                    <span className="pill pill--ok" style={{ fontSize: 'var(--t-mono-xs)' }}>
                      <Check size={9} strokeWidth={2.5} aria-hidden="true" /> Briefed
                    </span>
                  ) : null}

                  {/* Waiver status */}
                  {guest.waiverTextHash === 'firma_template' ? (
                    <span className="pill pill--brass" style={{ fontSize: 'var(--t-mono-xs)' }}>
                      <FileText size={9} strokeWidth={2} aria-hidden="true" /> Firma
                    </span>
                  ) : guest.waiverSigned ? (
                    <span className="pill pill--ok" style={{ fontSize: 'var(--t-mono-xs)' }}>
                      <Check size={9} strokeWidth={2.5} aria-hidden="true" /> Signed
                    </span>
                  ) : (
                    <span className="pill pill--warn" style={{ fontSize: 'var(--t-mono-xs)' }}>
                      <Clock size={9} strokeWidth={2} aria-hidden="true" /> Pending
                    </span>
                  )}

                  {/* Safety ack count */}
                  <span className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Shield size={9} strokeWidth={2} aria-hidden="true" /> {guest.safetyAckCount} cards
                  </span>

                  {!guest.waiverSigned && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleUploadClick(guest.id) }}
                      disabled={uploadingId === guest.id}
                      className="editorial-link"
                      style={{ fontSize: 'var(--t-mono-xs)', border: 'none', padding: 0 }}
                    >
                      {uploadingId === guest.id ? 'Uploading...' : 'Upload Paper'}
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded: Emergency Contact + Details */}
              {expandedGuestId === guest.id && (
                <div style={{ margin: '0 var(--s-5) var(--s-3)', marginLeft: 'calc(var(--s-5) + 36px + var(--s-3))', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
                  {/* Emergency Contact */}
                  {guest.emergencyContactName && guest.emergencyContactPhone && (
                    <div className="alert alert--warn" style={{ alignItems: 'center' }}>
                      <Phone size={14} strokeWidth={2} style={{ flexShrink: 0 }} aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 'var(--t-mono-xs)', fontWeight: 600, color: 'var(--color-ink)', margin: 0 }}>
                          Emergency: {guest.emergencyContactName}
                        </p>
                        <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', marginTop: '2px' }}>
                          {guest.emergencyContactPhone}
                        </p>
                      </div>
                      <a
                        href={`tel:${guest.emergencyContactPhone}`}
                        onClick={e => e.stopPropagation()}
                        className="btn btn--danger btn--sm"
                        style={{ flexShrink: 0, fontSize: 'var(--t-mono-xs)', letterSpacing: '0.1em' }}
                      >
                        <Phone size={11} strokeWidth={2} aria-hidden="true" /> CALL
                      </a>
                    </div>
                  )}

                  {/* Medical/dietary flags */}
                  <div className="flex flex-wrap" style={{ gap: 'var(--s-2)' }}>
                    {guest.isNonSwimmer && (
                      <span className="pill pill--err" style={{ fontSize: 'var(--t-mono-xs)' }}>
                        <LifeBuoy size={9} strokeWidth={2} aria-hidden="true" /> Non-swimmer
                      </span>
                    )}
                    {guest.dietaryRequirements && (
                      <span className="pill pill--warn" style={{ fontSize: 'var(--t-mono-xs)' }}>
                        <Utensils size={9} strokeWidth={2} aria-hidden="true" /> {guest.dietaryRequirements}
                      </span>
                    )}
                    {guest.dateOfBirth && (() => {
                      const age = Math.floor(
                        (Date.now() - new Date(guest.dateOfBirth).getTime()) / 31557600000
                      )
                      if (age < 6) return (
                        <span className="pill pill--err" style={{ fontSize: 'var(--t-mono-xs)' }}>
                          <Baby size={9} strokeWidth={2} aria-hidden="true" /> Age {age} — PFD Required
                        </span>
                      )
                      if (age < 18) return (
                        <span className="pill pill--ghost" style={{ fontSize: 'var(--t-mono-xs)' }}>
                          <User size={9} strokeWidth={2} aria-hidden="true" /> Minor (age {age})
                        </span>
                      )
                      return null
                    })()
                    }
                  </div>

                  {/* No emergency contact notice */}
                  {!guest.emergencyContactPhone && (
                    <p className="mono" style={{ fontSize: 'var(--t-mono-xs)', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>
                      No emergency contact provided
                    </p>
                  )}
                </div>
              )}

              {/* Livery verify — captain inline form */}
              {guest.approvalStatus === 'pending_livery_briefing' && captainToken && (
                <div style={{ margin: '0 var(--s-5) var(--s-3)', marginLeft: 'calc(var(--s-5) + 36px + var(--s-3))' }}>
                  {liveryVerifyId === guest.id ? (
                    <div style={{ padding: 'var(--s-3)', background: 'var(--color-bone)', border: '1px solid var(--color-brass)', borderRadius: 'var(--r-1)', display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>
                      <p style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink)', lineHeight: 1.6 }}>
                        <strong>I confirm</strong> I have briefed <strong>{guest.fullName}</strong> on{' '}
                        vessel operation, safety equipment, and emergency procedures.
                      </p>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={liveryVerifierName}
                        onChange={e => setLiveryVerifierName(e.target.value)}
                        className="field-input"
                        style={{ height: 36, padding: '0 var(--s-3)', fontSize: 'var(--t-body-sm)' }}
                      />
                      <div className="flex" style={{ gap: 'var(--s-2)' }}>
                        <button
                          onClick={() => verifyLiveryBriefing(guest.id)}
                          disabled={!liveryVerifierName.trim() || actioning === guest.id}
                          className="btn btn--rust flex-1 btn--sm"
                          style={{ height: 32, justifyContent: 'center' }}
                        >
                          ✓ Confirm
                        </button>
                        <button
                          onClick={() => setLiveryVerifyId(null)}
                          className="btn btn--sm"
                          style={{ height: 32, paddingLeft: 'var(--s-3)', paddingRight: 'var(--s-3)' }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setLiveryVerifyId(guest.id); setLiveryVerifierName('') }}
                      className="pill pill--brass"
                      style={{ fontSize: 'var(--t-mono-xs)', cursor: 'pointer', border: 'none' }}
                    >
                      <Anchor size={10} strokeWidth={2} aria-hidden="true" />
                      Verify Livery Briefing
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Hidden file input for paper waiver upload */}
      <input 
        type="file" 
        accept="application/pdf,image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
