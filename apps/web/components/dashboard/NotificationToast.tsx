'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { AppNotification } from '@/hooks/useOperatorNotifications'

interface NotificationToastProps {
  toasts: AppNotification[]
  onDismiss: (id: string) => void
}

const TOAST_ICONS: Record<string, string> = {
  guest_registered: '👤',
  trip_started: '⚓',
  trip_ended: '✓',
  positive_review: '⭐',
  chat_message: '💬',
  waiver_signed: '📝',
  default: '🔔',
}

export function NotificationToasts({
  toasts, onDismiss,
}: NotificationToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, x: 60 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="
              pointer-events-auto
              flex items-start gap-3
              bg-white border border-[#D0E2F3]
              rounded-[16px] p-4 pr-3
              shadow-[0_4px_20px_rgba(12,68,124,0.15)]
              max-w-[320px]
            "
          >
            <span className="text-[22px] flex-shrink-0 mt-0.5">
              {TOAST_ICONS[toast.type] ?? TOAST_ICONS.default}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#0D1B2A] leading-tight">
                {toast.title}
              </p>
              <p className="text-[13px] text-[#6B7C93] mt-0.5 leading-snug">
                {toast.body}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="
                w-6 h-6 rounded-full flex-shrink-0 mt-0.5
                flex items-center justify-center
                text-[#6B7C93] hover:bg-[#F5F8FC] transition-colors
              "
            >
              <X size={12} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
