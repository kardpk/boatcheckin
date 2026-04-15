'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils/cn'

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

export function TripCrewPanel({
  tripId,
  tripStatus,
  initialAssignments,
}: TripCrewPanelProps) {
  const [assignments, setAssignments] = useState(initialAssignments)
  const [captains, setCaptains] = useState<CaptainOption[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const isLocked = tripStatus !== 'upcoming'

  // Fetch captain roster
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
          // Replace existing captain, keep other crew
          const filtered = prev.filter(a => a.role !== 'captain')
          return [...filtered, { captainId, captainName, role: 'captain' }]
        })
        setShowPicker(false)
      }
    } catch {
      // Silent fail
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
      // Silent fail
    }
  }, [tripId])

  const currentCaptain = assignments.find(a => a.role === 'captain')
  const otherCrew = assignments.filter(a => a.role !== 'captain')

  return (
    <div className="bg-white rounded-[16px] border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <h2 className="text-[16px] font-semibold text-navy">
          Crew Assignment
        </h2>
        {isLocked && (
          <span className="text-[11px] text-text-mid bg-bg px-2 py-0.5 rounded-full">
            Locked
          </span>
        )}
      </div>

      <div className="p-5 space-y-3">
        {/* Current captain */}
        {currentCaptain ? (
          <div className="flex items-center gap-3 p-3 rounded-[12px] bg-gold-dim border border-border">
            <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-[14px] font-bold flex-shrink-0">
              {currentCaptain.captainName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-navy truncate">
                {currentCaptain.captainName}
              </p>
              <p className="text-[12px] text-navy font-medium">Captain · PIC</p>
            </div>
            {!isLocked && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setShowPicker(true)}
                  className="text-[12px] text-navy hover:underline font-medium"
                >
                  Swap
                </button>
                <span className="text-[#D0E2F3]">·</span>
                <button
                  onClick={() => handleRemove(currentCaptain.captainId)}
                  className="text-[12px] text-error hover:underline font-medium"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-[14px] text-text-mid mb-2">
              No captain assigned
            </p>
            {!isLocked && (
              <button
                onClick={() => setShowPicker(true)}
                className="h-[36px] px-4 rounded-[8px] bg-navy text-white text-[13px] font-semibold hover:bg-navy/90 transition-colors"
              >
                + Assign Captain
              </button>
            )}
          </div>
        )}

        {/* Other crew */}
        {otherCrew.map(member => (
          <div key={member.captainId} className="flex items-center gap-3 p-3 rounded-[12px] bg-bg">
            <div className="w-8 h-8 rounded-full bg-border flex items-center justify-center text-[12px] font-bold text-navy">
              {member.captainName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-navy truncate">{member.captainName}</p>
              <p className="text-[11px] text-text-mid capitalize">{member.role.replace(/_/g, ' ')}</p>
            </div>
            {!isLocked && (
              <button
                onClick={() => handleRemove(member.captainId)}
                className="text-[11px] text-error hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        ))}

        {/* Captain picker overlay */}
        {showPicker && (
          <div className="mt-2 p-3 border border-[#0C447C] rounded-[12px] bg-white space-y-2">
            <p className="text-[12px] font-bold text-text-mid uppercase tracking-wider mb-2">
              Select from roster
            </p>
            {captains.length === 0 && (
              <p className="text-[13px] text-text-mid py-2">Loading roster...</p>
            )}
            {captains.map(captain => (
              <button
                key={captain.id}
                type="button"
                disabled={loading}
                onClick={() => handleAssign(captain.id, captain.fullName)}
                className={cn(
                  'w-full flex items-center gap-3 p-2.5 rounded-[8px] text-left transition-all',
                  'hover:bg-gold-dim disabled:opacity-50',
                  assignments.some(a => a.captainId === captain.id)
                    ? 'bg-gold-dim border border-[#0C447C]'
                    : 'border border-transparent'
                )}
              >
                <div className="w-8 h-8 rounded-full bg-gold-dim flex items-center justify-center text-[12px] font-bold text-navy">
                  {captain.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-navy truncate">
                    {captain.fullName}
                    {captain.isDefault && (
                      <span className="ml-1 text-[9px] font-bold text-navy bg-gold-dim px-1.5 py-0.5 rounded-full"> ★</span>
                    )}
                  </p>
                  {captain.licenseType && (
                    <p className="text-[11px] text-text-mid">{captain.licenseType}</p>
                  )}
                </div>
              </button>
            ))}
            <button
              onClick={() => setShowPicker(false)}
              className="w-full h-[32px] text-[12px] text-text-mid hover:text-navy"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Link to roster */}
        {!isLocked && (
          <p className="text-[11px] text-text-mid text-center pt-1">
            <a href="/dashboard/captains" className="text-navy underline">
              Manage crew roster →
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
