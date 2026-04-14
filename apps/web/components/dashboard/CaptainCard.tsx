'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'
import type { CaptainProfile, CrewRole } from '@/types'

const ROLE_CONFIG: Record<CrewRole, { label: string; emoji: string; color: string; bg: string }> = {
  captain: { label: 'Captain', emoji: '👨‍✈️', color: 'text-[#0C447C]', bg: 'bg-[#E8F2FB]' },
  first_mate: { label: 'First Mate', emoji: '⚓', color: 'text-[#1B6B4A]', bg: 'bg-[#E6F4EE]' },
  crew: { label: 'Crew', emoji: '🧑‍🤝‍🧑', color: 'text-[#7C5A0C]', bg: 'bg-[#FEF3DC]' },
  deckhand: { label: 'Deckhand', emoji: '🪢', color: 'text-[#6B4C93]', bg: 'bg-[#F3EEF9]' },
}

interface BoatOption {
  id: string
  name: string
}

interface CaptainCardProps {
  captain: CaptainProfile
  operatorBoats: BoatOption[]
  onEdit: (captain: CaptainProfile) => void
  onDeactivate: (captain: CaptainProfile) => void
  onBoatLinked: (captainId: string, boatId: string, boatName: string) => void
  onBoatUnlinked: (captainId: string, boatId: string) => void
}

export function CaptainCard({
  captain,
  operatorBoats,
  onEdit,
  onDeactivate,
  onBoatLinked,
  onBoatUnlinked,
}: CaptainCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showBoatPicker, setShowBoatPicker] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  const initials = captain.fullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const role = ROLE_CONFIG[captain.defaultRole] ?? ROLE_CONFIG.captain

  const daysUntilExpiry = captain.licenseExpiry
    ? Math.ceil((new Date(captain.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0

  // Boats not yet linked to this captain
  const availableBoats = operatorBoats.filter(
    b => !captain.linkedBoats.some(lb => lb.boatId === b.id)
  )

  const handleLinkBoat = useCallback(async (boatId: string) => {
    setLinkLoading(true)
    try {
      const res = await fetch(`/api/dashboard/captains/${captain.id}/boats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boatId }),
      })
      if (res.ok) {
        const json = await res.json()
        onBoatLinked(captain.id, boatId, json.data.boatName)
        setShowBoatPicker(false)
      }
    } catch {
      // silent
    } finally {
      setLinkLoading(false)
    }
  }, [captain.id, onBoatLinked])

  const handleUnlinkBoat = useCallback(async (boatId: string) => {
    try {
      const res = await fetch(`/api/dashboard/captains/${captain.id}/boats`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boatId }),
      })
      if (res.ok) {
        onBoatUnlinked(captain.id, boatId)
      } else {
        const json = await res.json().catch(() => ({}))
        alert((json as { error?: string }).error ?? 'Failed to unlink')
      }
    } catch {
      // silent
    }
  }, [captain.id, onBoatUnlinked])

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
      {/* Top row: role badge + default badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full', role.bg, role.color)}>
          {role.emoji} {role.label}
        </span>
        {captain.isDefault && (
          <span className="text-[10px] font-bold text-[#0C447C] bg-[#E8F2FB] px-2 py-0.5 rounded-full">
            ⭐ DEFAULT
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setShowActions(!showActions)}
          className="w-8 h-8 rounded-full hover:bg-[#F5F8FC] flex items-center justify-center text-[16px] text-[#6B7C93]"
        >
          ⋮
        </button>
      </div>

      <div className="flex items-start gap-3">
        {/* Avatar */}
        {captain.photoUrl ? (
          <img
            src={captain.photoUrl}
            alt={captain.fullName}
            className="w-12 h-12 rounded-full object-cover border-2 border-[#D0E2F3] flex-shrink-0"
          />
        ) : (
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0',
            role.bg, role.color
          )}>
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
            {captain.email && (
              <span className="text-[11px] text-[#6B7C93]">
                ✉️ {captain.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Boat chips */}
      <div className="mt-3 pt-3 border-t border-[#F5F8FC]">
        <p className="text-[10px] font-bold text-[#6B7C93] uppercase tracking-wider mb-1.5">
          Linked Boats
        </p>
        <div className="flex flex-wrap gap-1.5">
          {captain.linkedBoats.map(lb => (
            <span
              key={lb.boatId}
              className="inline-flex items-center gap-1 text-[12px] text-[#0D1B2A] bg-[#F5F8FC] border border-[#D0E2F3] px-2.5 py-1 rounded-full"
            >
              🛥️ {lb.boatName}
              <button
                onClick={() => handleUnlinkBoat(lb.boatId)}
                className="text-[#6B7C93] hover:text-[#D63B3B] ml-0.5 text-[10px] font-bold"
                title={`Unlink ${lb.boatName}`}
              >
                ✕
              </button>
            </span>
          ))}

          {/* Link boat button */}
          {availableBoats.length > 0 && (
            <button
              onClick={() => setShowBoatPicker(!showBoatPicker)}
              className="inline-flex items-center gap-1 text-[12px] text-[#0C447C] bg-[#E8F2FB] px-2.5 py-1 rounded-full hover:bg-[#D0E2F3] transition-colors"
            >
              + Link Boat
            </button>
          )}

          {captain.linkedBoats.length === 0 && availableBoats.length === 0 && (
            <span className="text-[11px] text-[#6B7C93] italic">No boats available</span>
          )}

          {captain.linkedBoats.length === 0 && availableBoats.length > 0 && !showBoatPicker && (
            <span className="text-[11px] text-[#6B7C93] italic">Not linked to any boat</span>
          )}
        </div>

        {/* Boat picker dropdown */}
        {showBoatPicker && (
          <div className="mt-2 p-2 bg-white border border-[#D0E2F3] rounded-[10px] shadow-sm space-y-1">
            {availableBoats.map(boat => (
              <button
                key={boat.id}
                disabled={linkLoading}
                onClick={() => handleLinkBoat(boat.id)}
                className="w-full text-left px-3 py-2 rounded-[8px] text-[13px] text-[#0D1B2A] hover:bg-[#E8F2FB] disabled:opacity-50 transition-colors"
              >
                🛥️ {boat.name}
              </button>
            ))}
          </div>
        )}
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
