'use client'

import { useState, useCallback } from 'react'
import {
  Shield, Anchor, HardHat, Users,
  Phone, Mail, Ship, Link2, Pencil, Trash2,
  AlertTriangle, Ban, MoreVertical, X, Briefcase, Globe, ChevronDown,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { CaptainProfile, CrewRole } from '@/types'

const ROLE_LABEL: Record<CrewRole, { label: string; Icon: typeof Shield }> = {
  captain:    { label: 'Captain',    Icon: Shield },
  first_mate: { label: 'First Mate', Icon: Anchor },
  crew:       { label: 'Crew',       Icon: Users },
  deckhand:   { label: 'Deckhand',   Icon: HardHat },
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

  const role = ROLE_LABEL[captain.defaultRole] ?? ROLE_LABEL.captain
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
      className="tile"
      style={{
        padding: 'var(--s-3) var(--s-4)',
        position: 'relative',
        borderLeft: `4px solid ${
          isExpired ? 'var(--color-status-err)' :
          isExpiringSoon ? 'var(--color-status-warn)' :
          'var(--color-ink)'
        }`,
      }}
    >
      {/* ── Header: avatar (md) + info + menu ─────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
        <Avatar
          name={captain.fullName}
          role={captain.defaultRole === 'first_mate' ? 'first-mate' : captain.defaultRole === 'deckhand' ? 'deckhand' : 'captain'}
          size="md"
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name — larger, prominent */}
          <p style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2, margin: 0 }}>
            {captain.fullName}
          </p>

          {/* Role + default pill — inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-1)', marginTop: 3 }}>
            <span className="pill pill--ink" style={{ padding: '2px 7px', fontSize: '10px' }}>
              <RoleIcon size={9} strokeWidth={2.5} />
              {role.label}
            </span>
            {captain.isDefault && (
              <span className="pill pill--rust" style={{ padding: '2px 7px', fontSize: '10px' }}>
                Default
              </span>
            )}
          </div>
        </div>

        {/* Menu toggle */}
        <button
          onClick={() => setShowActions(!showActions)}
          style={{
            width: 32, height: 32, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--r-1)',
            background: showActions ? 'var(--color-bone)' : 'transparent',
            border: 'none', cursor: 'pointer',
            color: 'var(--color-ink-muted)',
            transition: 'background var(--dur-fast) var(--ease)',
          }}
        >
          <MoreVertical size={16} strokeWidth={2} />
        </button>
      </div>

      {/* ── License + expiry — single dense row ──────── */}
      {(captain.licenseType || captain.licenseExpiry) && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
            marginTop: 'var(--s-2)',
            flexWrap: 'wrap',
          }}
        >
          {captain.licenseType && (
            <span className="badge">
              <Briefcase size={10} strokeWidth={2} />
              {captain.licenseType}
            </span>
          )}
          {captain.licenseNumber && (
            <span
              className="font-mono"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}
            >
              #{captain.licenseNumber}
            </span>
          )}
          {captain.licenseExpiry && (
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
                color: isExpired
                  ? 'var(--color-status-err)'
                  : isExpiringSoon
                    ? 'var(--color-status-warn)'
                    : 'var(--color-ink-muted)',
              }}
            >
              {isExpired ? <><Ban size={11} strokeWidth={2} /> Expired</> :
               isExpiringSoon ? <><AlertTriangle size={11} strokeWidth={2} /> {daysUntilExpiry}d left</> :
               `Exp ${new Date(captain.licenseExpiry).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}`}
            </span>
          )}
        </div>
      )}

      {/* ── Meta row — readable ──────────────────────── */}
      <div
        className="font-mono"
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
          flexWrap: 'wrap',
          marginTop: 'var(--s-2)',
          paddingTop: 'var(--s-2)',
          borderTop: '1px solid var(--color-line-soft)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-ink-muted)',
          letterSpacing: '0.02em',
        }}
      >
        {captain.yearsExperience != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Briefcase size={12} strokeWidth={2} />
            {captain.yearsExperience}yr
          </span>
        )}
        {captain.phone && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Phone size={12} strokeWidth={2} />
            {captain.phone}
          </span>
        )}
        {captain.email && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            <Mail size={12} strokeWidth={2} style={{ flexShrink: 0 }} />
            {captain.email}
          </span>
        )}
        {captain.languages && captain.languages.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Globe size={12} strokeWidth={2} />
            {captain.languages.join(', ')}
          </span>
        )}
      </div>

      {/* ── Linked boats — inline, no separate header ── */}
      <div
        style={{
          marginTop: 'var(--s-2)',
          display: 'flex', flexWrap: 'wrap', gap: 'var(--s-1)',
          alignItems: 'center',
        }}
      >
        {captain.linkedBoats.map(lb => (
          <span
            key={lb.boatId}
            className="badge"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <Ship size={11} strokeWidth={2} />
            {lb.boatName}
            <button
              onClick={() => handleUnlinkBoat(lb.boatId)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-ink-muted)', padding: 0, marginLeft: 2,
                display: 'flex',
              }}
              title={`Unlink ${lb.boatName}`}
            >
              <X size={11} strokeWidth={2} />
            </button>
          </span>
        ))}

        {availableBoats.length > 0 && (
          <button
            onClick={() => setShowBoatPicker(!showBoatPicker)}
            className="badge badge--rust"
            style={{
              cursor: 'pointer', background: 'transparent', border: '1px solid var(--color-rust)',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}
          >
            <Link2 size={11} strokeWidth={2} />
            Link boat
            <ChevronDown size={10} strokeWidth={2} style={{ transform: showBoatPicker ? 'rotate(180deg)' : 'none', transition: 'transform var(--dur-fast) var(--ease)' }} />
          </button>
        )}

        {captain.linkedBoats.length === 0 && availableBoats.length === 0 && (
          <span className="font-mono" style={{ fontSize: '12px', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>No boats available</span>
        )}

        {captain.linkedBoats.length === 0 && availableBoats.length > 0 && !showBoatPicker && (
          <span className="font-mono" style={{ fontSize: '12px', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>Not linked</span>
        )}
      </div>

      {/* Boat picker */}
      {showBoatPicker && (
        <div
          className="tile"
          style={{
            marginTop: 'var(--s-2)',
            padding: 'var(--s-2)',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}
        >
          {availableBoats.map(boat => (
            <button
              key={boat.id}
              disabled={linkLoading}
              onClick={() => handleLinkBoat(boat.id)}
              style={{
                width: '100%', textAlign: 'left',
                padding: 'var(--s-2) var(--s-3)',
                borderRadius: 'var(--r-1)',
                fontSize: 'var(--t-body-sm)',
                fontWeight: 600,
                color: 'var(--color-ink)',
                background: 'transparent',
                border: 'none',
                cursor: linkLoading ? 'not-allowed' : 'pointer',
                opacity: linkLoading ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: 'var(--s-2)',
                transition: 'background var(--dur-fast) var(--ease)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bone)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <Ship size={14} strokeWidth={1.8} style={{ color: 'var(--color-ink-muted)' }} />
              {boat.name}
            </button>
          ))}
        </div>
      )}

      {/* ── Action buttons ───────────────────────────── */}
      {showActions && (
        <div
          style={{
            marginTop: 'var(--s-2)',
            paddingTop: 'var(--s-2)',
            borderTop: '1px solid var(--color-line-soft)',
            display: 'flex',
            gap: 'var(--s-2)',
          }}
        >
          <button
            onClick={() => { onEdit(captain); setShowActions(false) }}
            className="btn btn--sm"
            style={{ flex: 1 }}
          >
            <Pencil size={13} strokeWidth={2} />
            Edit
          </button>
          <button
            onClick={() => { onDeactivate(captain); setShowActions(false) }}
            className="btn btn--sm btn--danger"
          >
            <Trash2 size={13} strokeWidth={2} />
            Remove
          </button>
        </div>
      )}
    </div>
  )
}
