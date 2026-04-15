'use client'

import { useState, useCallback } from 'react'
import {
  Shield, Anchor, HardHat, Users,
  Phone, Mail, Ship, Link2, Pencil, Trash2,
  AlertTriangle, Ban, MoreVertical, X, Briefcase, Globe
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import type { CaptainProfile, CrewRole } from '@/types'

const ROLE_CONFIG: Record<CrewRole, {
  label: string; Icon: typeof Shield;
  color: string; bg: string; border: string;
}> = {
  captain: {
    label: 'Captain', Icon: Shield,
    color: 'text-gold', bg: 'bg-gold-dim', border: 'border-gold-line',
  },
  first_mate: {
    label: 'First Mate', Icon: Anchor,
    color: 'text-teal', bg: 'bg-teal-dim', border: 'border-teal-line',
  },
  crew: {
    label: 'Crew', Icon: Users,
    color: 'text-[#7C5A0C]', bg: 'bg-[rgba(124,90,12,0.06)]', border: 'border-[rgba(124,90,12,0.18)]',
  },
  deckhand: {
    label: 'Deckhand', Icon: HardHat,
    color: 'text-[#6B4C93]', bg: 'bg-[rgba(107,76,147,0.06)]', border: 'border-[rgba(107,76,147,0.18)]',
  },
}

interface BoatOption { id: string; name: string }

interface CaptainCardProps {
  captain: CaptainProfile
  operatorBoats: BoatOption[]
  onEdit: (captain: CaptainProfile) => void
  onDeactivate: (captain: CaptainProfile) => void
  onBoatLinked: (captainId: string, boatId: string, boatName: string) => void
  onBoatUnlinked: (captainId: string, boatId: string) => void
}

export function CaptainCard({
  captain, operatorBoats, onEdit, onDeactivate, onBoatLinked, onBoatUnlinked,
}: CaptainCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showBoatPicker, setShowBoatPicker] = useState(false)
  const [linkLoading, setLinkLoading] = useState(false)

  const role = ROLE_CONFIG[captain.defaultRole] ?? ROLE_CONFIG.captain
  const RoleIcon = role.Icon

  const daysUntilExpiry = captain.licenseExpiry
    ? Math.ceil((new Date(captain.licenseExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0

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
        'relative overflow-hidden bg-white rounded-[14px] border p-card transition-all',
        isExpired ? 'border-error/40' : isExpiringSoon ? 'border-warn/40' : 'border-border',
      )}
    >
      {/* State top bar */}
      {isExpired && <div className="absolute top-0 left-0 right-0 h-[3px] bg-error" />}
      {isExpiringSoon && !isExpired && <div className="absolute top-0 left-0 right-0 h-[3px] bg-warn" />}

      {/* Header: avatar + info + menu */}
      <div className="flex items-start gap-[12px]">
        <Avatar
          name={captain.fullName}
          role={captain.defaultRole === 'first_mate' ? 'first-mate' : captain.defaultRole === 'deckhand' ? 'deckhand' : 'captain'}
          size="lg"
        />

        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-navy truncate">
            {captain.fullName}
          </p>

          {/* Role badge */}
          <span className={cn(
            'inline-flex items-center gap-[4px] mt-[4px] px-[10px] py-[3px] rounded-[5px]',
            'text-[11px] font-bold uppercase tracking-[0.04em] border',
            role.bg, role.color, role.border
          )}>
            <RoleIcon size={12} />
            {role.label}
          </span>

          {captain.isDefault && (
            <span className="ml-[6px] text-[10px] font-bold uppercase tracking-[0.04em] text-gold bg-gold-dim border border-gold-line px-[8px] py-[3px] rounded-[5px]">
              Default
            </span>
          )}
        </div>

        <button
          onClick={() => setShowActions(!showActions)}
          className="w-[32px] h-[32px] rounded-full hover:bg-bg flex items-center justify-center text-text-dim shrink-0"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* License */}
      {captain.licenseType && (
        <div className="flex items-center gap-[6px] mt-[10px]">
          <span className="inline-flex items-center gap-[4px] text-[12px] text-navy-mid font-medium bg-[#EBF0F7] px-[8px] py-[3px] rounded-[5px]">
            <Briefcase size={11} />
            {captain.licenseType}
          </span>
          {captain.licenseNumber && (
            <span className="text-[11px] text-text-dim font-medium">
              #{captain.licenseNumber}
            </span>
          )}
        </div>
      )}

      {/* Expiry warning */}
      {captain.licenseExpiry && (
        <p className={cn(
          'text-[11px] mt-[6px] flex items-center gap-[4px] font-medium',
          isExpired ? 'text-error font-bold' :
          isExpiringSoon ? 'text-warn font-semibold' :
          'text-text-dim'
        )}>
          {isExpired ? <><Ban size={12} /> License EXPIRED</> :
           isExpiringSoon ? <><AlertTriangle size={12} /> Expires in {daysUntilExpiry} days</> :
           `Expires: ${new Date(captain.licenseExpiry).toLocaleDateString()}`}
        </p>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-[10px] mt-[8px] flex-wrap">
        {captain.yearsExperience != null && (
          <span className="text-[11px] text-text-mid flex items-center gap-[3px] font-medium">
            <Briefcase size={11} />
            {captain.yearsExperience}yr exp
          </span>
        )}
        {captain.phone && (
          <span className="text-[11px] text-text-mid flex items-center gap-[3px] font-medium">
            <Phone size={11} />
            {captain.phone}
          </span>
        )}
        {captain.email && (
          <span className="text-[11px] text-text-mid flex items-center gap-[3px] font-medium">
            <Mail size={11} />
            {captain.email}
          </span>
        )}
        {captain.languages && captain.languages.length > 0 && (
          <span className="text-[11px] text-text-mid flex items-center gap-[3px] font-medium">
            <Globe size={11} />
            {captain.languages.join(', ')}
          </span>
        )}
      </div>

      {/* Linked boats */}
      <div className="mt-[12px] pt-[12px] border-t border-border">
        <p className="text-[10px] font-bold text-text-dim uppercase tracking-[0.06em] mb-[6px] flex items-center gap-[4px]">
          <Ship size={11} />
          Linked Boats
        </p>
        <div className="flex flex-wrap gap-[6px]">
          {captain.linkedBoats.map(lb => (
            <span
              key={lb.boatId}
              className="inline-flex items-center gap-[4px] text-[12px] text-navy bg-[#EBF0F7] border border-border px-[10px] py-[4px] rounded-[8px] font-medium"
            >
              <Ship size={12} className="text-text-dim" />
              {lb.boatName}
              <button
                onClick={() => handleUnlinkBoat(lb.boatId)}
                className="text-text-dim hover:text-error ml-[2px]"
                title={`Unlink ${lb.boatName}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {availableBoats.length > 0 && (
            <button
              onClick={() => setShowBoatPicker(!showBoatPicker)}
              className="inline-flex items-center gap-[4px] text-[12px] text-gold font-semibold bg-gold-dim border border-gold-line px-[10px] py-[4px] rounded-[8px] hover:bg-gold/10 transition-colors"
            >
              <Link2 size={12} />
              Link Boat
            </button>
          )}

          {captain.linkedBoats.length === 0 && availableBoats.length === 0 && (
            <span className="text-[11px] text-text-dim italic">No boats available</span>
          )}

          {captain.linkedBoats.length === 0 && availableBoats.length > 0 && !showBoatPicker && (
            <span className="text-[11px] text-text-dim italic">Not linked to any boat</span>
          )}
        </div>

        {/* Boat picker */}
        {showBoatPicker && (
          <div className="mt-[8px] p-[8px] bg-white border border-border rounded-[10px] shadow-card space-y-[4px]">
            {availableBoats.map(boat => (
              <button
                key={boat.id}
                disabled={linkLoading}
                onClick={() => handleLinkBoat(boat.id)}
                className="w-full text-left px-[12px] py-[8px] rounded-[8px] text-[13px] text-navy font-medium hover:bg-gold-dim disabled:opacity-50 transition-colors flex items-center gap-[6px]"
              >
                <Ship size={14} className="text-text-dim" />
                {boat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="mt-[12px] pt-[12px] border-t border-border flex gap-[8px]">
          <button
            onClick={() => { onEdit(captain); setShowActions(false) }}
            className="flex-1 h-[36px] rounded-[10px] border border-border text-[13px] font-semibold text-navy hover:bg-bg transition-colors flex items-center justify-center gap-[5px]"
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            onClick={() => { onDeactivate(captain); setShowActions(false) }}
            className="h-[36px] px-[16px] rounded-[10px] border border-error/30 text-[13px] font-semibold text-error hover:bg-error-dim transition-colors flex items-center justify-center gap-[5px]"
          >
            <Trash2 size={13} />
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
