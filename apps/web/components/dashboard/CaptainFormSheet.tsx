'use client'

import { useState } from 'react'
import { Shield, Anchor, Users, HardHat, X, Briefcase, UserPlus, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { CaptainProfile, CrewRole } from '@/types'

interface CaptainFormSheetProps {
  /** If provided, we're editing; otherwise creating */
  captain?: CaptainProfile | null
  onSaved: (captain: CaptainProfile) => void
  onCancel: () => void
}

const LICENSE_TYPES = [
  'OUPV',
  'Master 25 Ton',
  'Master 50 Ton',
  'Master 100 Ton',
  'Master 200 Ton',
  'Master Unlimited',
  'Able Seaman',
  'Other',
] as const

const ROLE_OPTIONS: { value: CrewRole; label: string; Icon: typeof Shield }[] = [
  { value: 'captain', label: 'Captain', Icon: Shield },
  { value: 'first_mate', label: 'First Mate', Icon: Anchor },
  { value: 'crew', label: 'Crew', Icon: Users },
  { value: 'deckhand', label: 'Deckhand', Icon: HardHat },
]

export function CaptainFormSheet({ captain, onSaved, onCancel }: CaptainFormSheetProps) {
  const isEditing = !!captain

  const [form, setForm] = useState({
    fullName: captain?.fullName ?? '',
    phone: captain?.phone ?? '',
    email: captain?.email ?? '',
    bio: captain?.bio ?? '',
    defaultRole: (captain?.defaultRole ?? 'captain') as CrewRole,
    licenseType: captain?.licenseType ?? '',
    licenseNumber: captain?.licenseNumber ?? '',
    licenseExpiry: captain?.licenseExpiry ?? '',
    yearsExperience: captain?.yearsExperience?.toString() ?? '',
    isDefault: captain?.isDefault ?? false,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const showLicense = form.defaultRole === 'captain' || form.defaultRole === 'first_mate'

  function update(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      setError('Name is required')
      return
    }

    setSaving(true)
    setError('')

    try {
      const url = isEditing
        ? `/api/dashboard/captains/${captain!.id}`
        : '/api/dashboard/captains'

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone || null,
          email: form.email || null,
          bio: form.bio || null,
          defaultRole: form.defaultRole,
          licenseType: showLicense ? (form.licenseType || null) : null,
          licenseNumber: showLicense ? (form.licenseNumber || null) : null,
          licenseExpiry: showLicense ? (form.licenseExpiry || null) : null,
          yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : null,
          isDefault: form.isDefault,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error || 'Failed to save')
      }

      const json = await res.json()
      onSaved(json.data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center">
      <div className="w-full max-w-[520px] max-h-[90vh] bg-white rounded-t-[24px] sm:rounded-[14px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-navy px-[18px] py-[14px] flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-white flex items-center gap-[6px]">
            {isEditing ? <><Pencil size={16} /> Edit Crew Member</> : <><UserPlus size={16} /> Add Crew Member</>}
          </h2>
          <button onClick={onCancel} className="text-white/70 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

          {/* Role selector */}
          <div>
            <label className="block text-[12px] font-semibold text-text-dim uppercase tracking-[0.06em] mb-[8px]">
              Role *
            </label>
            <div className="grid grid-cols-2 gap-[8px]">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update('defaultRole', opt.value)}
                  className={cn(
                    'flex items-center gap-[8px] p-[12px] rounded-[10px] border-2 text-left transition-all',
                    form.defaultRole === opt.value
                      ? 'border-gold bg-gold-dim'
                      : 'border-border bg-white hover:border-gold/40'
                  )}
                >
                  <opt.Icon size={16} className={form.defaultRole === opt.value ? 'text-gold' : 'text-text-dim'} />
                  <span className="text-[13px] font-semibold text-navy">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[12px] font-semibold text-text-dim uppercase tracking-[0.06em] mb-[6px]">
              Full Name *
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              placeholder="John Smith"
              className="w-full h-[44px] px-[12px] rounded-[10px] border border-border text-[15px] text-navy focus:border-gold focus:outline-none"
              autoFocus
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-text-dim uppercase tracking-[0.06em] mb-[6px]">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full h-[44px] px-[12px] rounded-[10px] border border-border text-[15px] text-navy focus:border-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-text-dim uppercase tracking-[0.06em] mb-[6px]">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="email@example.com"
                className="w-full h-[44px] px-[12px] rounded-[10px] border border-border text-[15px] text-navy focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* License section — only for captain/first_mate */}
          {showLicense && (
            <div className="p-[14px] bg-bg rounded-[14px] space-y-[10px]">
              <p className="text-[12px] font-bold text-text-dim uppercase tracking-[0.06em] flex items-center gap-[4px]">
                <Briefcase size={12} /> USCG License
              </p>
              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="block text-[11px] text-text-dim mb-[4px]">License Type</label>
                  <select
                    value={form.licenseType}
                    onChange={e => update('licenseType', e.target.value)}
                    className="w-full h-[40px] px-[12px] rounded-[8px] border border-border text-[14px] text-navy bg-white focus:border-gold focus:outline-none"
                  >
                    <option value="">Select...</option>
                    {LICENSE_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-text-dim mb-[4px]">License Number</label>
                  <input
                    type="text"
                    value={form.licenseNumber}
                    onChange={e => update('licenseNumber', e.target.value)}
                    placeholder="MMC #"
                    className="w-full h-[40px] px-[12px] rounded-[8px] border border-border text-[14px] text-navy focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-[10px]">
                <div>
                  <label className="block text-[11px] text-text-dim mb-[4px]">Expiry Date</label>
                  <input
                    type="date"
                    value={form.licenseExpiry}
                    onChange={e => update('licenseExpiry', e.target.value)}
                    className="w-full h-[40px] px-[12px] rounded-[8px] border border-border text-[14px] text-navy focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-text-dim mb-[4px]">Years Experience</label>
                  <input
                    type="number"
                    min="0"
                    max="80"
                    value={form.yearsExperience}
                    onChange={e => update('yearsExperience', e.target.value)}
                    placeholder="e.g. 10"
                    className="w-full h-[40px] px-[12px] rounded-[8px] border border-border text-[14px] text-navy focus:border-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Years experience for non-captain roles */}
          {!showLicense && (
            <div>
              <label className="block text-[12px] font-semibold text-text-dim uppercase tracking-[0.06em] mb-[6px]">
                Years Experience
              </label>
              <input
                type="number"
                min="0"
                max="80"
                value={form.yearsExperience}
                onChange={e => update('yearsExperience', e.target.value)}
                placeholder="e.g. 5"
                className="w-full h-[44px] px-[12px] rounded-[10px] border border-border text-[15px] text-navy focus:border-gold focus:outline-none"
              />
            </div>
          )}

          {/* Bio */}
          <div>
            <label className="block text-[12px] font-semibold text-text-dim uppercase tracking-[0.06em] mb-[6px]">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              placeholder="Short bio shown on guest trip pages..."
              rows={3}
              className="w-full px-[12px] py-[10px] rounded-[10px] border border-border text-[14px] text-navy focus:border-gold focus:outline-none resize-none"
            />
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <div
              onClick={() => update('isDefault', !form.isDefault)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                form.isDefault ? 'bg-gold' : 'bg-border'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm',
                form.isDefault ? 'left-[18px]' : 'left-0.5'
              )} />
            </div>
            <div>
              <p className="text-[14px] font-medium text-navy">
                Set as default
              </p>
              <p className="text-[12px] text-text-mid">
                Auto-selected when creating new trips
              </p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-error bg-error-dim p-[12px] rounded-[10px]">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="px-[18px] pb-[28px] pt-[14px] border-t border-border flex gap-[10px]">
          <button
            onClick={onCancel}
            className="flex-1 h-[48px] rounded-[10px] border border-border text-text-mid font-semibold hover:bg-bg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={saving || !form.fullName.trim()}
            className="flex-1 h-[48px] rounded-[10px] bg-gold text-white font-bold hover:bg-gold-hi transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : '+ Add Crew'}
          </button>
        </div>
      </div>
    </div>
  )
}
