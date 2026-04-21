'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Anchor, Camera, X, ImagePlus, CheckCircle } from 'lucide-react'

const FUEL_LEVELS = ['full', '3/4', '1/2', '1/4', 'empty'] as const
const MAX_PHOTOS  = 6

interface PhotoRecord { url: string; path: string }

interface Props {
  slug:         string
  tripSlug:     string
  guestId:      string
  boatName:     string
  marinaName:   string
  slipNumber:   string | null
  operatorName: string
  returnDate:   string
  durationDays: number
}

// ── Client-side compression (mirrors DayConditionClient) ─────────────────────
async function compressImage(file: File, maxPx = 1200, quality = 0.85): Promise<Blob> {
  if (typeof window === 'undefined' || !window.createImageBitmap) return file
  try {
    const img   = await createImageBitmap(file)
    const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
    const c     = document.createElement('canvas')
    c.width  = Math.round(img.width  * scale)
    c.height = Math.round(img.height * scale)
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
    return new Promise(res => c.toBlob(b => res(b ?? file), 'image/jpeg', quality))
  } catch { return file }
}

export function ReturnInspectionClient({
  slug, tripSlug, guestId, boatName, marinaName, slipNumber, operatorName, returnDate, durationDays,
}: Props) {
  const router = useRouter()

  const [fuelLevel, setFuelLevel] = useState<typeof FUEL_LEVELS[number] | ''>('')
  const [notes, setNotes]         = useState('')
  const [hasIssues, setHasIssues] = useState(false)
  const [issues, setIssues]       = useState('')
  const [attested, setAttested]   = useState(false)
  const [photos, setPhotos]       = useState<PhotoRecord[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const [sealed, setSealed]       = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Photo upload ──────────────────────────────────────────────────────────
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (photos.length >= MAX_PHOTOS) { setUploadErr(`Max ${MAX_PHOTOS} photos`); return }
    setUploadErr('')
    setUploading(true)

    const compressed = await compressImage(file)
    const fd = new FormData()
    fd.append('file',    new File([compressed], file.name, { type: 'image/jpeg' }))
    fd.append('guestId', guestId)
    fd.append('phase',   'out')  // return = final check-out phase

    // Use day 1 as the upload-photo route's day parameter — any valid day works
    // since we just need the signed URL. Return inspection photos go to trips table.
    const res  = await fetch(`/api/trips/${slug}/rental-days/1/upload-photo`, {
      method: 'POST', body: fd,
    })
    const json = await res.json()
    setUploading(false)
    if (!res.ok) { setUploadErr(json.error ?? 'Upload failed'); return }
    setPhotos(prev => [...prev, { url: json.data.url, path: json.data.path }])
  }

  function removePhoto(i: number) { setPhotos(prev => prev.filter((_, idx) => idx !== i)) }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!attested) { setSubmitErr('Please confirm the attestation above'); return }
    setSubmitting(true)
    setSubmitErr('')

    const res = await fetch(`/api/trips/${slug}/return-inspection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestId,
        notes:          notes.trim() || undefined,
        fuelLevel:      fuelLevel || undefined,
        photoUrls:      photos.length > 0 ? photos.map(p => p.url) : undefined,
        issuesReported: hasIssues ? issues.trim() : undefined,
        attested:       true,
      }),
    })
    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) { setSubmitErr(json.error ?? 'Submission failed'); return }

    setSealed(true)
    // Redirect to completed page after short delay
    setTimeout(() => router.replace(`/trip/${tripSlug}/completed`), 1800)
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const sty = {
    page: {
      minHeight: '100dvh', background: 'var(--color-bone)',
      padding: '24px 16px 64px', fontFamily: 'var(--font-sans)',
    } as React.CSSProperties,
    kicker: { fontSize: 12, color: 'var(--color-ink-secondary)', textTransform: 'uppercase' as const, letterSpacing: '.06em', marginBottom: 4 },
    heading: { fontSize: 22, fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 4px' },
    sub: { fontSize: 14, color: 'var(--color-ink-secondary)', marginBottom: 24 },
    card: { background: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '16px', marginBottom: 12 },
    label: { display: 'block' as const, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '.08em', color: 'var(--color-ink-secondary)', marginBottom: 8, fontWeight: 600 },
    textarea: { width: '100%', border: '1px solid var(--color-border)', padding: '10px 12px', fontSize: 14, resize: 'vertical' as const, minHeight: 80, fontFamily: 'inherit', background: 'var(--color-bone)', outline: 'none', boxSizing: 'border-box' as const },
    fuelGrid: { display: 'grid' as const, gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 },
    fuelBtn: (a: boolean) => ({ padding: '8px 4px', fontSize: 12, fontWeight: a ? 700 : 400, border: a ? '2px solid var(--color-rust)' : '1px solid var(--color-border)', background: a ? 'var(--color-rust)' : 'var(--color-bone)', color: a ? '#fff' : 'var(--color-ink)', cursor: 'pointer' }),
    btn: (d = false) => ({ width: '100%', padding: '14px', background: d ? 'var(--color-ink-faint)' : 'var(--color-ink)', color: d ? 'var(--color-ink-secondary)' : 'var(--color-bone)', fontWeight: 700, fontSize: 14, border: 'none', cursor: d ? 'default' : 'pointer', letterSpacing: '.04em', textTransform: 'uppercase' as const, marginTop: 16 }),
    errorBox: { background: 'rgba(180,40,20,.08)', border: '1px solid rgba(180,40,20,.3)', padding: '10px 14px', fontSize: 13, color: '#b42814', marginTop: 8 },
  }

  const formattedReturn = (() => {
    try { return new Date(returnDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) }
    catch { return returnDate }
  })()

  // ── Sealed success state ──────────────────────────────────────────────────
  if (sealed) {
    return (
      <div style={{ ...sty.page, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <CheckCircle size={44} strokeWidth={1.5} style={{ color: 'var(--color-green)', marginBottom: 16 }} />
        <h1 style={sty.heading}>Return record sealed</h1>
        <p style={sty.sub}>Redirecting to your trip summary…</p>
      </div>
    )
  }

  return (
    <div style={sty.page}>
      <p style={sty.kicker}>
        <Anchor size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
        {boatName} · {marinaName}{slipNumber ? ` · Slip ${slipNumber}` : ''}
      </p>
      <h1 style={sty.heading}>Return vessel condition</h1>
      <p style={sty.sub}>{formattedReturn} · {durationDays}-day rental · {operatorName}</p>

      <p style={{ fontSize: 13, color: 'var(--color-ink-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
        Please document the vessel condition on return.
        This record is timestamped, sealed, and kept for{' '}
        <strong style={{ color: 'var(--color-ink)' }}>five years</strong>.
      </p>

      {/* Fuel */}
      <div style={sty.card}>
        <label style={sty.label}>Fuel level on return</label>
        <div style={sty.fuelGrid}>
          {FUEL_LEVELS.map(f => (
            <button key={f} onClick={() => setFuelLevel(f)} style={sty.fuelBtn(fuelLevel === f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div style={sty.card}>
        <label style={sty.label}>Condition notes (optional)</label>
        <textarea style={sty.textarea} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Overall condition of the vessel on return…" />
      </div>

      {/* Photos */}
      <div style={sty.card}>
        <label style={sty.label}>Return condition photos (optional · max {MAX_PHOTOS})</label>
        {photos.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative', width: 64, height: 64 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Photo ${i + 1}`} style={{ width: 64, height: 64, objectFit: 'cover', border: '1px solid var(--color-border)' }} />
                <button onClick={() => removePhoto(i)} style={{ position: 'absolute', top: -6, right: -6, background: 'var(--color-ink)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 }}>
                  <X size={10} color="#fff" />
                </button>
              </div>
            ))}
            {uploading && (
              <div style={{ width: 64, height: 64, background: 'var(--color-ink-faint)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={20} color="var(--color-ink-secondary)" />
              </div>
            )}
          </div>
        )}
        {photos.length < MAX_PHOTOS && !uploading && (
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', border: '1px dashed var(--color-border)', background: 'var(--color-bone)', color: 'var(--color-ink-secondary)', fontSize: 13, cursor: 'pointer', width: '100%' }}>
            <ImagePlus size={14} strokeWidth={1.5} />
            {photos.length === 0 ? 'Add return photos' : `Add another (${photos.length}/${MAX_PHOTOS})`}
          </button>
        )}
        {uploadErr && <p style={{ fontSize: 12, color: '#b42814', marginTop: 6 }}>{uploadErr}</p>}
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
      </div>

      {/* Issues */}
      <div style={sty.card}>
        <label style={{ ...sty.label, marginBottom: 10 }}>Any damage or issues to report?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {[false, true].map(v => (
            <button key={String(v)} onClick={() => setHasIssues(v)} style={{ flex: 1, padding: '10px', fontSize: 13, border: hasIssues === v ? '2px solid var(--color-rust)' : '1px solid var(--color-border)', background: hasIssues === v ? 'var(--color-rust)' : 'var(--color-bone)', color: hasIssues === v ? '#fff' : 'var(--color-ink)', fontWeight: hasIssues === v ? 700 : 400, cursor: 'pointer' }}>
              {v ? 'Yes' : 'No'}
            </button>
          ))}
        </div>
        {hasIssues && (
          <textarea style={{ ...sty.textarea, marginTop: 10 }} value={issues} onChange={e => setIssues(e.target.value)} placeholder="Describe the damage or issue…" />
        )}
      </div>

      {/* Attestation */}
      <div style={{ ...sty.card, background: attested ? 'rgba(0,0,0,.03)' : 'var(--color-surface)' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={attested}
            onChange={e => setAttested(e.target.checked)}
            style={{ marginTop: 2, accentColor: 'var(--color-ink)', width: 16, height: 16, flexShrink: 0 }}
          />
          <span style={{ fontSize: 13, color: 'var(--color-ink)', lineHeight: 1.5 }}>
            I confirm this accurately reflects the vessel condition on return.
            I understand this record is sealed and timestamped.
          </span>
        </label>
      </div>

      {submitErr && <div style={sty.errorBox}>{submitErr}</div>}
      <button
        disabled={submitting || !attested}
        style={sty.btn(submitting || !attested)}
        onClick={handleSubmit}
      >
        {submitting ? 'Sealing…' : 'Seal return record'}
      </button>
    </div>
  )
}
