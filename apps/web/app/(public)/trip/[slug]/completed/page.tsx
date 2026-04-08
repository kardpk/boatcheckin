import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { PostTripView } from '@/components/post-trip/PostTripView'

export default async function CompletedTripPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const host = (await headers()).get('host') || 'localhost:3000'
  const baseUrl = `${protocol}://${host}`

  // Fetch the combined post-trip data from our internal API
  const res = await fetch(`${baseUrl}/api/trips/${slug}/post-trip`, {
    cache: 'no-store' // Avoid caching dynamic trip state
  })

  // If active/upcoming, the API returns 404, so we redirect them to live trip page
  if (res.status === 404) {
    redirect(`/trip/${slug}`)
  }

  if (!res.ok) {
    notFound()
  }

  const { data } = await res.json()

  return <PostTripView data={data} />
}
