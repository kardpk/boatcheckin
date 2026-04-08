import 'server-only'
import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase/service'

// Init VAPID (idempotent — safe to call repeatedly)
let vapidInitialised = false
function initVapid() {
  if (vapidInitialised) return
  const pubKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privKey = process.env.VAPID_PRIVATE_KEY
  if (!pubKey || !privKey) return
  webpush.setVapidDetails(
    'mailto:hello@dockpass.io',
    pubKey,
    privKey
  )
  vapidInitialised = true
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string        // Replaces previous notification with same tag
}

// Send push to a single subscription
export async function sendPush(
  subscription: PushSubscription | object,
  payload: PushPayload
): Promise<void> {
  initVapid()
  if (!vapidInitialised) {
    console.warn('[push] VAPID keys not set — skipping push')
    return
  }

  try {
    await webpush.sendNotification(
      subscription as any,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon ?? '/icons/icon-192.png',
        badge: '/icons/badge-72.png',
        tag: payload.tag,
        data: { url: payload.url ?? '/' },
      })
    )
  } catch (err: any) {
    // 410 Gone = subscription expired
    // 404 Not Found = invalid subscription
    if (err.statusCode === 410 || err.statusCode === 404) {
      // Mark subscription as invalid in DB (non-blocking)
      removeExpiredPushSubscription(subscription).catch(() => null)
    }
    // Never throw — push failure is non-critical
  }
}

// Send push to ALL guests on a trip
export async function sendPushToAllGuests(
  tripId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  const supabase = createServiceClient()

  const { data: guests } = await supabase
    .from('guests')
    .select('id, push_subscription')
    .eq('trip_id', tripId)
    .is('deleted_at', null)
    .not('push_subscription', 'is', null)

  if (!guests || guests.length === 0) {
    return { sent: 0, failed: 0 }
  }

  let sent = 0
  let failed = 0

  await Promise.allSettled(
    guests.map(async guest => {
      if (!guest.push_subscription) return
      try {
        await sendPush(guest.push_subscription, payload)
        sent++
      } catch {
        failed++
      }
    })
  )

  return { sent, failed }
}

async function removeExpiredPushSubscription(
  subscription: object
): Promise<void> {
  const supabase = createServiceClient()
  // Find and clear the subscription from the guest record
  await supabase
    .from('guests')
    .update({ push_subscription: null })
    // In actual implementation we might need a stored serialized string or JSONB compare if exact struct isn't matched
    .eq('push_subscription', subscription)
}
