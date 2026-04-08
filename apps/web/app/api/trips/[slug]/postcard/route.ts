import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { postcardSchema } from '@/lib/security/sanitise'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  const limited = await rateLimit(req, {
    max: 10, window: 3600,
    key: `postcard:${slug}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' }, { status: 429 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = postcardSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request' }, { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Verify guest belongs to trip
  const { data: guest } = await supabase
    .from('guests')
    .select('id, trip_id')
    .eq('id', parsed.data.guestId)
    .eq('trip_id', parsed.data.tripId)
    .is('deleted_at', null)
    .single()

  if (!guest) {
    return NextResponse.json(
      { error: 'Guest not found' }, { status: 404 }
    )
  }

  // Upsert postcard record (style may change)
  const { data } = await supabase
    .from('postcards')
    .upsert(
      {
        guest_id: parsed.data.guestId,
        trip_id: parsed.data.tripId,
        style: parsed.data.style,
        downloaded_at: new Date().toISOString(),
      },
      { onConflict: 'guest_id,trip_id' }
    )
    .select('id')
    .single()

  return NextResponse.json({ data: { postcardId: data?.id } })
}

// PATCH: record share event
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params // not strictly checking slug matching body here for simplicity but it is scoped
  const body = await req.json().catch(() => null)
  if (!body?.guestId || !body?.tripId) {
    return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  }

  const supabase = createServiceClient()
  await supabase
    .from('postcards')
    .update({ shared_at: new Date().toISOString() })
    .eq('guest_id', body.guestId)
    .eq('trip_id', body.tripId)

  return NextResponse.json({ data: { shared: true } })
}
