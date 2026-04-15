'use client'

import { Shield, Anchor, Users, HardHat, Briefcase } from 'lucide-react'
import type { CrewRole } from '@/types'

interface CrewMember {
  name: string
  role: string
  license: string | null
}

const ROLE_LABELS: Record<CrewRole, string> = {
  captain: 'Captain',
  first_mate: 'First Mate',
  crew: 'Crew',
  deckhand: 'Deckhand',
}

const ROLE_ICONS: Record<CrewRole, typeof Shield> = {
  captain: Shield,
  first_mate: Anchor,
  crew: Users,
  deckhand: HardHat,
}

export function CrewManifestPanel({
  crewManifest,
  captainName,
  captainLicense,
}: {
  crewManifest: CrewMember[]
  captainName: string | null
  captainLicense: string | null
}) {
  // If no assignments and no boat-default captain, don't render
  if (crewManifest.length === 0 && !captainName) return null

  // If no assignments but boat has a default captain, show just the default
  const effectiveCrew: CrewMember[] = crewManifest.length > 0
    ? crewManifest
    : captainName
      ? [{ name: captainName, role: 'captain', license: captainLicense }]
      : []

  if (effectiveCrew.length === 0) return null

  return (
    <div className="bg-white rounded-[14px] border border-border overflow-hidden">
      <div className="px-card py-[14px] border-b border-border flex items-center gap-[6px]">
        <Shield size={16} className="text-text-dim" />
        <h2 className="text-[16px] font-bold text-navy">
          Crew Manifest
        </h2>
      </div>
      <div className="divide-y divide-border">
        {effectiveCrew.map((member, idx) => {
          const role = member.role as CrewRole
          const RoleIcon = ROLE_ICONS[role] ?? Users
          return (
            <div key={`${member.name}-${idx}`} className="px-card py-[12px] flex items-center gap-[10px]">
              <div className="
                w-[40px] h-[40px] rounded-full bg-[#EBF0F7]
                flex items-center justify-center shrink-0
              ">
                <RoleIcon size={18} className="text-navy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-navy truncate">
                  {member.name}
                </p>
                <div className="flex items-center gap-[6px] mt-[2px]">
                  <span className="text-[12px] text-text-mid font-medium">
                    {ROLE_LABELS[role] ?? member.role}
                  </span>
                  {member.license && (
                    <>
                      <span className="text-border">·</span>
                      <span className="text-[11px] text-navy font-medium flex items-center gap-[3px]">
                        <Briefcase size={10} /> {member.license}
                      </span>
                    </>
                  )}
                </div>
              </div>
              {role === 'captain' && (
                <span className="text-[10px] font-bold text-gold bg-gold-dim border border-gold-line px-[10px] py-[4px] rounded-[5px] shrink-0 uppercase tracking-[0.04em]">
                  PIC
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
