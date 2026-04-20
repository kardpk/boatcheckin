/**
 * markDirty — call after any successful mutation.
 * Sets a localStorage timestamp that RefreshOnFocus reads
 * to decide whether to call router.refresh() on navigate-back.
 */
export function markDirty() {
  try {
    localStorage.setItem('bc:dirty', String(Date.now()))
  } catch {
    // Private browsing / storage blocked — safe to ignore
  }
}
