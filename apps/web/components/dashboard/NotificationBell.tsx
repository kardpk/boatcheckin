'use client'

import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import { useOperatorNotifications } from '@/hooks/useOperatorNotifications'

interface NotificationBellProps {
  operatorId: string
}

const NOTIFICATION_ICONS: Record<string, string> = {
  guest_registered: '○',
  trip_started: '▶',
  trip_ended: '✓',
  positive_review: '★',
  chat_message: '✉',
  default: '⚠',
}

export function NotificationBell({ operatorId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const {
    notifications, unreadCount,
    markRead, markAllRead,
  } = useOperatorNotifications(operatorId)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative w-10 h-10 rounded-full
          flex items-center justify-center
          text-white/70 hover:bg-white/10
          transition-colors
        "
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="
            absolute top-1 right-1
            w-4 h-4 rounded-full bg-[#E8593C]
            text-white text-[9px] font-bold
            flex items-center justify-center
          ">
            {unreadCount > 9 ? '9' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="
            absolute right-0 top-12 z-50
            w-[320px] bg-white rounded-[14px]
            border border-border
            shadow-[0_8px_32px_rgba(11,29,58,0.15)]
            overflow-hidden
          ">
            <div className="px-[14px] py-[10px] border-b border-border flex items-center justify-between">
              <span className="text-[14px] font-bold text-navy">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[12px] text-gold hover:underline flex items-center gap-[4px] font-medium"
                >
                  <Check size={12} />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-[14px] text-text-mid">
                    All caught up
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="flex items-start gap-[10px] px-[14px] py-[10px] hover:bg-bg cursor-pointer"
                      onClick={() => markRead(n.id)}
                    >
                      <span className="text-[18px] flex-shrink-0 mt-0.5">
                        {NOTIFICATION_ICONS[n.type] ?? NOTIFICATION_ICONS.default}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-navy leading-tight">
                          {n.title}
                        </p>
                        <p className="text-[12px] text-text-mid mt-[3px] leading-snug truncate">
                          {n.body}
                        </p>
                        <p className="text-[11px] text-text-dim mt-[3px]">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="w-[6px] h-[6px] rounded-full bg-gold flex-shrink-0 mt-2" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
