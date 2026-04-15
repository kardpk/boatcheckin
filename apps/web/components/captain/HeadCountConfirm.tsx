'use client'

import { useState, useCallback } from 'react'
import { Users, AlertTriangle, CheckCircle2, Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface HeadCountConfirmProps {
  token: string
  digitalGuestCount: number
  onConfirmed?: (count: number) => void
}

export function HeadCountConfirm({
  token,
  digitalGuestCount,
  onConfirmed,
}: HeadCountConfirmProps) {
  const [count, setCount] = useState<string>(String(digitalGuestCount))
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<{
    mismatch: boolean
    physicalCount: number
    digitalCount: number
  } | null>(null)

  const numericCount = parseInt(count, 10) || 0
  const mismatch = numericCount !== digitalGuestCount && count !== ''

  const handleConfirm = useCallback(async () => {
    if (numericCount <= 0 || confirming) return
    setConfirming(true)
    try {
      const res = await fetch(`/api/captain/${token}/headcount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count: numericCount }),
      })
      if (res.ok) {
        const json = await res.json()
        setResult(json.data)
        setConfirmed(true)
        onConfirmed?.(numericCount)
      }
    } catch {
      // Silent fail
    } finally {
      setConfirming(false)
    }
  }, [numericCount, confirming, token, onConfirmed])

  if (confirmed && result) {
    return (
      <div className={cn(
        'p-card rounded-[14px] border-2',
        result.mismatch
          ? 'bg-warn-dim border-warn'
          : 'bg-teal-dim border-teal'
      )}>
        <div className="flex items-center gap-[10px]">
          {result.mismatch
            ? <AlertTriangle size={22} className="text-warn" />
            : <CheckCircle2 size={22} className="text-teal" />
          }
          <div>
            <p className={cn(
              'text-[14px] font-bold',
              result.mismatch ? 'text-warn' : 'text-teal'
            )}>
              {result.mismatch
                ? `HEAD COUNT MISMATCH`
                : 'Head count confirmed'}
            </p>
            <p className="text-[12px] text-text-mid mt-[3px]">
              {result.physicalCount} aboard · {result.digitalCount} registered
              {result.mismatch && ' · Operator notified'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[14px] border border-border overflow-hidden">
      <div className="px-card py-[14px] border-b border-border flex items-center gap-[6px]">
        <Users size={16} className="text-text-dim" />
        <h2 className="text-[16px] font-bold text-navy">
          Head Count Verification
        </h2>
      </div>
      <div className="px-card py-[14px] space-y-[10px]">
        <p className="text-[13px] text-text-mid font-medium">
          Digital count: <span className="font-bold text-navy">{digitalGuestCount} guests</span> registered
        </p>

        <div className="flex items-center gap-[10px]">
          <label className="text-[13px] text-text-mid flex-shrink-0 font-medium">
            Actual count aboard:
          </label>
          <div className="flex items-center border border-border rounded-[10px] overflow-hidden">
            <button
              type="button"
              onClick={() => setCount(String(Math.max(0, numericCount - 1)))}
              className="w-[44px] h-[44px] text-navy hover:bg-bg transition-colors flex items-center justify-center"
            >
              <Minus size={16} />
            </button>
            <input
              type="number"
              min="0"
              max="500"
              value={count}
              onChange={e => setCount(e.target.value)}
              className="w-16 h-[44px] text-center text-[18px] font-bold text-navy border-none outline-none bg-transparent"
            />
            <button
              type="button"
              onClick={() => setCount(String(numericCount + 1))}
              className="w-[44px] h-[44px] text-navy hover:bg-bg transition-colors flex items-center justify-center"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Mismatch warning */}
        {mismatch && (
          <div className="flex items-center gap-[8px] p-[10px] rounded-[10px] bg-warn-dim border border-warn/30">
            <AlertTriangle size={16} className="text-warn shrink-0" />
            <p className="text-[12px] text-warn font-medium">
              Mismatch detected: {numericCount} aboard vs {digitalGuestCount} registered.
              You can still confirm — the operator will be notified.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirm}
          disabled={numericCount <= 0 || confirming}
          className="
            w-full h-[48px] rounded-[10px]
            bg-gold text-white font-bold text-[14px]
            hover:bg-gold-hi transition-colors
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center justify-center gap-[6px]
          "
        >
          <CheckCircle2 size={16} />
          {confirming ? 'Confirming...' : `Confirm ${numericCount} aboard`}
        </button>
      </div>
    </div>
  )
}
