'use client'

import { useState, useEffect, useCallback } from 'react'
import { UserRound, Plus, X, ArrowRight, ChevronRight } from 'lucide-react'

interface CaptainOption {
  id: string
  fullName: string
  photoUrl: string | null
  licenseType: string | null
  isDefault: boolean
}

interface Assignment {
  captainId: string
  captainName: string
  role: string
}

interface TripCrewPanelProps {
  tripId: string
  tripStatus: string
  initialAssignments: Assignment[]
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export function TripCrewPanel({
  tripId, tripStatus, initialAssignments,
}: TripCrewPanelProps) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [captains, setCaptains] = useState<CaptainOption[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const isLocked = tripStatus !== 'upcoming'

  useEffect(() => {
    if (showPicker && captains.length === 0) {
      fetch('/api/dashboard/captains')
        .then(r => r.json())
        .then(json => {
          setCaptains(
            (json.data ?? []).map((c: Record<string, unknown>) => ({
              id: c.id,
              fullName: c.fullName,
              photoUrl: c.photoUrl,
              licenseType: c.licenseType,
              isDefault: c.isDefault,
            }))
          )
        })
        .catch(() => {})
    }
  }, [showPicker, captains.length])

  const handleAssign = useCallback(async (captainId: string, captainName: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/trips/${tripId}/assign-crew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captainId, role: 'captain' }),
      })
      if (res.ok) {
        setAssignments(prev => {
          const filtered = prev.filter(a => a.role !== 'captain')
          return [...filtered, { captainId, captainName, role: 'captain' }]
        })
        setShowPicker(false)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [tripId])

  const handleRemove = useCallback(async (captainId: string) => {
    if (!window.confirm('Remove this crew member from the trip?')) return
    try {
      await fetch(`/api/dashboard/trips/${tripId}/assign-crew`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ captainId }),
      })
      setAssignments(prev => prev.filter(a => a.captainId !== captainId))
    } catch {
      // silent
    }
  }, [tripId])

  const currentCaptain = assignments.find(a => a.role === 'captain')
  const otherCrew = assignments.filter(a => a.role !== 'captain')

  return (
    <section style={{ marginTop: 'var(--s-8)' }}>

      {/* ── Section kicker ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--s-3)',
          borderBottom: 'var(--border-w) solid var(--color-ink)',
          marginBottom: 'var(--s-4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}>
          <UserRound size={14} strokeWidth={2} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
          <span
            className="font-mono"
            style={{
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'var(--color-ink)',
            }}
          >
            Crew assignment
          </span>
        </div>
        {isLocked && (
          <span className="pill pill--ghost">Locked</span>
        )}
      </div>

      {/* ── Captain tile ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-2)' }}>

        {currentCaptain ? (
          <div
            className="tile"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderLeft: '4px solid var(--color-ink)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s-3)',
                padding: 'var(--s-3) var(--s-4)',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 40, height: 40,
                  borderRadius: 'var(--r-1)',
                  background: 'var(--color-ink)',
                  color: 'var(--color-bone)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '13px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                }}
              >
                {initials(currentCaptain.captainName)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="font-display"
                  style={{ fontSize: '15px', fontWeight: 500, color: 'var(--color-ink)', lineHeight: 1.2 }}
                >
                  {currentCaptain.captainName}
                </p>
                <p
                  className="font-mono"
                  style={{
                    fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--color-ink-muted)',
                    marginTop: 2,
                  }}
                >
                  Captain · PIC
                </p>
              </div>

              {/* Actions */}
              {!isLocked && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)', flexShrink: 0 }}>
                  <button
                    onClick={() => setShowPicker(true)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500, color: 'var(--color-ink)',
                      textDecoration: 'underline', textDecorationColor: 'var(--color-line)',
                      padding: 0,
                    }}
                  >
                    Swap
                  </button>
                  <button
                    onClick={() => handleRemove(currentCaptain.captainId)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', fontWeight: 500, color: 'var(--color-status-err)',
                      textDecoration: 'underline', textDecorationColor: 'var(--color-status-err)',
                      padding: 0,
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No captain assigned */
          <div
            className="tile"
            style={{
              padding: 'var(--s-5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--s-3)',
              textAlign: 'center',
              borderStyle: isLocked ? 'solid' : 'dashed',
            }}
          >
            <UserRound
              size={24}
              strokeWidth={1.5}
              style={{ color: 'var(--color-ink-muted)', opacity: 0.5 }}
            />
            <p style={{ fontSize: '13px', color: 'var(--color-ink-muted)' }}>
              {isLocked ? 'No captain assigned' : 'No captain assigned yet'}
            </p>
            {!isLocked && (
              <button
                onClick={() => setShowPicker(true)}
                className="btn btn--sm"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-2)' }}
              >
                <Plus size={13} strokeWidth={2.5} />
                Assign captain
              </button>
            )}
          </div>
        )}

        {/* Other crew members */}
        {otherCrew.map(member => (
          <div
            key={member.captainId}
            className="tile"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderLeft: '4px solid var(--color-line-soft)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--s-3)',
                padding: 'var(--s-3) var(--s-4)',
              }}
            >
              <div
                style={{
                  width: 32, height: 32,
                  borderRadius: 'var(--r-1)',
                  background: 'var(--color-bone)',
                  border: '1px solid var(--color-line-soft)',
                  color: 'var(--color-ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  flexShrink: 0,
                }}
              >
                {initials(member.captainName)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-ink)' }}>
                  {member.captainName}
                </p>
                <p
                  className="font-mono"
                  style={{
                    fontSize: '10px', fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--color-ink-muted)', marginTop: 1,
                  }}
                >
                  {member.role.replace(/_/g, ' ')}
                </p>
              </div>
              {!isLocked && (
                <button
                  onClick={() => handleRemove(member.captainId)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--color-ink-muted)', flexShrink: 0, padding: 4,
                  }}
                  aria-label="Remove crew member"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Captain picker */}
        {showPicker && (
          <div
            className="tile"
            style={{ overflow: 'hidden', padding: 0 }}
          >
            <div
              style={{
                padding: 'var(--s-3) var(--s-4)',
                background: 'var(--color-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--color-bone)',
                }}
              >
                Select from roster
              </span>
              <button
                onClick={() => setShowPicker(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--color-bone)', opacity: 0.6, display: 'flex', padding: 0,
                }}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>
            <div>
              {captains.length === 0 && (
                <p style={{ padding: 'var(--s-4)', fontSize: '13px', color: 'var(--color-ink-muted)' }}>
                  Loading roster...
                </p>
              )}
              {captains.map((captain, idx) => {
                const isAssigned = assignments.some(a => a.captainId === captain.id)
                return (
                  <button
                    key={captain.id}
                    type="button"
                    disabled={loading}
                    onClick={() => handleAssign(captain.id, captain.fullName)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--s-3)',
                      padding: 'var(--s-3) var(--s-4)',
                      borderBottom: idx === captains.length - 1 ? 'none' : '1px solid var(--color-line-soft)',
                      background: isAssigned ? 'var(--color-bone)' : 'var(--color-paper)',
                      borderLeft: isAssigned ? '4px solid var(--color-ink)' : '4px solid transparent',
                      cursor: 'pointer',
                      opacity: loading ? 0.5 : 1,
                      transition: 'background 0.12s',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: 32, height: 32,
                        borderRadius: 'var(--r-1)',
                        background: 'var(--color-ink)',
                        color: 'var(--color-bone)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                      }}
                    >
                      {initials(captain.fullName)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-ink)' }}>
                        {captain.fullName}
                        {captain.isDefault && (
                          <span
                            className="font-mono"
                            style={{ marginLeft: 6, fontSize: '10px', color: 'var(--color-brass)' }}
                          >
                            Default
                          </span>
                        )}
                      </p>
                      {captain.licenseType && (
                        <p className="font-mono" style={{ fontSize: '10px', color: 'var(--color-ink-muted)', marginTop: 1 }}>
                          {captain.licenseType}
                        </p>
                      )}
                    </div>
                    <ChevronRight size={14} strokeWidth={2} style={{ color: 'var(--color-ink-muted)', flexShrink: 0 }} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Roster link */}
        {!isLocked && (
          <a
            href="/dashboard/captains"
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--s-1)',
              fontSize: '12px', color: 'var(--color-ink-muted)',
              textDecoration: 'none', marginTop: 'var(--s-1)',
              justifyContent: 'center',
            }}
          >
            Manage crew roster
            <ArrowRight size={12} strokeWidth={2.5} />
          </a>
        )}
      </div>
    </section>
  )
}
