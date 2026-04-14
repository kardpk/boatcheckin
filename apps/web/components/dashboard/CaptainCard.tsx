'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { CaptainProfile } from '@/types'

interface CaptainCardProps {
  captain: CaptainProfile
  onEdit: (captain: CaptainProfile) => void
  onDeactivate: (captain: CaptainProfile) => void
}

export function CaptainCard({ captain, onEdit, onDeactivate }: CaptainCardProps) {
  const [showActions, setShowActions] = useState(false)

  const initials = captain.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const daysUntilExpiry = captain.licenseExpiry
    ? Math.ceil((new Date(captain.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0

  return (
    <div
      className={cn(
        'bg-white rounded-[16px] border-2 p-4 transition-all relative',
        isExpired
          ? 'border-[#D63B3B]/40'
          : isExpiringSoon
            ? 'border-[#E5910A]/40'
            : 'border-[#D0E2F3]',
        'hover:shadow-md'
      )}
    >
      {/* Default badge */}
      {captain.isDefault && (
        <div className="absolute -top-2 -right-2 bg-[#0C447C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
          ⭐ DEFAULT
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Avatar */}
        {captain.photoUrl ? (
          <img
            src={captain.photoUrl}
            alt={captain.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#D0E2F3] flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-[#E8F2FB] flex items-center justify-center text-[16px] font-bold text-[#0C447C] flex-shrink-0">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-[#0D1B2A] truncate">
            {captain.fullName}
          </p>

          {/* License */}
          {captain.licenseType && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[12px] text-[#0C447C] font-medium bg-[#E8F2FB] px-2 py-0.5 rounded-full">
                🪪 {captain.licenseType}
              </span>
              {captain.licenseNumber && (
                <span className="text-[11px] text-[#6B7C93]">
                  #{captain.licenseNumber}
                </span>
              )}
            </div>
          )}

          {/* Expiry */}
          {captain.licenseExpiry && (
            <p className={cn(
              'text-[11px] mt-1',
              isExpired ? 'text-[#D63B3B] font-bold' :
              isExpiringSoon ? 'text-[#E5910A] font-semibold' :
              'text-[#6B7C93]'
            )}>
              {isExpired ? '⛔ License EXPIRED' :
               isExpiringSoon ? `⚠️ Expires in ${daysUntilExpiry} days` :
               `Expires: ${new Date(captain.licenseExpiry).toLocaleDateString()}`}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {captain.yearsExperience != null && (
              <span className="text-[11px] text-[#6B7C93]">
                {captain.yearsExperience}yr exp
              </span>
            )}
            {captain.phone && (
              <span className="text-[11px] text-[#6B7C93]">
                📱 {captain.phone}
              </span>
            )}
            {captain.languages.length > 1 && (
              <span className="text-[11px] text-[#6B7C93]">
                🌐 {captain.languages.join(', ')}
              </span>
            )}
          </div>
        </div>

        {/* Actions toggle */}
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-8 h-8 rounded-full hover:bg-[#F5F8FC] flex items-center justify-center text-[16px] text-[#6B7C93]"
        >
          ⋮
        </button>
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="mt-3 pt-3 border-t border-[#D0E2F3] flex gap-2">
          <button
            onClick={() => { onEdit(captain); setShowActions(false) }}
            className="flex-1 h-[36px] rounded-[8px] border border-[#D0E2F3] text-[13px] font-medium text-[#0C447C] hover:bg-[#E8F2FB] transition-colors"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => { onDeactivate(captain); setShowActions(false) }}
            className="h-[36px] px-4 rounded-[8px] border border-[#D63B3B]/30 text-[13px] font-medium text-[#D63B3B] hover:bg-[#FDEAEA] transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
