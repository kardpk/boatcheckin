'use client'

import { useState, useTransition } from 'react'
import {
  Bell, Anchor, AlertTriangle, Users, Check,
  ShieldCheck, BellOff, ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

interface NotificationsClientProps {
  initialNotifications: Notification[]
  unreadCount: number
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60_000)  return 'Just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return `${Math.floor(diff / 86_400_000)}d ago`
}

function typeIcon(type: string) {
  if (type.includes('trip_ended') || type.includes('trip_start')) {
    return <Anchor size={16} strokeWidth={1.8} />
  }
  if (type.includes('weather')) {
    return <AlertTriangle size={16} strokeWidth={1.8} />
  }
  if (type.includes('guest') || type.includes('headcount')) {
    return <Users size={16} strokeWidth={1.8} />
  }
  if (type.includes('safety') || type.includes('compliance')) {
    return <ShieldCheck size={16} strokeWidth={1.8} />
  }
  return <Bell size={16} strokeWidth={1.8} />
}

function typeColor(type: string): string {
  if (type.includes('weather') || type.includes('warn')) return 'var(--color-status-warn)'
  if (type.includes('err') || type.includes('cancel')) return 'var(--color-status-err)'
  if (type.includes('end') || type.includes('complet')) return 'var(--color-status-ok)'
  return 'var(--color-brass)'
}

export function NotificationsClient({
  initialNotifications, unreadCount: initialUnread,
}: NotificationsClientProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnread)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  async function markAllRead() {
    setError('')
    startTransition(async () => {
      try {
        const res = await fetch('/api/dashboard/notifications/mark-read', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        if (!res.ok) {
          setError('Failed to mark as read')
          return
        }
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
        setUnreadCount(0)
      } catch {
        setError('Connection error')
      }
    })
  }

  async function markOneRead(id: string) {
    try {
      await fetch('/api/dashboard/notifications/mark-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* non-blocking */ }
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto', padding: 'var(--s-6) var(--s-5) 120px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s-6)' }}>
        <div>
          <Link
            href="/dashboard/settings"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 'var(--s-2)', color: 'var(--color-ink-muted)', fontSize: 13, textDecoration: 'none' }}
          >
            <ChevronLeft size={14} strokeWidth={2} /> More
          </Link>
          <h1 className="font-display" style={{ fontSize: 'clamp(26px, 5vw, 32px)', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--color-ink)', lineHeight: 1.0, margin: 0 }}>
            Notifications
          </h1>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={isPending}
            className="btn btn--sm"
            style={{ flexShrink: 0 }}
          >
            <Check size={12} strokeWidth={2.5} />
            Mark all read
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert--err" style={{ marginBottom: 'var(--s-4)' }}>
          <span>{error}</span>
        </div>
      )}

      {/* Notification list */}
      {notifications.length === 0 ? (
        <div className="tile" style={{ padding: 'var(--s-10)', textAlign: 'center', borderStyle: 'dashed' }}>
          <BellOff size={28} strokeWidth={1.5} style={{ color: 'var(--color-ink-muted)', marginBottom: 12 }} />
          <p style={{ fontSize: 15, color: 'var(--color-ink-muted)' }}>No notifications yet.</p>
          <p style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 6 }}>
            Trip events, weather alerts, and guest activity will appear here.
          </p>
        </div>
      ) : (
        <div className="tile" style={{ padding: 0, overflow: 'hidden' }}>
          {notifications.map((n, idx) => {
            const isUnread = !n.read_at
            const color    = typeColor(n.type)
            const isLast   = idx === notifications.length - 1

            return (
              <div
                key={n.id}
                onClick={() => isUnread && markOneRead(n.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--s-3)',
                  padding: 'var(--s-4)',
                  borderLeft: isUnread ? `4px solid ${color}` : '4px solid transparent',
                  borderBottom: isLast ? 'none' : '1px solid var(--color-line-soft)',
                  cursor: isUnread ? 'pointer' : 'default',
                  background: isUnread ? 'rgba(0,0,0,0.015)' : 'transparent',
                  transition: 'background 150ms',
                }}
              >
                {/* Icon */}
                <div style={{ color, flexShrink: 0, marginTop: 1 }}>
                  {typeIcon(n.type)}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: isUnread ? 600 : 500, color: 'var(--color-ink)', lineHeight: 1.3, marginBottom: 2 }}>
                    {n.title}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.4 }}>
                    {n.body}
                  </p>
                </div>

                {/* Time */}
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--color-ink-muted)', flexShrink: 0, marginTop: 2, letterSpacing: '0.04em' }}>
                  {relativeTime(n.created_at)}
                </span>

                {/* Unread dot */}
                {isUnread && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 4 }} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
