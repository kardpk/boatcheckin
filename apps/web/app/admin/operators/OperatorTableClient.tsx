'use client'

import { useState } from 'react'
import { Users, Search, Shield, ShieldOff, Check, AlertCircle } from 'lucide-react'
import { toggleOperatorActive, setAdminRole } from './actions'

interface OperatorRow {
  id: string
  full_name: string
  email: string
  subscription_tier: string
  subscription_status: string
  is_active: boolean
  admin_role: string | null
  created_at: string
}

const ROLES = [
  { value: null, label: 'None' },
  { value: 'support', label: 'Support' },
  { value: 'member', label: 'Member' },
  { value: 'admin', label: 'Admin' },
  { value: 'founder', label: 'Founder' },
] as const

const TIER_COLORS: Record<string, string> = {
  solo: 'bg-bg text-text-mid',
  captain: 'bg-gold-dim text-gold',
  fleet: 'bg-[#E8F9F4] text-teal',
  marina: 'bg-navy text-white',
}

export function OperatorTableClient({ operators, currentRole }: {
  operators: OperatorRow[]
  currentRole: string
}) {
  const [search, setSearch] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const isFounder = currentRole === 'founder'

  const filtered = operators.filter(op =>
    op.full_name.toLowerCase().includes(search.toLowerCase()) ||
    op.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleToggleActive(id: string, current: boolean) {
    const res = await toggleOperatorActive(id, !current)
    if (res.error) setFeedback({ type: 'error', msg: res.error })
    else setFeedback({ type: 'success', msg: `Operator ${current ? 'deactivated' : 'activated'}` })
  }

  async function handleSetRole(id: string, role: string | null) {
    const res = await setAdminRole(id, role)
    if (res.error) setFeedback({ type: 'error', msg: res.error })
    else setFeedback({ type: 'success', msg: `Role set to ${role ?? 'none'}` })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-navy">Operators</h2>
          <p className="text-[14px] text-text-mid">{operators.length} registered</p>
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-[10px] text-[13px] font-medium ${
          feedback.type === 'success' ? 'bg-[#E8F9F4] text-teal' : 'bg-error-dim text-error'
        }`}>
          {feedback.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          {feedback.msg}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-mid" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-3 py-2.5 rounded-[10px] border border-border text-[14px] text-navy bg-white focus:outline-none focus:border-gold"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[14px] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="px-4 py-3 text-[11px] font-bold text-text-mid uppercase tracking-wider">Operator</th>
                <th className="px-4 py-3 text-[11px] font-bold text-text-mid uppercase tracking-wider">Tier</th>
                <th className="px-4 py-3 text-[11px] font-bold text-text-mid uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[11px] font-bold text-text-mid uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-[11px] font-bold text-text-mid uppercase tracking-wider">Joined</th>
                <th className="px-4 py-3 text-[11px] font-bold text-text-mid uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(op => (
                <tr key={op.id} className={!op.is_active ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <p className="text-[14px] font-medium text-navy">{op.full_name}</p>
                    <p className="text-[12px] text-text-mid">{op.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      TIER_COLORS[op.subscription_tier] ?? 'bg-bg text-text-mid'
                    }`}>
                      {op.subscription_tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[12px] font-medium ${
                      op.subscription_status === 'active' ? 'text-teal' :
                      op.subscription_status === 'trial' ? 'text-gold' : 'text-text-mid'
                    }`}>
                      {op.subscription_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {isFounder ? (
                      <select
                        value={op.admin_role ?? ''}
                        onChange={e => handleSetRole(op.id, e.target.value || null)}
                        className="px-2 py-1 rounded-[6px] border border-border text-[12px] text-navy bg-bg focus:outline-none focus:border-gold"
                      >
                        {ROLES.map(r => (
                          <option key={r.label} value={r.value ?? ''}>{r.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[12px] text-text-mid">{op.admin_role ?? '—'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-text-mid">
                    {new Date(op.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleActive(op.id, op.is_active)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[11px] font-semibold transition-colors ${
                        op.is_active
                          ? 'text-error bg-error-dim hover:bg-error/10'
                          : 'text-teal bg-[#E8F9F4] hover:bg-teal/10'
                      }`}
                    >
                      {op.is_active ? <><ShieldOff size={12} /> Deactivate</> : <><Shield size={12} /> Activate</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
