'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { ChevronDown, Save, FileText, Plus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TripNotesPanelProps {
  token: string
  initialNotes: string
}

export function TripNotesPanel({ token, initialNotes }: TripNotesPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [savedNotes, setSavedNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isDirty = notes !== savedNotes

  // Auto-save after 3s of inactivity
  useEffect(() => {
    if (!isDirty) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveNotes()
    }, 3000)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes])

  const saveNotes = useCallback(async () => {
    if (saving || notes === savedNotes) return
    setSaving(true)
    try {
      const res = await fetch(`/api/captain/${token}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      if (res.ok) {
        setSavedNotes(notes)
        setLastSaved(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      }
    } catch {
      // Silently fail — will retry on next auto-save
    } finally {
      setSaving(false)
    }
  }, [notes, savedNotes, saving, token])

  const addTimestampedEntry = useCallback(() => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const prefix = notes.trim() ? `\n${time} ` : `${time} `
    setNotes(prev => prev + prefix)
    // Focus the textarea and move cursor to end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.selectionStart = textareaRef.current.value.length
        textareaRef.current.selectionEnd = textareaRef.current.value.length
      }
    }, 50)
  }, [notes])

  return (
    <div className="bg-white rounded-[14px] border border-border overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-card py-[14px] flex items-center justify-between"
      >
        <div className="flex items-center gap-[8px]">
          <FileText size={16} className="text-text-dim" />
          <span className="text-[15px] font-bold text-navy">
            Trip Log
          </span>
          {isDirty && (
            <span className="w-[6px] h-[6px] rounded-full bg-warn animate-pulse" />
          )}
          {lastSaved && !isDirty && (
            <span className="text-[11px] text-text-dim font-medium">
              Saved {lastSaved}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={cn(
            'text-text-dim transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="px-card pb-card border-t border-border">
          <p className="text-[12px] text-text-mid mt-[10px] mb-[8px] font-medium">
            Log weather changes, incidents, fuel readings, or observations. Auto-saves after 3s.
          </p>

          <textarea
            ref={textareaRef}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            maxLength={5000}
            rows={5}
            placeholder={"10:15 Wind picked up to 15kt NE\n10:45 Moved to lee side of island\n11:30 Guest reported mild nausea"}
            className="
              w-full px-[12px] py-[10px] rounded-[10px] text-[14px]
              border border-border bg-bg text-navy
              placeholder:text-text-dim/50
              resize-none
              focus:outline-none focus:border-gold focus:bg-white
              transition-colors
            "
          />

          <div className="flex items-center justify-between mt-[8px]">
            <button
              type="button"
              onClick={addTimestampedEntry}
              className="text-[12px] font-semibold text-gold hover:underline flex items-center gap-[4px]"
            >
              <Plus size={12} />
              Add timestamped entry
            </button>

            <div className="flex items-center gap-[8px]">
              <span className="text-[11px] text-text-dim font-medium">
                {notes.length} / 5000
              </span>
              <button
                type="button"
                onClick={saveNotes}
                disabled={!isDirty || saving}
                className="
                  flex items-center gap-[5px] px-[12px] py-[6px] rounded-[8px]
                  text-[12px] font-semibold
                  bg-gold text-white
                  hover:bg-gold-hi transition-colors
                  disabled:opacity-40
                "
              >
                <Save size={12} />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
