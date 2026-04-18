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
        padding: 'var(--s-4) var(--s-5)',
        position: 'relative',
        borderColor: isExpired ? 'var(--color-status-err)' : isExpiringSoon ? 'var(--color-status-warn)' : undefined,
      }}
    >
      {/* ── Top accent bar for expiry states ──────────── */}
      {isExpired && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--color-status-err)', borderRadius: 'var(--r-1) var(--r-1) 0 0' }} />}
      {isExpiringSoon && !isExpired && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--color-status-warn)', borderRadius: 'var(--r-1) var(--r-1) 0 0' }} />}

      {/* ── Header: avatar + info + menu ──────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--s-3)' }}>
        <Avatar
          name={captain.fullName}
          role={captain.defaultRole === 'first_mate' ? 'first-mate' : captain.defaultRole === 'deckhand' ? 'deckhand' : 'captain'}
          size="lg"
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name */}
          <p style={{ fontSize: 'var(--t-body-md)', fontWeight: 700, color: 'var(--color-ink)', lineHeight: 1.2 }}>
            {captain.fullName}
          </p>

          {/* Role pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginTop: 'var(--s-1)' }}>
            <span className="pill pill--ink" style={{ padding: '3px 8px' }}>
              <RoleIcon size={10} strokeWidth={2.5} />
              {role.label}
            </span>
            {captain.isDefault && (
              <span className="pill pill--rust" style={{ padding: '3px 8px' }}>
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

      {/* ── License info ─────────────────────────────── */}
      {captain.licenseType && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)', marginTop: 'var(--s-3)' }}>
          <span className="badge">
            <Briefcase size={10} strokeWidth={2} />
            {captain.licenseType}
          </span>
          {captain.licenseNumber && (
            <span
              className="font-mono"
              style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-ink-muted)', letterSpacing: '0.04em' }}
            >
              #{captain.licenseNumber}
            </span>
          )}
        </div>
      )}

      {/* ── Expiry warning ───────────────────────────── */}
      {captain.licenseExpiry && (
        <p
          style={{
            fontSize: 'var(--t-body-sm)',
            marginTop: 'var(--s-1)',
            display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
            fontWeight: 600,
            color: isExpired
              ? 'var(--color-status-err)'
              : isExpiringSoon
                ? 'var(--color-status-warn)'
                : 'var(--color-ink-muted)',
          }}
        >
          {isExpired ? <><Ban size={12} strokeWidth={2} /> License expired</> :
           isExpiringSoon ? <><AlertTriangle size={12} strokeWidth={2} /> Expires in {daysUntilExpiry} days</> :
           `Expires: ${new Date(captain.licenseExpiry).toLocaleDateString()}`}
        </p>
      )}

      {/* ── Meta row ─────────────────────────────────── */}
      <div
        className="font-mono"
        style={{
          display: 'flex', alignItems: 'center', gap: 'var(--s-3)',
          flexWrap: 'wrap',
          marginTop: 'var(--s-3)',
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--color-ink-muted)',
          letterSpacing: '0.02em',
        }}
      >
        {captain.yearsExperience != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Briefcase size={11} strokeWidth={2} />
            {captain.yearsExperience}yr
          </span>
        )}
        {captain.phone && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Phone size={11} strokeWidth={2} />
            {captain.phone}
          </span>
        )}
        {captain.email && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Mail size={11} strokeWidth={2} />
            {captain.email}
          </span>
        )}
        {captain.languages && captain.languages.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Globe size={11} strokeWidth={2} />
            {captain.languages.join(', ')}
          </span>
        )}
      </div>

      {/* ── Linked boats ─────────────────────────────── */}
      <div
        style={{
          marginTop: 'var(--s-3)',
          paddingTop: 'var(--s-3)',
          borderTop: '1px dashed var(--color-line-soft)',
        }}
      >
        <span
          className="font-mono"
          style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--color-ink-muted)',
            display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
            marginBottom: 'var(--s-2)',
          }}
        >
          <Ship size={11} strokeWidth={2} />
          Linked boats
        </span>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--s-2)' }}>
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
            <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>No boats available</span>
          )}

          {captain.linkedBoats.length === 0 && availableBoats.length > 0 && !showBoatPicker && (
            <span style={{ fontSize: 'var(--t-body-sm)', color: 'var(--color-ink-muted)', fontStyle: 'italic' }}>Not linked to any boat</span>
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
      </div>

      {/* ── Action buttons ───────────────────────────── */}
      {showActions && (
        <div
          style={{
            marginTop: 'var(--s-3)',
            paddingTop: 'var(--s-3)',
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
