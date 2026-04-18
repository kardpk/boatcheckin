import type { TripStatus } from '@/types'

/**
 * TripStatusBadge — MASTER_DESIGN §7.2 pill primitive
 *
 * Uses the canonical pill classes with pill-dot for active status.
 * Mono font, uppercase, proper --r-pill radius.
 */

const STATUS_CONFIG: Record<TripStatus, { label: string; pillClass: string; hasDot: boolean }> = {
  upcoming: {
    label: 'Upcoming',
    pillClass: 'pill pill--ink',
    hasDot: false,
  },
  active: {
    label: 'Active',
    pillClass: 'pill pill--ok',
    hasDot: true,
  },
  completed: {
    label: 'Completed',
    pillClass: 'pill pill--ghost',
    hasDot: false,
  },
  cancelled: {
    label: 'Cancelled',
    pillClass: 'pill pill--err',
    hasDot: false,
  },
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={config.pillClass}>
      {config.hasDot && <span className="pill-dot" />}
      {config.label}
    </span>
  )
}
