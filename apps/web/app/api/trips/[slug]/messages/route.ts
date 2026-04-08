import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/security/rate-limit'
import { requireOperator } from '@/lib/security/auth'
import { z } from 'zod'

const messageSchema = z.object({
  body: z.string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message too long')
    .transform(s => s.trim()),
  senderType: z.enum(['guest', 'captain', 'operator', 'system']),
  senderName: z.string().min(1).max(100).transform(s => s.trim()),
  senderId: z.string().min(1).max(100),
  chipKey: z.string().max(50).nullable().optional(),
  isQuickChip: z.boolean().optional().default(false),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: tripId } = await params

  if (!/^[0-9a-f-]{36}$/.test(tripId)) {
    return NextResponse.json(
      { error: 'Invalid trip ID' }, { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = messageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid message', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const data = parsed.data
  const supabase = createServiceClient()

  // Operator/captain messages require auth
  if (data.senderType === 'captain' || data.senderType === 'operator') {
    try {
      const { operator } = await requireOperator()
      const { data: trip } = await supabase
        .from('trips')
        .select('id, operator_id')
        .eq('id', tripId)
        .eq('operator_id', operator.id)
        .single()
      if (!trip) {
        return NextResponse.json(
          { error: 'Trip not found' }, { status: 404 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorised' }, { status: 401 }
      )
    }
  }

  // Guest messages: verify guest belongs to trip + rate limit
  if (data.senderType === 'guest') {
    const limited = await rateLimit(req, {
      max: 20, window: 3600,
      key: `chat:guest:${data.senderId}:${tripId}`,
    })
    if (limited.blocked) {
      return NextResponse.json(
        { error: 'Too many messages. Try again later.' },
        { status: 429 }
      )
    }

    const { data: guest } = await supabase
      .from('guests')
      .select('id, trip_id')
      .eq('id', data.senderId)
      .eq('trip_id', tripId)
      .is('deleted_at', null)
      .single()

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found' }, { status: 404 }
      )
    }
  }

  // Verify trip exists and is not completed/cancelled
  const { data: trip } = await supabase
    .from('trips')
    .select('id, status, operator_id')
    .eq('id', tripId)
    .single()

  if (!trip) {
    return NextResponse.json(
      { error: 'Trip not found' }, { status: 404 }
    )
  }

  if (trip.status === 'completed' || trip.status === 'cancelled') {
    return NextResponse.json(
      { error: 'Chat is closed for this trip' },
      { status: 409 }
    )
  }

  // Insert message
  const { data: message, error } = await supabase
    .from('trip_messages')
    .insert({
      trip_id: tripId,
      operator_id: trip.operator_id,
      guest_id: data.senderType === 'guest' ? data.senderId : null,
      sender_type: data.senderType,
      sender_name: data.senderName,
      body: data.body,
      is_quick_chip: data.isQuickChip,
      chip_key: data.chipKey ?? null,
    })
    .select('id, created_at')
    .single()

  if (error || !message) {
    console.error('[chat:send]', error?.code)
    return NextResponse.json(
      { error: 'Failed to send message' }, { status: 500 }
    )
  }

  // Notify operator of guest messages (non-blocking)
  if (data.senderType === 'guest') {
    void (async () => {
      await supabase.from('operator_notifications').insert({
        operator_id: trip.operator_id,
        type: 'chat_message',
        title: '💬 New message',
        body: `${data.senderName}: "${data.body.slice(0, 60)}${data.body.length > 60 ? '…' : ''}"`,
        data: { tripId, messageId: message.id },
      })
    })()
  }

  return NextResponse.json({
    data: { id: message.id, createdAt: message.created_at }
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug: tripId } = await params

  const limited = await rateLimit(req, {
    max: 60, window: 60,
    key: `chat:history:${tripId}`,
  })
  if (limited.blocked) {
    return NextResponse.json(
      { error: 'Too many requests' }, { status: 429 }
    )
  }

  const url = new URL(req.url)
  const guestId = url.searchParams.get('guestId')

  const supabase = createServiceClient()

  if (guestId) {
    const { data: guest } = await supabase
      .from('guests')
      .select('id')
      .eq('id', guestId)
      .eq('trip_id', tripId)
      .is('deleted_at', null)
      .single()
    if (!guest) {
      return NextResponse.json(
        { error: 'Not found' }, { status: 404 }
      )
    }
  } else {
    try {
      const { operator } = await requireOperator()
      const { data: trip } = await supabase
        .from('trips')
        .select('id')
        .eq('id', tripId)
        .eq('operator_id', operator.id)
        .single()
      if (!trip) {
        return NextResponse.json(
          { error: 'Not found' }, { status: 404 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Unauthorised' }, { status: 401 }
      )
    }
  }

  const { data: messages } = await supabase
    .from('trip_messages')
    .select('*')
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(100)

  return NextResponse.json({ data: messages ?? [] })
}
