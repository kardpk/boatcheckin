import 'server-only'

import { NextRequest, NextResponse } from 'next/server'
import { requireOperator } from '@/lib/security/auth'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * GET /api/dashboard/reviews
 * Returns all trip reviews for the authenticated operator.
 */
export async function GET(req: NextRequest) {
  void req
  const { operator } = await requireOperator()
  const supabase = createServiceClient()

  const { data, error } = await supabase
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
