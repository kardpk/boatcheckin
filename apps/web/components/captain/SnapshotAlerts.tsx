import { AlertTriangle, ShieldAlert, Baby, Pill, Utensils, LifeBuoy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Alerts {
  nonSwimmers: number
  children: number
  childrenUnder6: number
  seasicknessProne: number
  dietary: { name: string; requirement: string }[]
}

export function SnapshotAlerts({ alerts }: { alerts: Alerts }) {
  const hasAlerts =
    alerts.nonSwimmers > 0 ||
    alerts.childrenUnder6 > 0 ||
    alerts.children > 0 ||
    alerts.seasicknessProne > 0 ||
    alerts.dietary.length > 0

  if (!hasAlerts) return null

  return (
    <div className="space-y-[10px]">
      {/* ── FWC §327.33 Under-6 PFD Compliance Alert ── */}
      {alerts.childrenUnder6 > 0 && (
        <div
          className={cn(
            'relative overflow-hidden rounded-[14px] p-card',
            'bg-gradient-to-r from-[#DC2626] to-[#991B1B]',
            'border-2 border-[#FCA5A5]',
            'shadow-[0_0_20px_rgba(220,38,38,0.3)]',
          )}
        >
          {/* Pulsing border animation */}
          <div className="absolute inset-0 rounded-[14px] border-2 border-white/30 animate-pulse pointer-events-none" />

          <div className="relative">
            <div className="flex items-start gap-[10px] mb-[10px]">
              <ShieldAlert size={24} className="text-white shrink-0 animate-bounce" />
              <div>
                <p className="text-[15px] font-extrabold text-white uppercase tracking-[0.04em]">
                  Compliance Alert PFD Required
                </p>
                <p className="text-[13px] font-bold text-white/90 mt-[3px]">
                  {alerts.childrenUnder6} child{alerts.childrenUnder6 !== 1 ? 'ren' : ''} under 6 onboard
                </p>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-sm rounded-[10px] p-[12px] border border-white/20">
              <p className="text-[13px] text-white leading-relaxed font-medium">
                <strong>FWC Law (§327.33):</strong> Children under 6 must wear a USCG-approved
                Type I, II, or III PFD <strong>at all times</strong> while this vessel is underway
                on boats under 26ft. Verify life jackets are properly fitted{' '}
                <strong>BEFORE departure.</strong>
              </p>
            </div>

            <div className="mt-[10px] flex items-center gap-[6px]">
              <div className="w-[6px] h-[6px] rounded-full bg-[#FCA5A5] animate-ping" />
              <p className="text-[11px] text-white/80 font-semibold uppercase tracking-[0.06em]">
                DO NOT DEPART until PFDs are secured
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Standard Passenger Alerts ── */}
      <div className="relative overflow-hidden bg-error-dim rounded-[14px] p-card border border-error/20">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-error" />
        <p className="text-[13px] font-bold text-error mb-[10px] uppercase tracking-[0.04em] flex items-center gap-[6px]">
          <AlertTriangle size={14} />
          Passenger alerts
        </p>
        <div className="space-y-[8px]">
          {alerts.nonSwimmers > 0 && (
            <div className="flex items-center gap-[8px]">
              <LifeBuoy size={16} className="text-error shrink-0" />
              <span className="text-[14px] font-medium text-text">
                {alerts.nonSwimmers} non-swimmer{alerts.nonSwimmers !== 1 ? 's' : ''}
                {' '} life jacket required at all times
              </span>
            </div>
          )}
          {alerts.children > 0 && (
            <div className="flex items-center gap-[8px]">
              <Baby size={16} className="text-warn shrink-0" />
              <span className="text-[14px] font-medium text-text">
                {alerts.children} minor{alerts.children !== 1 ? 's' : ''} (under 18) onboard
              </span>
            </div>
          )}
          {alerts.seasicknessProne > 0 && (
            <div className="flex items-center gap-[8px]">
              <Pill size={16} className="text-text-mid shrink-0" />
              <span className="text-[14px] font-medium text-text">
                {alerts.seasicknessProne} seasickness prone
              </span>
            </div>
          )}
          {alerts.dietary.map((d, i) => (
            <div key={i} className="flex items-start gap-[8px]">
              <Utensils size={16} className="text-warn shrink-0 mt-[2px]" />
              <span className="text-[14px] text-text">
                <strong>{d.name}:</strong> {d.requirement}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
