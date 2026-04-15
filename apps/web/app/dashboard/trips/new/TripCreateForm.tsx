'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createTrip } from './actions'
import { TripSuccessCard } from './TripSuccessCard'
import { SplitBookingEditor } from './SplitBookingEditor'
import { AnchorLoader } from '@/components/ui/AnchorLoader'
import { cn } from '@/lib/utils/cn'
import type { TripFormData, TripCreatedResult, SplitBookingEntry, TripPurpose } from '@/types'
import { DURATION_OPTIONS, TRIP_PURPOSE_LABELS } from '@/types'
import { shouldShowConsiderationWarning } from '@/lib/compliance/tripCompliance'

interface Boat {
  id: string
  boat_name: string
  boat_type: string
  max_capacity: number
  charter_type: string
  marina_name: string
  slip_number: string | null
}

interface CaptainPick {
  id: string
  fullName: string
  photoUrl: string | null
  licenseType: string | null
  licenseNumber: string | null
  licenseExpiry: string | null
  isDefault: boolean
}

interface TripCreateFormProps {
  boats: Boat[]
  operatorName: string
  captains?: CaptainPick[]
}

export function TripCreateForm({ boats, captains = [] }: TripCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<TripCreatedResult | null>(null)
  const [error, setError] = useState<string>('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [showCustomDuration, setShowCustomDuration] = useState(false)
  const [splitBookings, setSplitBookings] = useState<SplitBookingEntry[]>([])

  // Captain picker state — pre-select default captain
  const defaultCaptain = captains.find(c => c.isDefault)
  const [selectedCaptainId, setSelectedCaptainId] = useState<string | null>(
    defaultCaptain?.id ?? null
  )

  // ─── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState<TripFormData>({
    boatId: boats.length === 1 ? boats[0]!.id : '',
    boatName: boats.length === 1 ? boats[0]!.boat_name : '',
    boatCapacity: boats.length === 1 ? boats[0]!.max_capacity : 0,
    tripDate: '',
    departureTime: '09:00',
    durationHours: 4,
    maxGuests: boats.length === 1 ? boats[0]!.max_capacity : 0,
    bookingType: 'private',
    requiresApproval: false,
    tripCode: generateTripCodeClient(),
    charterType: (boats.length === 1 ? boats[0]!.charter_type : 'captained') as TripFormData['charterType'],
    specialNotes: '',
    splitBookings: [],
    tripPurpose: 'commercial',
    forceFullCompliance: false,
    fuelShareDisclaimerAccepted: false,
  })

  function handleBoatChange(boatId: string) {
    const boat = boats.find((b) => b.id === boatId)
    if (!boat) return
    setForm((prev) => ({
      ...prev,
      boatId,
      boatName: boat.boat_name,
      boatCapacity: boat.max_capacity,
      maxGuests: boat.max_capacity,
      charterType: boat.charter_type as TripFormData['charterType'],
    }))
    setFieldErrors({})
  }

  const todayStr = new Date().toISOString().split('T')[0]!

  // ─── Submit ────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    startTransition(async () => {
      const res = await createTrip({
        ...form,
        splitBookings: form.bookingType === 'split' ? splitBookings : [],
      })

      if (!res.success) {
        setError(res.error)
        if (res.fieldErrors) setFieldErrors(res.fieldErrors)
        return
      }

      // Auto-assign captain (non-blocking)
      if (selectedCaptainId && res.data.tripId) {
        fetch(`/api/dashboard/trips/${res.data.tripId}/assign-crew`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captainId: selectedCaptainId, role: 'captain' }),
        }).catch(() => { /* silent — trip created, assignment is best-effort */ })
      }

      setResult(res.data)
    })
  }

  // ─── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <TripSuccessCard
        result={result}
        onCreateAnother={() => {
          setResult(null)
          setForm((prev) => ({
            ...prev,
            tripDate: '',
            tripCode: generateTripCodeClient(),
            specialNotes: '',
          }))
        }}
        onViewTrip={() => router.push(`/dashboard/trips/${result.tripId}`)}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── TRIP PURPOSE ──────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-text-mid mb-2">
          What kind of trip? <span className="text-error">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(Object.entries(TRIP_PURPOSE_LABELS) as [TripPurpose, typeof TRIP_PURPOSE_LABELS[TripPurpose]][]).map(
            ([value, meta]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setForm((p) => ({
                    ...p,
                    tripPurpose: value,
                    fuelShareDisclaimerAccepted: value !== 'fishing_social' ? false : p.fuelShareDisclaimerAccepted,
                  }))
                }}
                className={cn(
                  'p-3 rounded-[14px] text-left border transition-all min-h-[72px]',
                  form.tripPurpose === value
                    ? 'border-2 border-gold bg-gold-dim'
                    : 'border border-border bg-white hover:border-[#A8C4E0]',
                )}
              >
                <div className="text-[20px] mb-0.5">{meta.icon}</div>
                <div className="text-[13px] font-semibold text-navy leading-tight">{meta.label}</div>
                <div className="text-[11px] text-text-mid mt-0.5 leading-tight">{meta.description}</div>
              </button>
            ),
          )}
        </div>

        {/* USCG Consideration warning */}
        {shouldShowConsiderationWarning(form.tripPurpose, form.charterType) && (
          <div className="mt-3 p-3.5 rounded-[12px] bg-warn-dim border border-[#E5910A]/30">
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              <strong>USCG Notice:</strong> If you accept <strong>any payment or consideration</strong> for
              this trip (cash, barter, fuel money from non-friends), you are legally operating
              &quot;for-hire&quot; and must comply with commercial vessel requirements (OUPV license,
              drug testing, enhanced equipment).
            </p>
          </div>
        )}

        {/* Fuel-sharing disclaimer for fishing trips */}
        {form.tripPurpose === 'fishing_social' && (
          <div className="mt-3 p-3.5 rounded-[12px] bg-bg border border-border">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.fuelShareDisclaimerAccepted}
                onChange={(e) => setForm((p) => ({ ...p, fuelShareDisclaimerAccepted: e.target.checked }))}
                className="mt-0.5 w-4 h-4 rounded border-border text-navy focus:ring-gold"
              />
              <span className="text-[12px] text-navy leading-relaxed">
                I confirm that this trip involves <strong>only shared expenses</strong> among friends/acquaintances.
                No passenger is paying me for transportation. I understand that accepting &quot;consideration&quot;
                from passengers would require me to operate as a commercial vessel.
              </span>
            </label>
          </div>
        )}

        {/* Force full compliance toggle for non-commercial trips */}
        {!['commercial', 'corporate'].includes(form.tripPurpose) && (
          <div className="mt-3 flex items-center justify-between p-3.5 rounded-[12px] bg-bg border border-border">
            <div>
              <p className="text-[13px] font-medium text-navy">Force full compliance</p>
              <p className="text-[11px] text-text-mid mt-0.5">
                Require waivers + safety briefing even for this trip type
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={form.forceFullCompliance}
              onClick={() => setForm((p) => ({ ...p, forceFullCompliance: !p.forceFullCompliance }))}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors',
                'focus-visible:ring-2 focus-visible:ring-gold',
                form.forceFullCompliance ? 'bg-navy' : 'bg-border',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
                  form.forceFullCompliance ? 'translate-x-6' : 'translate-x-0',
                )}
              />
            </button>
          </div>
        )}
      </div>

      {/* ── BOAT SELECTION ─────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-text-mid mb-2">
          Which boat? <span className="text-error">*</span>
        </label>

        {boats.length === 1 ? (
          <div className="flex items-center gap-3 p-4 border border-border rounded-[12px] bg-bg">
            
            <div>
              <p className="text-[15px] font-medium text-navy">{boats[0]!.boat_name}</p>
              <p className="text-[12px] text-text-mid">
                {boats[0]!.marina_name} · Up to {boats[0]!.max_capacity} guests
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {boats.map((boat) => (
              <button
                key={boat.id}
                type="button"
                onClick={() => handleBoatChange(boat.id)}
                className={cn(
                  'w-full flex items-center gap-3 p-4 border rounded-[12px] text-left transition-all',
                  form.boatId === boat.id
                    ? 'border-2 border-gold bg-gold-dim'
                    : 'border border-border bg-white hover:border-[#A8C4E0]',
                )}
              >
                
                <div>
                  <p className="text-[15px] font-medium text-navy">{boat.boat_name}</p>
                  <p className="text-[12px] text-text-mid">
                    {boat.marina_name} · Up to {boat.max_capacity} guests
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
        {fieldErrors.boatId && (
          <p className="text-[12px] text-error mt-1">{fieldErrors.boatId[0]}</p>
        )}
      </div>

      {/* ── CAPTAIN PICKER ──────────────────────────────────────────────── */}
      {captains.length > 0 && form.charterType !== 'bareboat' && (
        <div>
          <label className="block text-[13px] font-medium text-text-mid mb-2">
            Assign Captain
          </label>
          <div className="space-y-2">
            {captains.map(captain => {
              const initials = captain.fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()
              return (
                <button
                  key={captain.id}
                  type="button"
                  onClick={() => setSelectedCaptainId(
                    selectedCaptainId === captain.id ? null : captain.id
                  )}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 border rounded-[12px] text-left transition-all',
                    selectedCaptainId === captain.id
                      ? 'border-2 border-gold bg-gold-dim'
                      : 'border border-border bg-white hover:border-[#A8C4E0]',
                  )}
                >
                  {captain.photoUrl ? (
                    <img src={captain.photoUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gold-dim flex items-center justify-center text-[13px] font-bold text-navy">
                      {initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-navy truncate">
                      {captain.fullName}
                      {captain.isDefault && (
                        <span className="ml-1.5 text-[10px] font-bold text-navy bg-gold-dim px-1.5 py-0.5 rounded-full">
                          DEFAULT
                        </span>
                      )}
                    </p>
                    {captain.licenseType && (
                      <p className="text-[12px] text-text-mid">{captain.licenseType}</p>
                    )}
                  </div>
                  {selectedCaptainId === captain.id && (
                    <span className="text-navy text-[16px]">✓</span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-text-mid mt-1.5">
            Captain will be assigned to this trip. <a href="/dashboard/captains" className="text-navy underline">Manage roster →</a>
          </p>
        </div>
      )}

      {/* ── DATE + TIME ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[13px] font-medium text-text-mid mb-2">
            Date <span className="text-error">*</span>
          </label>
          <input
            type="date"
            min={todayStr}
            value={form.tripDate}
            onChange={(e) => setForm((p) => ({ ...p, tripDate: e.target.value }))}
            className={cn(
              'w-full h-[52px] px-3 rounded-[10px] text-[15px]',
              'border bg-white text-navy',
              'focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent',
              fieldErrors.tripDate ? 'border-[#D63B3B]' : 'border-border',
            )}
            required
          />
          {fieldErrors.tripDate && (
            <p className="text-[12px] text-error mt-1">{fieldErrors.tripDate[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-text-mid mb-2">
            Departure time <span className="text-error">*</span>
          </label>
          <input
            type="time"
            step="900"
            value={form.departureTime}
            onChange={(e) => setForm((p) => ({ ...p, departureTime: e.target.value }))}
            className="w-full h-[52px] px-3 rounded-[10px] text-[15px] border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
            required
          />
        </div>
      </div>

      {/* ── DURATION ─────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-text-mid mb-2">
          Duration <span className="text-error">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (opt.value === 0) {
                  setShowCustomDuration(true)
                  setForm((p) => ({ ...p, durationHours: 0 }))
                } else {
                  setShowCustomDuration(false)
                  setForm((p) => ({ ...p, durationHours: opt.value }))
                }
              }}
              className={cn(
                'px-4 py-2 rounded-[14px] text-[14px] font-medium',
                'border transition-all duration-150 min-h-[44px]',
                (opt.value === 0 ? showCustomDuration : form.durationHours === opt.value)
                  ? 'bg-navy text-white border-gold'
                  : 'bg-white text-navy border-border hover:border-gold',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {showCustomDuration && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min="0.5"
              max="24"
              step="0.5"
              placeholder="Hours (e.g. 7)"
              value={form.durationHours || ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, durationHours: Number(e.target.value) }))
              }
              className="h-[52px] w-36 px-3 rounded-[10px] text-[15px] border border-gold bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold"
              autoFocus
            />
            <span className="text-[13px] text-text-mid">hours</span>
          </div>
        )}
        {fieldErrors.durationHours && (
          <p className="text-[12px] text-error mt-1">{fieldErrors.durationHours[0]}</p>
        )}
      </div>

      {/* ── MAX GUESTS ───────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-text-mid mb-2">
          Max guests <span className="text-error">*</span>
        </label>
        <div className="flex items-center gap-4">
          <div className="flex items-center border border-border rounded-[12px] overflow-hidden">
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({ ...p, maxGuests: Math.max(1, p.maxGuests - 1) }))
              }
              className="w-[52px] h-[52px] text-[20px] font-medium text-navy hover:bg-gold-dim transition-colors flex items-center justify-center"
              aria-label="Decrease guests"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={form.boatCapacity || 500}
              value={form.maxGuests}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  maxGuests: Math.min(Number(e.target.value), p.boatCapacity || 500),
                }))
              }
              className="w-16 h-[52px] text-center text-[18px] font-semibold text-navy border-none outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  maxGuests: Math.min(p.maxGuests + 1, p.boatCapacity || 500),
                }))
              }
              className="w-[52px] h-[52px] text-[20px] font-medium text-navy hover:bg-gold-dim transition-colors flex items-center justify-center"
              aria-label="Increase guests"
            >
              +
            </button>
          </div>
          {form.boatCapacity > 0 && (
            <span className="text-[13px] text-text-mid">
              Max {form.boatCapacity} for this boat
            </span>
          )}
        </div>
        {fieldErrors.maxGuests && (
          <p className="text-[12px] text-error mt-1">{fieldErrors.maxGuests[0]}</p>
        )}
      </div>

      {/* ── BOOKING TYPE ─────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-text-mid mb-2">
          Booking type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'private' as const, icon: '', title: 'Private charter', body: 'One group, one link' },
            { value: 'split' as const, icon: '', title: 'Split charter', body: 'Multiple separate groups' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm((p) => ({ ...p, bookingType: opt.value }))}
              className={cn(
                'p-4 rounded-[16px] text-left border transition-all min-h-[44px]',
                form.bookingType === opt.value
                  ? 'border-2 border-gold bg-gold-dim'
                  : 'border border-border bg-white hover:border-[#A8C4E0]',
              )}
            >
              <div className="text-[20px] mb-1">{opt.icon}</div>
              <div className="text-[14px] font-semibold text-navy">{opt.title}</div>
              <div className="text-[12px] text-text-mid mt-0.5">{opt.body}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── SPLIT BOOKING EDITOR ─────────────────────────────────────────── */}
      {form.bookingType === 'split' && (
        <SplitBookingEditor
          entries={splitBookings}
          onChange={setSplitBookings}
          maxTotalGuests={form.maxGuests}
        />
      )}

      {/* ── MANUAL APPROVAL ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-medium text-navy">Manual approval</p>
          <p className="text-[13px] text-text-mid mt-0.5">
            Review each guest before they are confirmed
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.requiresApproval}
          onClick={() => setForm((p) => ({ ...p, requiresApproval: !p.requiresApproval }))}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            'focus-visible:ring-2 focus-visible:ring-gold',
            form.requiresApproval ? 'bg-navy' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
              form.requiresApproval ? 'translate-x-6' : 'translate-x-0',
            )}
          />
        </button>
      </div>

      {/* ── TRIP CODE ────────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-text-mid mb-2">
          Trip code
          <span className="text-[12px] text-text-mid font-normal ml-2">
            Guests enter this to check in
          </span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="text"
            maxLength={4}
            value={form.tripCode}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                tripCode: e.target.value.toUpperCase().slice(0, 4),
              }))
            }
            className="w-24 h-[52px] text-center text-[22px] font-mono font-bold tracking-widest uppercase border border-border rounded-[10px] text-navy focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent bg-white"
            placeholder="SUN4"
          />
          <button
            type="button"
            onClick={() => setForm((p) => ({ ...p, tripCode: generateTripCodeClient() }))}
            className="h-[44px] px-4 rounded-[10px] text-[13px] font-medium border border-border text-text-mid hover:border-gold hover:text-navy transition-colors"
          >
            Regenerate
          </button>
        </div>
        {fieldErrors.tripCode && (
          <p className="text-[12px] text-error mt-1">{fieldErrors.tripCode[0]}</p>
        )}
      </div>

      {/* ── SPECIAL NOTES ────────────────────────────────────────────────── */}
      <div>
        <label className="block text-[13px] font-medium text-text-mid mb-2">
          Special notes
          <span className="text-[12px] font-normal ml-1">(optional)</span>
        </label>
        <textarea
          rows={3}
          maxLength={500}
          value={form.specialNotes}
          onChange={(e) => setForm((p) => ({ ...p, specialNotes: e.target.value }))}
          placeholder="e.g. Corporate event, birthday celebration, sunset route"
          className="w-full px-4 py-3 rounded-[10px] text-[15px] resize-none border border-border text-navy bg-white placeholder:text-text-mid focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
        />
        <div className="flex justify-end mt-1">
          <span
            className={cn(
              'text-[11px]',
              form.specialNotes.length > 450 ? 'text-[#E8593C]' : 'text-text-mid',
            )}
          >
            {form.specialNotes.length} / 500
          </span>
        </div>
      </div>

      {/* ── GLOBAL ERROR ─────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-[12px] bg-error-dim border border-[#D63B3B]/20">
          <p className="text-[14px] text-error font-medium">{error}</p>
        </div>
      )}

      {/* ── SUBMIT ───────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isPending || !form.boatId || !form.tripDate}
        className={cn(
          'w-full h-[52px] rounded-[12px] font-semibold text-[16px]',
          'transition-all duration-150 flex items-center justify-center gap-2',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'bg-navy text-white hover:bg-navy/90',
        )}
      >
        {isPending ? <AnchorLoader size="sm" color="white" /> : <>Generate trip link →</>}
      </button>
    </form>
  )
}

// ─── Client-side trip code generator ─────────────────────────────────────────
// tokens.ts is server-only; this lightweight version is for UI feedback only.
// The server regenerates securely on submission.
function generateTripCodeClient(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]!,
  ).join('')
}
