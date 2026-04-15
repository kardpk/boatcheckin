'use client'

import { useState } from 'react'
import { Settings, Plus, Save, Trash2, Check, AlertCircle } from 'lucide-react'
import { upsertConfig, deleteConfig } from './actions'

interface ConfigRow {
  key: string
  value: unknown
  description: string | null
  updated_by: string | null
  updated_at: string
}

export function ConfigEditorClient({ config }: { config: ConfigRow[] }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  async function handleAdd() {
    if (!newKey.trim()) return
    const res = await upsertConfig(newKey.trim(), newValue, newDesc)
    if (res.error) setFeedback({ type: 'error', msg: res.error })
    else {
      setFeedback({ type: 'success', msg: `${newKey} created` })
      setNewKey(''); setNewValue(''); setNewDesc(''); setShowAdd(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-navy">Platform Config</h2>
          <p className="text-[14px] text-text-mid">{config.length} keys · Founder access only</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-navy text-white text-[13px] font-semibold hover:bg-navy/90 transition-colors"
        >
          <Plus size={14} /> Add Key
        </button>
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

      {/* Add form */}
      {showAdd && (
        <div className="bg-white rounded-[14px] border border-border p-5 space-y-3">
          <h3 className="text-[15px] font-bold text-navy">New Config Key</h3>
          <input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="key_name"
            className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-navy font-mono bg-bg focus:outline-none focus:border-gold" />
          <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="value (JSON or string)"
            className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-navy bg-bg focus:outline-none focus:border-gold" />
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-text-mid bg-bg focus:outline-none focus:border-gold" />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-4 py-2.5 rounded-[8px] bg-gold text-white text-[13px] font-semibold hover:bg-gold/90">
              Create
            </button>
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2.5 rounded-[8px] border border-border text-[13px] text-text-mid hover:bg-bg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Config rows */}
      <div className="space-y-2">
        {config.map(row => (
          <ConfigRowEditor key={row.key} row={row} onFeedback={setFeedback} />
        ))}
      </div>
    </div>
  )
}

function ConfigRowEditor({ row, onFeedback }: {
  row: ConfigRow
  onFeedback: (f: { type: 'success' | 'error'; msg: string }) => void
}) {
  const stringVal = typeof row.value === 'string' ? row.value : JSON.stringify(row.value)
  const isBool = stringVal === 'true' || stringVal === 'false'
  const [value, setValue] = useState(stringVal)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const res = await upsertConfig(row.key, value)
    setSaving(false)
    if (res.error) onFeedback({ type: 'error', msg: res.error })
    else onFeedback({ type: 'success', msg: `${row.key} updated` })
  }

  async function handleDelete() {
    if (!confirm(`Delete config key "${row.key}"?`)) return
    const res = await deleteConfig(row.key)
    if (res.error) onFeedback({ type: 'error', msg: res.error })
    else onFeedback({ type: 'success', msg: `${row.key} deleted` })
  }

  return (
    <div className="bg-white rounded-[14px] border border-border p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <p className="text-[14px] font-semibold text-navy font-mono">{row.key}</p>
          {row.description && <p className="text-[12px] text-text-mid">{row.description}</p>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button onClick={handleSave} disabled={saving}
            className="p-1.5 rounded-[6px] text-teal hover:bg-[#E8F9F4] transition-colors disabled:opacity-40">
            <Save size={14} />
          </button>
          <button onClick={handleDelete}
            className="p-1.5 rounded-[6px] text-error hover:bg-error-dim transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {isBool ? (
        <button
          onClick={() => {
            const newVal = value === 'true' ? 'false' : 'true'
            setValue(newVal)
          }}
          className={`px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors ${
            value === 'true'
              ? 'bg-[#E8F9F4] text-teal'
              : 'bg-error-dim text-error'
          }`}
        >
          {value === 'true' ? 'Enabled' : 'Disabled'}
        </button>
      ) : (
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full px-3 py-2 rounded-[8px] border border-border text-[14px] text-navy font-mono bg-bg focus:outline-none focus:border-gold"
        />
      )}

      <p className="text-[10px] text-text-dim mt-2">
        Updated {new Date(row.updated_at).toLocaleString()}
      </p>
    </div>
  )
}
