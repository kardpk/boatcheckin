'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Anchor, Users, HardHat, UserPlus, AlertTriangle } from 'lucide-react'
import { CaptainCard } from '@/components/dashboard/CaptainCard'
import { CaptainFormSheet } from '@/components/dashboard/CaptainFormSheet'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { AlertCard } from '@/components/ui/AlertCard'
import type { CaptainProfile, CrewRole } from '@/types'

interface BoatOption { id: string; name: string }

interface CrewRosterClientProps {
  initialCaptains: CaptainProfile[]
  expiringCaptains: CaptainProfile[]
  operatorBoats: BoatOption[]
}

const ROLE_ORDER: CrewRole[] = ['captain', 'first_mate', 'crew', 'deckhand']
const ROLE_SECTION: Record<CrewRole, { label: string; Icon: typeof Shield }> = {
  captain: { label: 'Captains', Icon: Shield },
  first_mate: { label: 'First Mates', Icon: Anchor },
  crew: { label: 'Crew', Icon: Users },
  deckhand: { label: 'Deckhands', Icon: HardHat },
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
    config: ROLE_SECTION[role],
    members: captains.filter(c => c.defaultRole === role),
  })).filter(g => g.members.length > 0)

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-[16px]">
        <div>
          <h1 className="text-[22px] font-bold text-navy">
            Crew Roster
          </h1>
          <p className="text-[14px] text-text-mid mt-[3px] font-medium">
            {captains.length} crew member{captains.length !== 1 ? 's' : ''} in your roster
          </p>
        </div>
        <button
          onClick={() => { setEditingCaptain(null); setShowForm(true) }}
          className="
            h-[42px] px-[18px] rounded-[10px]
            bg-gold text-white text-[14px] font-semibold
            hover:bg-gold-hi transition-colors
            flex items-center gap-[6px]
          "
        >
          <UserPlus size={16} />
          Add Crew
        </button>
      </div>

      {/* License expiry alerts */}
      {expiringCaptains.length > 0 && (
        <div className="mb-[14px]">
          <AlertCard variant="warn" title="License Alert">
            {expiringCaptains.length} crew member{expiringCaptains.length !== 1 ? 's have' : ' has a'} license{expiringCaptains.length !== 1 ? 's' : ''} expiring
            within 30 days: {expiringCaptains.map(c => c.fullName).join(', ')}
          </AlertCard>
        </div>
      )}

      {/* Grouped crew cards */}
      {captains.length > 0 ? (
        <div className="space-y-[20px]">
          {grouped.map(group => (
            <div key={group.role}>
              <SectionLabel
                title={group.config.label}
                count={group.members.length}
                icon={<group.config.Icon size={16} className="text-text-dim" />}
              />
              <div className="space-y-[10px] mt-[10px]">
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
        <div className="text-center py-[48px]">
          <div className="w-[64px] h-[64px] mx-auto mb-[14px] rounded-full bg-gold-dim border border-gold-line flex items-center justify-center">
            <Users size={28} className="text-gold" />
          </div>
          <h2 className="text-[18px] font-bold text-navy mb-[6px]">
            No crew members yet
          </h2>
          <p className="text-[14px] text-text-mid max-w-xs mx-auto mb-[20px]">
            Add your first crew member to start assigning them to trips. Their profile will appear on guest trip pages.
          </p>
          <button
            onClick={() => { setEditingCaptain(null); setShowForm(true) }}
            className="h-[48px] px-[24px] rounded-[10px] bg-gold text-white font-semibold hover:bg-gold-hi transition-colors"
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
