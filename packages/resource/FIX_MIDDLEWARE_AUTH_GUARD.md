# Agent Task — Fix Critical Gap: Middleware Auth Guard
**File:** `apps/web/middleware.ts`  
**Priority:** CRITICAL  
**Scope:** Create Next.js edge middleware to enforce authentication on all `/dashboard/*` routes and add security headers to all responses. Do not modify any existing files except where explicitly instructed below.

---

## Context & Why This Matters

Currently, dashboard route protection relies entirely on each individual page or API route calling `requireOperator()` manually. If any future page is added to `/dashboard/*` without that call — or if an existing one is missed — it becomes publicly accessible with zero protection.

The fix is a single `middleware.ts` file at `apps/web/middleware.ts` that intercepts **every** request at the Vercel Edge before it reaches any page or API route. This is a defence-in-depth layer — `requireOperator()` calls in individual routes remain in place. Middleware is an additional backstop, not a replacement.

---

## Pre-Task Checklist

Before writing a single line of code, verify the following:

1. **Confirm no `middleware.ts` already exists** at `apps/web/middleware.ts`. If one exists, read it in full before proceeding — do not overwrite blindly.
2. **Confirm the Supabase SSR package version** by reading `apps/web/package.json`. The import path for `createServerClient` differs between `@supabase/ssr` versions. Use whatever is already installed — do not add or upgrade packages.
3. **Read `apps/web/lib/security/auth.ts`** in full. The middleware must use the same cookie-reading pattern as `requireOperator()` to avoid session mismatches.
4. **Read `apps/web/app/(auth)/login/page.tsx`** to confirm the exact login path (expected: `/login`). Use that path — do not hardcode a different one.
5. **Read `apps/web/app/layout.tsx`** to confirm the root layout does not already perform a redirect that would conflict.

---

## Task: Create `apps/web/middleware.ts`

### Exact Responsibility of This File

1. **Auth guard** — For any request whose pathname starts with `/dashboard`, verify the user has a valid Supabase session. If not, redirect to `/login` with a `next` query param set to the original URL so the operator is returned there after login.
2. **Security headers** — Apply security response headers to every non-static request. This is defined in `SECURITY.md §8` and must be implemented here rather than in individual routes.
3. **Pass through everything else** — All public routes (`/trip/*`, `/snapshot/*`), auth routes (`/login`, `/signup`, `/forgot-password`), and all API routes (`/api/*`) must pass through unmodified. The middleware must not interfere with any existing auth logic on API routes — those use `requireOperator()` which runs server-side after the edge and remains the authoritative API auth layer.

### Implementation

Create `apps/web/middleware.ts` with the following exact logic:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── 1. Create a mutable response so we can set cookies ───────────────────
  // Supabase SSR requires we pass the response through so it can
  // refresh the session token if it is close to expiry.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // ─── 2. Build Supabase client for edge (cookie-based, no DB calls) ─────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ─── 3. Refresh session (MUST be called before any auth check) ────────────
  // This refreshes an expired Access Token using the Refresh Token.
  // Do NOT destructure user out of getUser here — always call getUser()
  // separately to get a verified user (not the potentially-stale JWT).
  const { data: { user } } = await supabase.auth.getUser()

  // ─── 4. Dashboard auth guard ──────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      // Preserve the intended destination so we can redirect back after login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ─── 5. Redirect authenticated operators away from auth pages ────────────
  // If a logged-in operator navigates to /login or /signup, send them home.
  const authPaths = ['/login', '/signup', '/forgot-password']
  if (user && authPaths.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // ─── 6. Apply security headers to all responses ───────────────────────────
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(self)'
  )
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js App Router requires unsafe-eval in dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.open-meteo.com https://challenges.cloudflare.com",
      "frame-src https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
    ].join('; ')
  )

  return response
}

// ─── Matcher: which paths this middleware runs on ─────────────────────────────
// Exclude static assets, image optimisation routes, and the favicon.
// Include everything else — middleware is cheap (no DB) and headers benefit all routes.
export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static chunks)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - public directory files (png, jpg, svg, webp, ico, mp4)
     *
     * This regex is the Next.js recommended pattern.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4)$).*)',
  ],
}
```

---

## Post-Implementation: Update `requireOperator()` Return Type

After creating the middleware, open `apps/web/lib/security/auth.ts` and make one small change.

**Find** the existing `requireOperator()` function. It currently redirects to `/login` with no `next` param. Update its redirect to also pass the `next` param so that if someone somehow bypasses the edge middleware (e.g. a direct server-component call in a future route), the post-login redirect still works correctly.

**Change:**
```typescript
redirect('/login')
```

**To:**
```typescript
// Import headers at the top of the file if not already imported:
import { headers } from 'next/headers'

// Inside requireOperator(), replace the redirect call:
const headersList = headers()
const pathname = headersList.get('x-invoke-path') ?? '/dashboard'
redirect(`/login?next=${encodeURIComponent(pathname)}`)
```

> **Note:** `x-invoke-path` is available in Next.js App Router server components. If it returns null, the fallback `/dashboard` is safe and correct.

---

## Post-Implementation: Update `/login` Page to Handle `next` Redirect

Open `apps/web/app/(auth)/login/page.tsx`.

After a successful login, read the `next` query param from `searchParams` and redirect to it. This closes the loop so operators land where they intended.

**Find** the successful login handler (likely a `signInWithPassword` call followed by a `router.push` or `redirect`).

**Replace** the hardcoded `/dashboard` redirect with:

```typescript
// Read next param — must be validated to prevent open redirect
const nextPath = searchParams?.next
const safePath =
  nextPath && nextPath.startsWith('/dashboard')
    ? nextPath
    : '/dashboard'

router.push(safePath)
// or if using server redirect: redirect(safePath)
```

**Critical:** Only allow `next` values that start with `/dashboard`. Never redirect to an arbitrary URL from `next`. This prevents open redirect attacks.

---

## Invariants — Do Not Violate These

| Rule | Reason |
|---|---|
| Never read `session` from `getSession()` in middleware for auth checks | `getSession()` reads the JWT from the cookie without re-validating it server-side. Use `getUser()` which calls Supabase Auth server to verify. |
| Never block `/api/*` routes in middleware | API routes have their own auth via `requireOperator()`. Blocking at the edge before the route runs would break the `requireOperator()` redirect logic and return an HTML redirect instead of a `401 JSON`. |
| Never hardcode `/dashboard` as the only protected prefix | If a new protected section is added (e.g. `/admin`, `/settings`), the matcher and auth guard must be updated. Today the only protected prefix is `/dashboard`. |
| The `setAll` cookie handler must reassign `response` | If you skip reassigning `response` inside `setAll`, the refreshed session cookie will not be sent back to the browser and operators will be logged out on every page load. |
| The matcher must exclude `_next/static` | If static chunks hit the middleware, it creates an auth check on every JS bundle load, degrading performance significantly. |

---

## Verification Checklist

After implementation, manually verify each of the following before marking this task done:

```
□ Visit /dashboard while logged out → redirected to /login?next=/dashboard
□ Visit /dashboard/trips while logged out → redirected to /login?next=/dashboard/trips
□ Log in → redirected back to /dashboard/trips (not always /dashboard)
□ Visit /trip/[any-valid-slug] while logged out → page loads normally (not redirected)
□ Visit /snapshot/[any-valid-token] while logged out → page loads normally
□ Visit /login while logged in → redirected to /dashboard
□ Visit /api/dashboard/trips while logged out → returns 401 JSON (not an HTML redirect page)
□ Response headers on /dashboard include X-Frame-Options: DENY
□ Response headers on /trip/[slug] include X-Frame-Options: DENY
□ TypeScript compiles with no errors: run `tsc --noEmit` in apps/web/
□ No new ESLint errors introduced
```

---

## What This Fix Does NOT Cover

The following gaps are out of scope for this task and will be addressed separately:

- **GAP 3** — Missing `email` column on `guests` table (separate migration task)
- **GAP 10** — Captain token expiry (separate security hardening task)
- **GAP 11** — Email provider wiring (scheduled for tonight)
- **GAP 12/14** — Overly permissive RLS on addon orders and postcards (separate DB task)

Do not touch any of these areas in this task.

---

## Files Modified by This Task

| File | Action |
|---|---|
| `apps/web/middleware.ts` | **CREATE** — primary deliverable |
| `apps/web/lib/security/auth.ts` | **EDIT** — add `next` param to redirect |
| `apps/web/app/(auth)/login/page.tsx` | **EDIT** — honour `next` param on success, validate it |

No database migrations. No new dependencies. No environment variable changes.
