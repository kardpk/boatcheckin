'use client'

import { useState, useRef } from 'react'
import { CheckCircle, AlertTriangle, Clock, Camera, X, ImagePlus } from 'lucide-react'

interface PhotoRecord {
  url:  string
  path: string
}

interface RentalDayRecord {
  id: string
  day_number: number
  day_date: string
  status: 'pending' | 'active' | 'complete' | 'issue'
  notes_in: string | null
  notes_out: string | null
  fuel_level_in: string | null
  fuel_level_out: string | null
  issues_reported: string | null
  check_in_at: string | null
  check_out_at: string | null
  photos_in?: PhotoRecord[]
  photos_out?: PhotoRecord[]
}

interface Props {
  slug:         string
  dayNumber:    number
  guestId:      string
  guestName:    string
  boatName:     string
  marinaName:   string
  slipNumber:   string | null
  operatorName: string
  tripDate:     string
  durationDays: number
  rentalDay:    RentalDayRecord | null
}

const FUEL_LEVELS = ['full', '3/4', '1/2', '1/4', 'empty'] as const
const MAX_PHOTOS = 3

// ── Client-side image compression ────────────────────────────────────────────
async function compressImage(file: File, maxPx = 1200, quality = 0.85): Promise<Blob> {
  if (typeof window === 'undefined' || !window.createImageBitmap) {
    return file  // SSR or unsupported — pass through
  }
  try {
    const img    = await createImageBitmap(file)
    const scale  = Math.min(1, maxPx / Math.max(img.width, img.height))
    const canvas = document.createElement('canvas')
    canvas.width  = Math.round(img.width  * scale)
    canvas.height = Math.round(img.height * scale)
    canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
    return new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b ?? file), 'image/jpeg', quality)
    )
  } catch {
    return file  // compression failed — pass original
  }
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }).toUpperCase()
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function DayConditionClient(props: Props) {
  const { slug, dayNumber, guestId, boatName, marinaName, slipNumber, operatorName, durationDays, rentalDay } = props

  const [status, setStatus]       = useState(rentalDay?.status ?? 'pending')
  const [notes, setNotes]         = useState('')
  const [fuelLevel, setFuelLevel] = useState<typeof FUEL_LEVELS[number] | ''>('')
  const [issues, setIssues]       = useState('')
  const [hasIssues, setHasIssues] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]         = useState('')
  const [sealedRecord, setSealedRecord] = useState<RentalDayRecord | null>(rentalDay)

  // Photo state — separate for check-in vs check-out
  const [photos, setPhotos]           = useState<PhotoRecord[]>([])
  const [uploading, setUploading]     = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const dayDate = rentalDay?.day_date ?? ''

  // ── Photo upload handler ──────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so same file can be re-selected
    e.target.value = ''

    if (photos.length >= MAX_PHOTOS) {
      setUploadError(`Maximum ${MAX_PHOTOS} photos allowed`)
      return
    }

    setUploadError('')
    setUploading(true)

    const phase   = status === 'active' ? 'out' : 'in'
    const compressed = await compressImage(file)
    const formData   = new FormData()
    formData.append('file',    new File([compressed], file.name, { type: 'image/jpeg' }))
    formData.append('guestId', guestId)
    formData.append('phase',   phase)

    const res  = await fetch(`/api/trips/${slug}/rental-days/${dayNumber}/upload-photo`, {
      method: 'POST',
      body: formData,
    })
    const json = await res.json()

    setUploading(false)

    if (!res.ok) {
      setUploadError(json.error ?? 'Upload failed')
      return
    }

    setPhotos(prev => [...prev, { url: json.data.url, path: json.data.path }])
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Photo widget UI ───────────────────────────────────────────────────────
  function PhotoWidget() {
    return (
      <div style={sty.card}>
        <label style={sty.label}>Condition photos (optional · max {MAX_PHOTOS})</label>

        {/* Thumbnails */}
        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={`Photo ${i + 1}`}
                  style={{ width: 64, height: 64, objectFit: 'cover', border: '1px solid var(--color-border)' }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    background: 'var(--color-ink)', border: 'none',
                    borderRadius: '50%', width: 18, height: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                  aria-label="Remove photo"
                >
                  <X size={10} color="#fff" />
                </button>
              </div>
            ))}

            {/* Uploading placeholder */}
            {uploading && (
              <div style={{
                width: 64, height: 64,
                background: 'var(--color-ink-faint)',
                border: '1px solid var(--color-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'pulse 1.4s ease-in-out infinite',
              }}>
                <Camera size={20} color="var(--color-ink-secondary)" />
              </div>
            )}
          </div>
        )}

        {/* Add button */}
        {photos.length < MAX_PHOTOS && !uploading && (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px',
              border: '1px dashed var(--color-border)',
              background: 'var(--color-bone)',
              color: 'var(--color-ink-secondary)',
              fontSize: 13, cursor: 'pointer', width: '100%',
            }}
          >
            <ImagePlus size={14} strokeWidth={1.5} />
            {photos.length === 0 ? 'Add condition photos' : `Add another (${photos.length}/${MAX_PHOTOS})`}
          </button>
        )}

        {uploading && photos.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--color-ink-secondary)' }}>Uploading…</p>
        )}

        {uploadError && (
          <p style={{ fontSize: 12, color: '#b42814', marginTop: 6 }}>{uploadError}</p>
        )}

        {/* Hidden file input — camera capture on mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>
    )
  }

  // ── Check-in submit ───────────────────────────────────────────────────────
  async function submitCheckIn() {
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/trips/${slug}/rental-days/${dayNumber}/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        notes:     notes || undefined,
        fuelLevel: fuelLevel || undefined,
        photoUrls: photos.length > 0 ? photos.map(p => p.url) : undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed'); setSubmitting(false); return }
    setSealedRecord(prev => prev ? { ...prev, ...json.data } : json.data)
    setStatus('active')
    setNotes('')
    setFuelLevel('')
    setPhotos([])
    setSubmitting(false)
  }

  // ── Check-out submit ──────────────────────────────────────────────────────
  async function submitCheckOut() {
    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/trips/${slug}/rental-days/${dayNumber}/check-out`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        notes:          notes || undefined,
        fuelLevel:      fuelLevel || undefined,
        issuesReported: hasIssues ? issues : undefined,
        photoUrls:      photos.length > 0 ? photos.map(p => p.url) : undefined,
      }),
    })
    const json = await res.json()
    if (!res.ok) { setError(json.error ?? 'Failed'); setSubmitting(false); return }
    setSealedRecord(prev => prev ? { ...prev, ...json.data } : json.data)
    setStatus(json.data.status)
    setSubmitting(false)
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const sty = {
    page: {
      minHeight: '100dvh',
      background: 'var(--color-bone)',
      padding: '24px 16px 48px',
      fontFamily: 'var(--font-sans)',
    } as React.CSSProperties,
    kicker: {
      fontSize: 12,
      color: 'var(--color-ink-secondary)',
      textTransform: 'uppercase' as const,
      letterSpacing: '.06em',
      marginBottom: 4,
    },
    heading: {
      fontSize: 22,
      fontWeight: 700,
      color: 'var(--color-ink)',
      margin: '0 0 4px',
    },
    sub: {
      fontSize: 14,
      color: 'var(--color-ink-secondary)',
      marginBottom: 24,
    },
    card: {
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      padding: '16px',
      marginBottom: 12,
    },
    label: {
      display: 'block' as const,
      fontSize: 11,
      textTransform: 'uppercase' as const,
      letterSpacing: '.08em',
      color: 'var(--color-ink-secondary)',
      marginBottom: 8,
      fontWeight: 600,
    },
    textarea: {
      width: '100%',
      border: '1px solid var(--color-border)',
      padding: '10px 12px',
      fontSize: 14,
      resize: 'vertical' as const,
      minHeight: 80,
      fontFamily: 'inherit',
      background: 'var(--color-bone)',
      outline: 'none',
      boxSizing: 'border-box' as const,
    },
    fuelGrid: {
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: 6,
    },
    fuelBtn: (active: boolean) => ({
      padding: '8px 4px',
      fontSize: 12,
      fontWeight: active ? 700 : 400,
      border: active ? '2px solid var(--color-rust)' : '1px solid var(--color-border)',
      background: active ? 'var(--color-rust)' : 'var(--color-bone)',
      color: active ? '#fff' : 'var(--color-ink)',
      cursor: 'pointer',
    }),
    btn: (disabled = false) => ({
      width: '100%',
      padding: '14px',
      background: disabled ? 'var(--color-ink-faint)' : 'var(--color-ink)',
      color: disabled ? 'var(--color-ink-secondary)' : 'var(--color-bone)',
      fontWeight: 700,
      fontSize: 14,
      border: 'none',
      cursor: disabled ? 'default' : 'pointer',
      letterSpacing: '.04em',
      textTransform: 'uppercase' as const,
      marginTop: 16,
    }),
    errorBox: {
      background: 'rgba(180,40,20,.08)',
      border: '1px solid rgba(180,40,20,.3)',
      padding: '10px 14px',
      fontSize: 13,
      color: '#b42814',
      marginTop: 8,
    },
    sealRow: (col: string) => ({
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      borderBottom: '1px solid var(--color-border)',
      fontSize: 14,
      color: col,
    }),
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={sty.page}>
      <p style={sty.kicker}>{boatName} · {marinaName}{slipNumber ? ` · Slip ${slipNumber}` : ''}</p>
      <h1 style={sty.heading}>Day {dayNumber} of {durationDays}</h1>
      <p style={sty.sub}>
        {dayDate ? formatDate(rentalDay!.day_date) : '—'} · {operatorName}
      </p>

      {/* ── SEALED RECORD ─────────────────────────────────────────────────── */}
      {(status === 'complete' || status === 'issue') && sealedRecord && (
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            marginBottom: 16,
            color: status === 'issue' ? 'var(--color-amber)' : 'var(--color-green)',
            fontWeight: 700, fontSize: 15,
          }}>
            {status === 'issue'
              ? <AlertTriangle size={18} />
              : <CheckCircle size={18} />}
            {status === 'issue' ? 'Day closed with issues' : 'Day sealed'}
          </div>

          <div style={sty.card}>
            <p style={sty.label}>Check-in — {sealedRecord.check_in_at ? formatTime(sealedRecord.check_in_at) : '—'}</p>
            <div style={sty.sealRow('var(--color-ink)')}>
              <span style={{ color: 'var(--color-ink-secondary)' }}>Fuel</span>
              <span>{sealedRecord.fuel_level_in ?? '—'}</span>
            </div>
            {sealedRecord.notes_in && (
              <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--color-ink-secondary)' }}>
                {sealedRecord.notes_in}
              </div>
            )}
            {/* Check-in photos */}
            {(sealedRecord.photos_in ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8 }}>
                {(sealedRecord.photos_in ?? []).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={p.url} alt={`Check-in photo ${i + 1}`}
                    style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                ))}
              </div>
            )}
          </div>

          <div style={sty.card}>
            <p style={sty.label}>Check-out — {sealedRecord.check_out_at ? formatTime(sealedRecord.check_out_at) : '—'}</p>
            <div style={sty.sealRow('var(--color-ink)')}>
              <span style={{ color: 'var(--color-ink-secondary)' }}>Fuel</span>
              <span>{sealedRecord.fuel_level_out ?? '—'}</span>
            </div>
            {sealedRecord.notes_out && (
              <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--color-ink-secondary)' }}>
                {sealedRecord.notes_out}
              </div>
            )}
            {sealedRecord.issues_reported && (
              <div style={{ padding: '8px 0', fontSize: 13, color: 'var(--color-amber)', borderTop: '1px solid var(--color-border)', marginTop: 4 }}>
                Issue: {sealedRecord.issues_reported}
              </div>
            )}
            {/* Check-out photos */}
            {(sealedRecord.photos_out ?? []).length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 8 }}>
                {(sealedRecord.photos_out ?? []).map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={p.url} alt={`Check-out photo ${i + 1}`}
                    style={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ACTIVE (checked in, end-of-day check-out) ─────────────────────── */}
      {status === 'active' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, color: 'var(--color-ink-secondary)', fontSize: 13 }}>
            <Clock size={14} />
            Checked in at {sealedRecord?.check_in_at ? formatTime(sealedRecord.check_in_at) : '—'}
          </div>

          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>End-of-day vessel condition</h2>

          <div style={sty.card}>
            <label style={sty.label}>Fuel level on return</label>
            <div style={sty.fuelGrid}>
              {FUEL_LEVELS.map(f => (
                <button key={f} onClick={() => setFuelLevel(f)} style={sty.fuelBtn(fuelLevel === f)}>{f}</button>
              ))}
            </div>
          </div>

          <div style={sty.card}>
            <label style={sty.label}>Notes (optional)</label>
            <textarea style={sty.textarea} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Condition, observations..." />
          </div>

          <PhotoWidget />

          <div style={sty.card}>
            <label style={{ ...sty.label, marginBottom: 10 }}>Any issues to report?</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[false, true].map(v => (
                <button key={String(v)} onClick={() => setHasIssues(v)} style={{
                  flex: 1, padding: '10px', fontSize: 13,
                  border: hasIssues === v ? '2px solid var(--color-rust)' : '1px solid var(--color-border)',
                  background: hasIssues === v ? 'var(--color-rust)' : 'var(--color-bone)',
                  color: hasIssues === v ? '#fff' : 'var(--color-ink)',
                  fontWeight: hasIssues === v ? 700 : 400,
                  cursor: 'pointer',
                }}>{v ? 'Yes' : 'No'}</button>
              ))}
            </div>
            {hasIssues && (
              <textarea
                style={{ ...sty.textarea, marginTop: 10 }}
                value={issues}
                onChange={e => setIssues(e.target.value)}
                placeholder="Describe the issue..."
              />
            )}
          </div>

          {error && <div style={sty.errorBox}>{error}</div>}
          <button disabled={submitting} style={sty.btn(submitting)} onClick={submitCheckOut}>
            {submitting ? 'Sealing...' : 'Seal Day Record'}
          </button>
        </div>
      )}

      {/* ── PENDING (start-of-day check-in) ───────────────────────────────── */}
      {status === 'pending' && (
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Vessel condition at start of day</h2>
          <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)', marginBottom: 20 }}>
            Please confirm the vessel is in good condition before you depart.
            This record is sealed and timestamped.
          </p>

          <div style={sty.card}>
            <label style={sty.label}>Current fuel level</label>
            <div style={sty.fuelGrid}>
              {FUEL_LEVELS.map(f => (
                <button key={f} onClick={() => setFuelLevel(f)} style={sty.fuelBtn(fuelLevel === f)}>{f}</button>
              ))}
            </div>
          </div>

          <div style={sty.card}>
            <label style={sty.label}>Notes (optional)</label>
            <textarea style={sty.textarea} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any observations at start of day..." />
          </div>

          <PhotoWidget />

          {error && <div style={sty.errorBox}>{error}</div>}
          <button disabled={submitting} style={sty.btn(submitting)} onClick={submitCheckIn}>
            {submitting ? 'Confirming...' : 'Confirm Vessel Condition'}
          </button>
        </div>
      )}
    </div>
  )
}
