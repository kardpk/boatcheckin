import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

/**
 * BoatCheckin Proxy (Next.js 16 — replaces middleware.ts)
 * Handles: Auth guard, CSP, security headers, CORS, request size limits
 * IMPORTANT: Must export `proxy` (not `middleware`) for Next.js 16 Turbopack.
 */
export async function proxy(request: NextRequest) {
  try {
    const WEBHOOK_PATHS = [
      '/api/webhooks/stripe',
      '/api/webhooks/buoy',
      '/api/webhooks/tint',
    ]

    const ALLOWED_ORIGINS = [
      'https://boatcheckin.com',
      'https://www.boatcheckin.com',
      'http://localhost:3000',
    ]

    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://api.mapbox.com https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
      "font-src 'self' https://fonts.gstatic.com",
      [
        "connect-src 'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://api.open-meteo.com',
        'https://api.mapbox.com',
        'https://events.mapbox.com',
        'https://api.stripe.com',
        'https://api.resend.com',
        'https://api.twilio.com',
        'https://api.apify.com',
        'https://api.buoy.insure',
        'https://challenges.cloudflare.com',
      ].join(' '),
      "worker-src 'self' blob:",
      'frame-src https://js.stripe.com https://hooks.stripe.com https://challenges.cloudflare.com',
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')

    const AUTH_PATHS = ['/login', '/signup', '/forgot-password']

    const { pathname } = request.nextUrl
    const origin = request.headers.get('origin') ?? ''
    const isWebhook = WEBHOOK_PATHS.some((p) => pathname.startsWith(p))

    // Reject requests over 10MB
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return new NextResponse('Request too large', { status: 413 })
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      const preflightHeaders = new Headers()
      preflightHeaders.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      preflightHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature')
      if (isWebhook) {
        preflightHeaders.set('Access-Control-Allow-Origin', '*')
      } else if (ALLOWED_ORIGINS.includes(origin)) {
        preflightHeaders.set('Access-Control-Allow-Origin', origin)
      }
      return new NextResponse(null, { status: 200, headers: preflightHeaders })
    }

    // Build mutable response for Supabase cookie refresh
    let response = NextResponse.next({ request: { headers: request.headers } })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

    // Only run auth logic if env vars are present
    if (supabaseUrl && supabaseKey) {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      })

      const { data: { user } } = await supabase.auth.getUser()

      // Dashboard / admin auth guard
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
        if (!user) {
          const loginUrl = new URL('/login', request.url)
          loginUrl.searchParams.set('next', pathname)
          return NextResponse.redirect(loginUrl)
        }
      }

      // Redirect logged-in users away from auth pages
      if (user && AUTH_PATHS.includes(pathname)) {
        if (!request.nextUrl.searchParams.has('error')) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }

    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)')
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    response.headers.set('Content-Security-Policy', csp)

    // CORS headers
    if (isWebhook) {
      response.headers.set('Access-Control-Allow-Origin', '*')
    } else if (ALLOWED_ORIGINS.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
      response.headers.set('Vary', 'Origin')
    }
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature')

    return response
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|security.txt|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)',
  ],
}
