import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { ReviewsDashboardClient } from '@/components/dashboard/ReviewsDashboardClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reviews — BoatCheckin' }

export default async function ReviewsPage() {
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  // All reviews
  const { data: reviews } = await supabase
    .from('trip_reviews')
    .select(`
      id, rating, feedback_text, is_public, platform,
      ai_draft_response, response_posted_at, created_at,
      trips (
        id, slug, trip_date,
        boats ( boat_name )
      ),
      guests ( full_name )
    `)
    .eq('operator_id', operator.id)
    .order('created_at', { ascending: false })
    .limit(100)

  // Boats with review URLs for config section
  const { data: boats } = await supabase
    .from('boats')
    .select('id, boat_name, google_review_url, boatsetter_review_url')
    .eq('operator_id', operator.id)
    .eq('is_active', true)
    .order('boat_name')

  // Compute star distribution
  const rows = reviews ?? []
  const starDist = [1, 2, 3, 4, 5].map(star => ({
    star,
    count: rows.filter(r => r.rating === star).length,
  }))
  const avg = rows.length > 0
    ? Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10
    : null

  return (
    <ReviewsDashboardClient
      reviews={rows as Parameters<typeof ReviewsDashboardClient>[0]['reviews']}
      boats={(boats ?? []) as Parameters<typeof ReviewsDashboardClient>[0]['boats']}
      starDist={starDist}
      avg={avg}
    />
  )
}
