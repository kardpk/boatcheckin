'use client'

import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { SplitBookingEntry } from '@/types'

interface SplitBookingEditorProps {
  entries: SplitBookingEntry[]
  onChange: (entries: SplitBookingEntry[]) => void
  maxTotalGuests: number
}

export function SplitBookingEditor({
  entries,
  onChange,
  maxTotalGuests,
}: SplitBookingEditorProps) {
  const totalAllocated = entries.reduce((sum, e) => sum + e.maxGuests, 0)
  const remaining = maxTotalGuests - totalAllocated

  function addEntry() {
    onChange([
      ...entries,
      {
        id: crypto.randomUUID(),
        organiserName: '',
        organiserEmail: '',
        maxGuests: Math.min(Math.max(remaining, 1), 4),
        notes: '',
      },
    ])
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id))
  }

  function updateEntry(
    id: string,
    field: keyof SplitBookingEntry,
    value: string | number,
  ) {
    onChange(entries.map((e) => (e.id === id ? { ...e, [field]: value } : e)))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-text-mid">Split bookings</p>
        {totalAllocated > 0 && (
          <span
            className={cn(
              'text-[12px] font-medium px-2 py-0.5 rounded-[8px]',
              remaining < 0
                ? 'bg-error-dim text-error'
                : 'bg-gold-dim text-navy',
            )}
          >
            {totalAllocated} / {maxTotalGuests} allocated
          </span>
        )}
      </div>

      {entries.map((entry, i) => (
        <div
          key={entry.id}
          className="p-4 border border-border rounded-[12px] space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-mid">
              Group {i + 1}
            </span>
            <button
              type="button"
              onClick={() => removeEntry(entry.id)}
              className="text-text-mid hover:text-error transition-colors p-1"
              aria-label="Remove booking"
            >
              <Trash2 size={15} />
            </button>
          </div>

          <input
            type="text"
            placeholder="Organiser name *"
            value={entry.organiserName}
            onChange={(e) => updateEntry(entry.id, 'organiserName', e.target.value)}
            className="w-full h-[48px] px-3 rounded-[10px] text-[14px] border border-border bg-white text-navy placeholder:text-text-mid focus:outline-none focus:ring-2 focus:ring-gold"
          />

          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              placeholder="Email (optional)"
              value={entry.organiserEmail}
              onChange={(e) => updateEntry(entry.id, 'organiserEmail', e.target.value)}
              className="h-[48px] px-3 rounded-[10px] text-[14px] border border-border bg-white text-navy placeholder:text-text-mid focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={maxTotalGuests}
                value={entry.maxGuests}
                onChange={(e) =>
                  updateEntry(entry.id, 'maxGuests', Number(e.target.value))
                }
                className="w-20 h-[48px] px-3 rounded-[10px] text-[14px] text-center border border-border bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold"
              />
              <span className="text-[13px] text-text-mid">guests</span>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addEntry}
        disabled={remaining <= 0}
        className={cn(
          'w-full h-[48px] rounded-[12px] border',
          'flex items-center justify-center gap-2',
          'text-[14px] font-medium transition-colors',
          remaining <= 0
            ? 'border-border text-border cursor-not-allowed'
            : 'border-dashed border-[#A8C4E0] text-navy hover:bg-gold-dim',
        )}
      >
        <Plus size={16} />
        Add group
        {remaining > 0 && (
          <span className="text-[12px] text-text-mid">
            ({remaining} guests remaining)
          </span>
        )}
      </button>
    </div>
  )
}
