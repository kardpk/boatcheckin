import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { auditLog } from '@/lib/security/audit'
import { z } from 'zod'

/**
 * POST /api/trips/[slug]/rental-days/[day]/upload-photo
 *
 * Uploads a condition photo to Supabase Storage (condition-photos bucket).
 * Called by the photo widget in DayConditionClient before check-in/out submit.
 * Mirrors the upload-fwc pattern exactly.
 *
 * Form fields:
 *   file    : File (JPEG/PNG/WebP, max 10MB — client compresses to <1.5MB first)
 *   guestId : UUID
 *   phase   : 'in' | 'out'
 *
 * Returns: { data: { url: string, path: string } }
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024  // 10MB (client compresses to ~1MB)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_PHOTOS_PER_PHASE = 3

const guestIdSchema = z.string().uuid()
const phaseSchema   = z.enum(['in', 'out'])

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; day: string }> }
) {
  const { slug, day: dayStr } = await params
  const dayNumber = parseInt(dayStr, 10)

  if (isNaN(dayNumber) || dayNumber < 1) {
    return NextResponse.json({ error: 'Invalid day number' }, { status: 400 })
  }

  const ip =
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    'unknown'

  // Rate limit: 10 uploads per IP per 10 minutes
  const limited = await rateLimit(req, {
    max: 10,
    window: 600,
    key: `upload-condition-photo:${ip}`,
  })
  if (limited.blocked) {
    return NextResponse.json({ error: 'Too many uploads. Try again later.' }, { status: 429 })
  }

  const formData = await req.formData().catch(() => null)
  if (!formData) return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })

  const file    = formData.get('file')    as File | null
  const rawGuestId = formData.get('guestId') as string | null
  const rawPhase   = formData.get('phase')   as string | null

  if (!file)    return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const parsedGuest = guestIdSchema.safeParse(rawGuestId)
  if (!parsedGuest.success) return NextResponse.json({ error: 'Invalid guestId' }, { status: 400 })

  const parsedPhase = phaseSchema.safeParse(rawPhase)
  if (!parsedPhase.success) return NextResponse.json({ error: 'Invalid phase (must be "in" or "out")' }, { status: 400 })

  const guestId = parsedGuest.data
  const phase   = parsedPhase.data

  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 })
  }
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum is 10 MB.' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify guest belongs to this trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id')
    .eq('id', guestId)
    .is('deleted_at', null)
    .single()

  if (!guest) return NextResponse.json({ error: 'Guest not found' }, { status: 404 })

  const { data: trip } = await supabase
    .from('trips')
    .select('id')
    .eq('id', guest.trip_id)
    .eq('slug', slug)
    .single()

  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  // Fetch rental day to check photo count
  const { data: rentalDay } = await supabase
    .from('rental_days')
    .select('id, status, photos_in, photos_out')
    .eq('trip_id', trip.id)
    .eq('day_number', dayNumber)
    .single()

  if (!rentalDay) return NextResponse.json({ error: 'Day record not found' }, { status: 404 })

  // Check photo count limit
  const existingPhotos = (phase === 'in'
    ? (rentalDay.photos_in as unknown[]) ?? []
    : (rentalDay.photos_out as unknown[]) ?? []
  )
  if (existingPhotos.length >= MAX_PHOTOS_PER_PHASE) {
    return NextResponse.json(
      { error: `Maximum ${MAX_PHOTOS_PER_PHASE} photos per phase allowed.` },
      { status: 400 }
    )
  }

  // Storage path: condition-photos/{trip_id}/{day_number}/{phase}/{timestamp}_{uuid}.jpg
  const ext      = (['image/png', 'image/webp'].includes(file.type) ? file.type.split('/')[1] : 'jpg')
  const fileName = `${trip.id}/${dayNumber}/${phase}/${Date.now()}_${crypto.randomUUID()}.${ext}`
  const buffer   = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from('condition-photos')
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload-condition-photo] storage error:', uploadError)
    return NextResponse.json({ error: 'Upload failed. Please try again.' }, { status: 500 })
  }

  // Generate signed URL (1 hour) — bucket is private
  const { data: signedData } = await supabase.storage
    .from('condition-photos')
    .createSignedUrl(fileName, 3600)

  const signedUrl = signedData?.signedUrl ?? null

  auditLog({
    action: 'condition_photo_upload',
    actorType: 'guest',
    actorIdentifier: guestId,
    entityType: 'rental_day',
    entityId: rentalDay.id,
    changes: { dayNumber, phase, path: fileName },
  })

  return NextResponse.json({
    data: {
      url:  signedUrl ?? fileName,  // fallback to path if signed URL fails
      path: fileName,
    },
  })
}
