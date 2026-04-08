import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/security/rate-limit'
import { getTripPageData } from '@/lib/trip/getTripPageData'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params

  // Rate limit: 60 requests per minute per IP
  const limited = await rateLimit(req, {
    max: 60,
    window: 60,
    key: `trip:public:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    )
  }

  // Validate slug format (prevents path traversal)
  if (!/^[A-Za-z0-9_-]{16,30}$/.test(slug)) {
    return NextResponse.json({ error: 'Invalid trip' }, { status: 400 })
  }

  const result = await getTripPageData(slug)

  if (!result.found) {
    return NextResponse.json(
      {
        error:
          result.reason === 'cancelled'
            ? 'This trip has been cancelled'
            : 'Trip not found',
      },
      { status: 404 },
    )
  }

  // Only return fields safe for public consumption
  // Never expose operator.id or waiver_text
  return NextResponse.json({
    data: {
      id: result.data.id,
      status: result.data.status,
      guestCount: result.data.guestCount,
      isFull: result.data.isFull,
      maxGuests: result.data.maxGuests,
      startedAt: result.data.startedAt,
    },
  })
}
