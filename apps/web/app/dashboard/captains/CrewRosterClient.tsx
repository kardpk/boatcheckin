'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CaptainCard } from '@/components/dashboard/CaptainCard'
import { CaptainFormSheet } from '@/components/dashboard/CaptainFormSheet'
import type { CaptainProfile, CrewRole } from '@/types'

interface BoatOption {
  id: string
  name: string
}

interface CrewRosterClientProps {
  initialCaptains: CaptainProfile[]
  expiringCaptains: CaptainProfile[]
  operatorBoats: BoatOption[]
}

const ROLE_ORDER: CrewRole[] = ['captain', 'first_mate', 'crew', 'deckhand']
const ROLE_SECTION_LABELS: Record<CrewRole, string> = {
  captain: '👨‍✈️ Captains',
  first_mate: '⚓ First Mates',
  crew: '🧑‍🤝‍🧑 Crew',
  deckhand: '🪢 Deckhands',
}

export function CrewRosterClient({
  initialCaptains,
  expiringCaptains,
  operatorBoats,
}: CrewRosterClientProps) {
  const router = useRouter()
  const [captains, setCaptains] = useState(initialCaptains)
  const [showForm, setShowForm] = useState(false)
  const [editingCaptain, setEditingCaptain] = useState<CaptainProfile | null>(null)

  const handleEdit = useCallback((captain: CaptainProfile) => {
    setEditingCaptain(captain)
    setShowForm(true)
  }, [])

  const handleDeactivate = useCallback(async (captain: CaptainProfile) => {
    if (!window.confirm(`Remove ${captain.fullName} from your crew roster?`)) return

    try {
      const res = await fetch(`/api/dashboard/captains/${captain.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setCaptains(prev => prev.filter(c => c.id !== captain.id))
      }
    } catch {
      // Silent fail
    }
  }, [])

  const handleSaved = useCallback((saved: CaptainProfile) => {
    setCaptains(prev => {
      const exists = prev.find(c => c.id === saved.id)
      if (exists) {
        // Preserve linked boats from existing entry
        const existing = prev.find(c => c.id === saved.id)
        saved.linkedBoats = existing?.linkedBoats ?? []
        return prev.map(c => c.id === saved.id ? saved : c)
      }
      return [saved, ...prev]
    })
    setShowForm(false)
    setEditingCaptain(null)
    router.refresh()
  }, [router])

  const handleBoatLinked = useCallback((captainId: string, boatId: string, boatName: string) => {
    setCaptains(prev => prev.map(c => {
      if (c.id !== captainId) return c
      return {
        ...c,
        linkedBoats: [...c.linkedBoats, { boatId, boatName }],
      }
    }))
  }, [])

  const handleBoatUnlinked = useCallback((captainId: string, boatId: string) => {
    setCaptains(prev => prev.map(c => {
      if (c.id !== captainId) return c
      return {
        ...c,
        linkedBoats: c.linkedBoats.filter(lb => lb.boatId !== boatId),
      }
    }))
  }, [])

  // Group by role
  const grouped = ROLE_ORDER.map(role => ({
    role,
    label: ROLE_SECTION_LABELS[role],
    members: captains.filter(c => c.defaultRole === role),
  })).filter(g => g.members.length > 0)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0D1B2A]">
            👥 Crew Roster
          </h1>
          <p className="text-[14px] text-[#6B7C93] mt-1">
            {captains.length} crew member{captains.length !== 1 ? 's' : ''} in your roster
          </p>
        </div>
        <button
          onClick={() => { setEditingCaptain(null); setShowForm(true) }}
          className="h-[40px] px-4 rounded-[10px] bg-[#0C447C] text-white text-[14px] font-semibold hover:bg-[#093a6b] transition-colors flex items-center gap-2"
        >
          + Add Crew
        </button>
      </div>

      {/* License expiry alerts */}
      {expiringCaptains.length > 0 && (
        <div className="p-4 mb-4 rounded-[14px] bg-[#FEF3DC] border border-[#E5910A]/30">
          <p className="text-[13px] font-bold text-[#92400E] mb-1">
            ⚠️ License Alert
          </p>
          <p className="text-[13px] text-[#78350F]">
            {expiringCaptains.length} crew member{expiringCaptains.length !== 1 ? 's have' : ' has a'} license{expiringCaptains.length !== 1 ? 's' : ''} expiring
            within 30 days: {expiringCaptains.map(c => c.fullName).join(', ')}
          </p>
        </div>
      )}

      {/* Grouped crew cards */}
      {captains.length > 0 ? (
        <div className="space-y-6">
          {grouped.map(group => (
            <div key={group.role}>
              <h2 className="text-[14px] font-bold text-[#6B7C93] uppercase tracking-wider mb-3">
                {group.label}
                <span className="ml-1.5 text-[12px] font-normal">({group.members.length})</span>
              </h2>
              <div className="space-y-3">
                {group.members.map(captain => (
                  <CaptainCard
                    key={captain.id}
                    captain={captain}
                    operatorBoats={operatorBoats}
                    onEdit={handleEdit}
                    onDeactivate={handleDeactivate}
                    onBoatLinked={handleBoatLinked}
                    onBoatUnlinked={handleBoatUnlinked}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-[40px] mb-4">👥</p>
          <h2 className="text-[18px] font-semibold text-[#0D1B2A] mb-2">
            No crew members yet
          </h2>
          <p className="text-[14px] text-[#6B7C93] max-w-xs mx-auto mb-6">
            Add your first crew member to start assigning them to trips. Their profile will appear on guest trip pages.
          </p>
          <button
            onClick={() => { setEditingCaptain(null); setShowForm(true) }}
            className="h-[48px] px-6 rounded-[12px] bg-[#0C447C] text-white font-semibold hover:bg-[#093a6b] transition-colors"
          >
            + Add Your First Crew Member
          </button>
        </div>
      )}

      {/* Form sheet overlay — key resets state when switching between edit targets */}
      {showForm && (
        <CaptainFormSheet
          key={editingCaptain?.id ?? 'new'}
          captain={editingCaptain}
          onSaved={handleSaved}
          onCancel={() => { setShowForm(false); setEditingCaptain(null) }}
        />
      )}
    </>
  )
}
