'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface WhatToBringSectionProps {
  whatToBring: string | null
  whatNotToBring: string | null
  slug: string
  tr: TripT
}

export function WhatToBringSection({
  whatToBring,
  whatNotToBring,
  slug,
  tr,
}: WhatToBringSectionProps) {
  const [activeTab, setActiveTab] = useState<'bring' | 'avoid'>('bring')
  const [checked, setChecked] = useState<Set<number>>(new Set())

  const bringItems = whatToBring
    ? whatToBring.split('\n').map((s) => s.trim()).filter(Boolean)
    : []
  const avoidItems = whatNotToBring
    ? whatNotToBring.split('\n').map((s) => s.trim()).filter(Boolean)
    : []

  const storageKey = `dp-checklist-${slug}`

  // Load saved ticks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        setChecked(new Set(JSON.parse(saved) as number[]))
      }
    } catch { /* Unavailable */ }
  }, [storageKey])

  function toggleItem(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      try {
        localStorage.setItem(storageKey, JSON.stringify([...next]))
      } catch { /* Unavailable */ }
      return next
    })
  }

  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-[#D0E2F3] p-5">
      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('bring')}
          className={cn(
            'flex-1 h-[40px] rounded-[10px] text-[14px] font-medium border transition-colors',
            activeTab === 'bring'
              ? 'bg-[#0C447C] text-white border-[#0C447C]'
              : 'bg-white text-[#6B7C93] border-[#D0E2F3]',
          )}
        >
          ✓ {tr.whatToBring}
        </button>
        <button
          onClick={() => setActiveTab('avoid')}
          className={cn(
            'flex-1 h-[40px] rounded-[10px] text-[14px] font-medium border transition-colors',
            activeTab === 'avoid'
              ? 'bg-[#D63B3B] text-white border-[#D63B3B]'
              : 'bg-white text-[#6B7C93] border-[#D0E2F3]',
          )}
        >
          ✗ {tr.whatNotToBring}
        </button>
      </div>

      {/* Bring checklist */}
      {activeTab === 'bring' && (
        <ul className="space-y-2">
          {bringItems.length === 0 && (
            <li className="text-[14px] text-[#6B7C93]">No items listed.</li>
          )}
          {bringItems.map((item, idx) => (
            <li key={idx} className="flex items-center gap-3">
              <input
                type="checkbox"
                id={`bring-${idx}`}
                checked={checked.has(idx)}
                onChange={() => toggleItem(idx)}
                className="w-[22px] h-[22px] accent-[#0C447C] shrink-0 cursor-pointer"
              />
              <label
                htmlFor={`bring-${idx}`}
                className={cn(
                  'text-[14px] cursor-pointer select-none',
                  checked.has(idx)
                    ? 'line-through text-[#6B7C93]'
                    : 'text-[#0D1B2A]',
                )}
              >
                {item}
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* Avoid list */}
      {activeTab === 'avoid' && (
        <ul className="space-y-2">
          {avoidItems.length === 0 && (
            <li className="text-[14px] text-[#6B7C93]">No items listed.</li>
          )}
          {avoidItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-[#D63B3B] font-bold text-[14px] mt-0.5">✗</span>
              <span className="text-[14px] text-[#E8593C]">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
