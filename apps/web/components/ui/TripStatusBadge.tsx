import { cn } from '@/lib/utils/cn'
import type { TripStatus } from '@/types'

const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
  upcoming: {
    label: 'Upcoming',
    className: 'bg-gold-dim text-gold border border-gold-line',
  },
  active: {
    label: 'Active ●',
    className: 'bg-teal-dim text-teal border border-teal-line',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[#F0F2F5] text-text-mid',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-error-dim text-error',
  },
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-[10px] py-[4px]',
        'text-[10px] font-bold uppercase tracking-[0.05em] rounded-[5px]',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
