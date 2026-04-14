'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import type { CaptainProfile } from '@/types'

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

export function CaptainFormSheet({ captain, onSaved, onCancel }: CaptainFormSheetProps) {
  const isEditing = !!captain

  const [form, setForm] = useState({
    fullName: captain?.fullName ?? '',
    phone: captain?.phone ?? '',
    email: captain?.email ?? '',
    bio: captain?.bio ?? '',
    licenseType: captain?.licenseType ?? '',
    licenseNumber: captain?.licenseNumber ?? '',
    licenseExpiry: captain?.licenseExpiry ?? '',
    yearsExperience: captain?.yearsExperience?.toString() ?? '',
    isDefault: captain?.isDefault ?? false,
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function update(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fullName.trim()) {
      setError('Captain name is required')
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
          licenseType: form.licenseType || null,
          licenseNumber: form.licenseNumber || null,
          licenseExpiry: form.licenseExpiry || null,
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
      <div className="w-full max-w-[520px] max-h-[90vh] bg-white rounded-t-[24px] sm:rounded-[20px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#0C447C] px-5 py-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-white">
            {isEditing ? '✏️ Edit Captain' : '👨‍✈️ Add Captain'}
          </h2>
          <button onClick={onCancel} className="text-white/70 hover:text-white text-[14px]">
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={e => update('fullName', e.target.value)}
              placeholder="Captain John Smith"
              className="w-full h-[44px] px-3 rounded-[10px] border border-[#D0E2F3] text-[15px] text-[#0D1B2A] focus:border-[#0C447C] focus:outline-none"
              autoFocus
            />
          </div>

          {/* Phone + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => update('phone', e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full h-[44px] px-3 rounded-[10px] border border-[#D0E2F3] text-[15px] text-[#0D1B2A] focus:border-[#0C447C] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                placeholder="captain@email.com"
                className="w-full h-[44px] px-3 rounded-[10px] border border-[#D0E2F3] text-[15px] text-[#0D1B2A] focus:border-[#0C447C] focus:outline-none"
              />
            </div>
          </div>

          {/* License section */}
          <div className="p-4 bg-[#F5F8FC] rounded-[14px] space-y-3">
            <p className="text-[12px] font-bold text-[#6B7C93] uppercase tracking-wider">
              🪪 USCG License
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#6B7C93] mb-1">License Type</label>
                <select
                  value={form.licenseType}
                  onChange={e => update('licenseType', e.target.value)}
                  className="w-full h-[40px] px-3 rounded-[8px] border border-[#D0E2F3] text-[14px] text-[#0D1B2A] bg-white focus:border-[#0C447C] focus:outline-none"
                >
                  <option value="">Select...</option>
                  {LICENSE_TYPES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-[#6B7C93] mb-1">License Number</label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={e => update('licenseNumber', e.target.value)}
                  placeholder="MMC #"
                  className="w-full h-[40px] px-3 rounded-[8px] border border-[#D0E2F3] text-[14px] text-[#0D1B2A] focus:border-[#0C447C] focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[#6B7C93] mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={form.licenseExpiry}
                  onChange={e => update('licenseExpiry', e.target.value)}
                  className="w-full h-[40px] px-3 rounded-[8px] border border-[#D0E2F3] text-[14px] text-[#0D1B2A] focus:border-[#0C447C] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#6B7C93] mb-1">Years Experience</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={form.yearsExperience}
                  onChange={e => update('yearsExperience', e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full h-[40px] px-3 rounded-[8px] border border-[#D0E2F3] text-[14px] text-[#0D1B2A] focus:border-[#0C447C] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-[12px] font-semibold text-[#6B7C93] uppercase tracking-wider mb-1.5">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={e => update('bio', e.target.value)}
              placeholder="Short bio shown on guest trip pages..."
              rows={3}
              className="w-full px-3 py-2 rounded-[10px] border border-[#D0E2F3] text-[14px] text-[#0D1B2A] focus:border-[#0C447C] focus:outline-none resize-none"
            />
          </div>

          {/* Default toggle */}
          <label className="flex items-center gap-3 cursor-pointer py-2">
            <div
              onClick={() => update('isDefault', !form.isDefault)}
              className={cn(
                'w-10 h-6 rounded-full transition-colors relative',
                form.isDefault ? 'bg-[#0C447C]' : 'bg-[#D0E2F3]'
              )}
            >
              <div className={cn(
                'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm',
                form.isDefault ? 'left-[18px]' : 'left-0.5'
              )} />
            </div>
            <div>
              <p className="text-[14px] font-medium text-[#0D1B2A]">
                Set as default captain
              </p>
              <p className="text-[12px] text-[#6B7C93]">
                Auto-selected when creating new trips
              </p>
            </div>
          </label>

          {/* Error */}
          {error && (
            <p className="text-[13px] text-[#D63B3B] bg-[#FDEAEA] p-3 rounded-[10px]">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 pb-8 pt-4 border-t border-[#D0E2F3] flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-[48px] rounded-[12px] border border-[#D0E2F3] text-[#6B7C93] font-semibold hover:bg-[#F5F8FC] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent)}
            disabled={saving || !form.fullName.trim()}
            className="flex-1 h-[48px] rounded-[12px] bg-[#0C447C] text-white font-bold hover:bg-[#093a6b] transition-colors disabled:opacity-40"
          >
            {saving ? 'Saving...' : isEditing ? 'Save Changes' : '+ Add Captain'}
          </button>
        </div>
      </div>
    </div>
  )
}
