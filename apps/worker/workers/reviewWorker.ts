import { Worker } from 'bullmq'
import type { ReviewRequestJob } from '../queues'
import { createServiceClient } from '../../web/lib/supabase/service'
import { sendReviewRequestEmail } from '../../web/lib/notifications/email'

export function startReviewWorker(
  connection: import('ioredis').default
) {
  return new Worker<ReviewRequestJob>(
    'review-requests',
    async (job) => {
      const { tripId, tripSlug, boatName, captainName } = job.data
      const supabase = createServiceClient()

      // Fetch all guests for this trip who have email
      // and haven't been sent a review request yet
      const { data: guests } = await supabase
        .from('guests')
        .select('id, full_name, email, language_preference')
        .eq('trip_id', tripId)
        .is('deleted_at', null)
        .is('review_requested_at', null)
        .not('email', 'is', null)

      if (!guests || guests.length === 0) {
        console.log(`[review-worker] no eligible guests for trip ${tripId}`)
        return
      }

      let sent = 0
      for (const guest of guests) {
        if (!guest.email) continue

        try {
          await sendReviewRequestEmail({
            to: guest.email,
            guestName: guest.full_name,
            language: guest.language_preference ?? 'en',
            boatName,
            captainName: captainName ?? 'your captain',
            tripSlug,
          })

          // Mark as sent
          await supabase
            .from('guests')
            .update({
              review_requested_at: new Date().toISOString(),
            })
            .eq('id', guest.id)

          sent++
        } catch (err) {
          console.error(`[review-worker] email failed for ${guest.id}:`, err)
        }
      }

      console.log(`[review-worker] sent ${sent} review requests for trip ${tripId}`)
    },
    { connection, concurrency: 2 }
  )
}
