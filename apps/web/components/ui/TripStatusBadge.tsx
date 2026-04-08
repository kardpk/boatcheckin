import { cn } from '@/lib/utils/cn'
import type { TripStatus } from '@/types'

const STATUS_CONFIG: Record<TripStatus, { label: string; className: string }> = {
  upcoming: {
    label: 'Upcoming',
    className: 'bg-[#E8F2FB] text-[#0C447C]',
  },
  active: {
    label: 'Active ●',
    className: 'bg-[#E8F9F4] text-[#1D9E75]',
  },
  completed: {
    label: 'Completed',
    className: 'bg-[#F5F8FC] text-[#6B7C93]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-[#FDEAEA] text-[#D63B3B]',
  },
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1',
        'text-[12px] font-semibold rounded-full',
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
