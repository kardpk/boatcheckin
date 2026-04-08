import { cn } from '@/lib/utils/cn'

interface Alerts {
  nonSwimmers: number
  children: number
  seasicknessProne: number
  dietary: { name: string; requirement: string }[]
}

export function SnapshotAlerts({ alerts }: { alerts: Alerts }) {
  const hasAlerts =
    alerts.nonSwimmers > 0 ||
    alerts.seasicknessProne > 0 ||
    alerts.dietary.length > 0

  if (!hasAlerts) return null

  return (
    <div className="
      bg-[#FDEAEA] rounded-[16px] p-4
      border border-[#E8593C] border-opacity-20
    ">
      <p className="text-[13px] font-bold text-[#E8593C] mb-3 uppercase tracking-wide">
        ⚠️ Passenger alerts
      </p>
      <div className="space-y-2">
        {alerts.nonSwimmers > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[18px]">🏊</span>
            <span className="text-[14px] font-medium text-[#0D1B2A]">
              {alerts.nonSwimmers} non-swimmer{alerts.nonSwimmers !== 1 ? 's' : ''}
              {' '}— life jacket required at all times
            </span>
          </div>
        )}
        {alerts.seasicknessProne > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[18px]">💊</span>
            <span className="text-[14px] font-medium text-[#0D1B2A]">
              {alerts.seasicknessProne} seasickness prone
            </span>
          </div>
        )}
        {alerts.dietary.map((d, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-[18px]">🥜</span>
            <span className="text-[14px] text-[#0D1B2A]">
              <strong>{d.name}:</strong> {d.requirement}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
