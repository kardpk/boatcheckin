import { ShoppingBag } from 'lucide-react'
import type { TripT } from '@/lib/i18n/tripTranslations'

interface Addon {
  id: string
  name: string
  description: string | null
  emoji: string
  priceCents: number
  maxQuantity: number
}

interface AddonsPreviewSectionProps {
  addons: Addon[]
  tr: TripT
}

export function AddonsPreviewSection({ addons, tr }: AddonsPreviewSectionProps) {
  return (
    <div className="mx-4 mt-3 bg-white rounded-[16px] border border-[#D0E2F3] p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag size={16} className="text-[#0C447C]" />
        <p className="text-[17px] font-semibold text-[#0D1B2A]">{tr.addons}</p>
      </div>

      {/* Info banner */}
      <div className="bg-[#E8F2FB] rounded-[10px] px-4 py-2.5 mb-4 text-[13px] text-[#0C447C]">
        🛒 {tr.addonNote}
      </div>

      {/* Addon list */}
      <ul className="divide-y divide-[#F5F8FC]">
        {addons.map((addon) => (
          <li key={addon.id} className="flex items-center gap-3 py-3">
            {/* Emoji chip */}
            <div className="w-[36px] h-[36px] rounded-[8px] bg-[#F5F8FC] flex items-center justify-center text-[20px] shrink-0">
              {addon.emoji}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-[#0D1B2A] truncate">
                {addon.name}
              </p>
              {addon.description && (
                <p className="text-[13px] text-[#6B7C93] truncate">{addon.description}</p>
              )}
            </div>

            {/* Price + disabled stepper */}
            <div className="flex items-center gap-2 shrink-0">
              {addon.priceCents === 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-[#E8F9F4] text-[#1D9E75] text-[12px] font-semibold">
                  {tr.free}
                </span>
              ) : (
                <span className="text-[15px] font-semibold text-[#0C447C]">
                  ${(addon.priceCents / 100).toFixed(2)}
                </span>
              )}
              {/* Disabled stepper — preview only */}
              <span className="text-[20px] text-[#D0E2F3] select-none cursor-not-allowed">+</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
