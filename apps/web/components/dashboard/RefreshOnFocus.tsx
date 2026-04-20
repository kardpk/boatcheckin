'use client'

/**
 * RefreshOnFocus
 *
 * Renders nothing. Listens for `visibilitychange` (fires when the user
 * returns to this tab or navigates back to this page in the same tab).
 *
 * If a mutation set `bc:dirty` AFTER this page instance loaded,
 * calls `router.refresh()` to re-run all Server Components and get
 * fresh data — without losing scroll position or client state.
 *
 * Add once to `app/dashboard/layout.tsx` — covers ALL dashboard pages.
 */

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const KEY_DIRTY  = 'bc:dirty'
const KEY_LOADED = 'bc:loaded'

export function RefreshOnFocus() {
  const router  = useRouter()
  const loadedAt = useRef(Date.now())

  // Record this page instance's load time
  useEffect(() => {
    try {
      localStorage.setItem(KEY_LOADED, String(loadedAt.current))
    } catch { /* storage blocked */ }
  }, [])

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState !== 'visible') return

      try {
        const dirty    = Number(localStorage.getItem(KEY_DIRTY)  ?? 0)
        const loaded   = Number(localStorage.getItem(KEY_LOADED) ?? loadedAt.current)

        if (dirty > loaded) {
          // Mutation happened since we loaded — clear flag, refresh server data
          localStorage.removeItem(KEY_DIRTY)
          localStorage.setItem(KEY_LOADED, String(Date.now()))
          router.refresh()
        }
      } catch {
        // localStorage unavailable (private browsing) — refresh to be safe
        router.refresh()
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [router])

  return null
}
