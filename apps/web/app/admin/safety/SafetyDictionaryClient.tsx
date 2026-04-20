'use client'

import { useState, useRef } from 'react'
import { Shield, ChevronDown, ChevronRight, Upload, Volume2, ImageIcon, Plus, Save, Check, AlertCircle } from 'lucide-react'
import { upsertDictionaryRow, uploadSafetyImage, uploadSafetyAudio, addNewTopic } from './actions'

const LANGUAGES = ['en', 'es', 'fr', 'de', 'ar'] as const
const LANG_LABELS: Record<string, string> = {
  en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch', ar: 'العربية',
}

interface DictRow {
  id: string
  topic_key: string
  language_code: string
  title: string
  instructions: string
  audio_url: string | null
  default_image_url: string | null
  emoji: string | null
  updated_at: string
}

interface TopicGroup {
  topicKey: string
  languages: DictRow[]
}

export function SafetyDictionaryClient({ topics }: { topics: TopicGroup[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activeLang, setActiveLang] = useState<string>('en')
  const [showAddForm, setShowAddForm] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-bold text-navy">Safety Dictionary</h2>
          <p className="text-[14px] text-text-mid">{topics.length} topics · {LANGUAGES.length} languages</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-navy text-white text-[13px] font-semibold hover:bg-navy/90 transition-colors"
        >
          <Plus size={14} /> Add Topic
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

      {/* Add new topic form */}
      {showAddForm && (
        <form
          className="bg-white rounded-[14px] border border-border p-5 space-y-3"
          action={async (formData) => {
            const res = await addNewTopic(formData)
            if (res.error) setFeedback({ type: 'error', msg: res.error })
            else { setFeedback({ type: 'success', msg: 'Topic added' }); setShowAddForm(false) }
          }}
        >
          <h3 className="text-[15px] font-bold text-navy">New Safety Topic</h3>
          <input name="topic_key" placeholder="topic_key (e.g. anchor_safety)" required
            className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-navy bg-bg focus:outline-none focus:border-gold" />
          <input name="title" placeholder="Title (English)" required
            className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-navy bg-bg focus:outline-none focus:border-gold" />
          <textarea name="instructions" placeholder="USCG-compliant instructions..." required rows={4}
            className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-navy bg-bg focus:outline-none focus:border-gold resize-none" />
          <div className="flex gap-2">
            <button type="submit"
              className="px-4 py-2.5 rounded-[8px] bg-gold text-white text-[13px] font-semibold hover:bg-gold/90 transition-colors">
              Create Topic
            </button>
            <button type="button" onClick={() => setShowAddForm(false)}
              className="px-4 py-2.5 rounded-[8px] border border-border text-[13px] text-text-mid hover:bg-bg transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Language tabs */}
      <div className="flex gap-1 bg-bg rounded-[10px] p-1">
        {LANGUAGES.map(lang => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`flex-1 py-2 rounded-[8px] text-[13px] font-semibold transition-all ${
              activeLang === lang
                ? 'bg-navy text-white shadow-sm'
                : 'text-text-mid hover:text-navy'
            }`}
          >
            {LANG_LABELS[lang]}
          </button>
        ))}
      </div>

      {/* Topic list */}
      <div className="space-y-2">
        {topics.map(topic => {
          const langRow = topic.languages.find(l => l.language_code === activeLang)
          const coverageCount = topic.languages.length
          const hasAudio = !!langRow?.audio_url
          const hasImage = !!langRow?.default_image_url
          const isExpanded = expanded === topic.topicKey

          return (
            <div key={topic.topicKey} className="bg-white rounded-[14px] border border-border overflow-hidden">
              {/* Header */}
              <button
                onClick={() => setExpanded(isExpanded ? null : topic.topicKey)}
                className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-bg/50 transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} className="text-text-mid" /> : <ChevronRight size={16} className="text-text-mid" />}
                <Shield size={16} className="text-navy" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-navy truncate">
                    {langRow?.title ?? topic.topicKey}
                  </p>
                  <p className="text-[11px] text-text-dim font-mono">{topic.topicKey}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {hasImage && <ImageIcon size={12} className="text-teal" />}
                  {hasAudio && <Volume2 size={12} className="text-teal" />}
                  <span className="text-[11px] text-text-mid bg-bg px-2 py-0.5 rounded-full">
                    {coverageCount}/{LANGUAGES.length} langs
                  </span>
                </div>
              </button>

              {/* Expanded editor */}
              {isExpanded && (
                <TopicEditor
                  topicKey={topic.topicKey}
                  langRow={langRow ?? null}
                  activeLang={activeLang}
                  onFeedback={setFeedback}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopicEditor({ topicKey, langRow, activeLang, onFeedback }: {
  topicKey: string
  langRow: DictRow | null
  activeLang: string
  onFeedback: (f: { type: 'success' | 'error'; msg: string }) => void
}) {
  const [title, setTitle] = useState(langRow?.title ?? '')
  const [instructions, setInstructions] = useState(langRow?.instructions ?? '')
  const [saving, setSaving] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)

  async function handleSave() {
    setSaving(true)
    const fd = new FormData()
    fd.set('topic_key', topicKey)
    fd.set('language_code', activeLang)
    fd.set('title', title)
    fd.set('instructions', instructions)
    const res = await upsertDictionaryRow(fd)
    setSaving(false)
    if (res.error) onFeedback({ type: 'error', msg: res.error })
    else onFeedback({ type: 'success', msg: `${topicKey} (${activeLang}) saved` })
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set('topic_key', topicKey)
    fd.set('language_code', activeLang)
    fd.set('file', file)
    const res = await uploadSafetyImage(fd)
    if (res.error) onFeedback({ type: 'error', msg: res.error })
    else onFeedback({ type: 'success', msg: 'Image uploaded' })
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.set('topic_key', topicKey)
    fd.set('language_code', activeLang)
    fd.set('file', file)
    const res = await uploadSafetyAudio(fd)
    if (res.error) onFeedback({ type: 'error', msg: res.error })
    else onFeedback({ type: 'success', msg: 'Audio uploaded' })
  }

  return (
    <div className="px-5 pb-5 space-y-4 border-t border-border pt-4">
      {!langRow && (
        <div className="bg-gold-dim rounded-[8px] px-3 py-2 text-[12px] text-navy font-medium">
          No {LANG_LABELS[activeLang]} translation yet fill in below to create one.
        </div>
      )}

      <div>
        <label className="block text-[12px] font-semibold text-text-mid mb-1">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-navy focus:outline-none focus:border-gold"
          placeholder="Safety topic title..."
        />
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-text-mid mb-1">Instructions (USCG-grade)</label>
        <textarea
          value={instructions}
          onChange={e => setInstructions(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-[8px] border border-border text-[14px] text-navy focus:outline-none focus:border-gold resize-none leading-relaxed"
          placeholder="Legal-grade safety instructions..."
        />
      </div>

      {/* Upload buttons */}
      <div className="flex gap-3">
        <input ref={imageRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <button
          onClick={() => imageRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-border text-[13px] text-navy font-medium hover:bg-bg transition-colors"
        >
          <ImageIcon size={14} />
          {langRow?.default_image_url ? 'Replace Image' : 'Upload Image'}
        </button>

        <input ref={audioRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} />
        <button
          onClick={() => audioRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] border border-border text-[13px] text-navy font-medium hover:bg-bg transition-colors"
        >
          <Volume2 size={14} />
          {langRow?.audio_url ? 'Replace Audio' : 'Upload Audio'}
        </button>
      </div>

      {/* Status indicators */}
      <div className="flex gap-2">
        {langRow?.default_image_url && (
          <span className="text-[11px] text-teal bg-[#E8F9F4] px-2 py-0.5 rounded-full flex items-center gap-1">
            <ImageIcon size={10} /> Image set
          </span>
        )}
        {langRow?.audio_url && (
          <span className="text-[11px] text-teal bg-[#E8F9F4] px-2 py-0.5 rounded-full flex items-center gap-1">
            <Volume2 size={10} /> Audio set
          </span>
        )}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || (!title && !instructions)}
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-[10px] bg-gold text-white text-[13px] font-semibold hover:bg-gold/90 transition-colors disabled:opacity-40"
      >
        <Save size={14} />
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  )
}
