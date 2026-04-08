'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { cn } from '@/lib/utils/cn'
import { QUICK_CHIPS } from '@/types'
import type { GuestSession, TripStatus, ChatMessage } from '@/types'

interface ChatWidgetProps {
  tripId: string
  tripStatus: TripStatus
  session: GuestSession | null
  captainName: string | null
}

export function ChatWidget({
  tripId, tripStatus, session, captainName,
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const enabled = tripStatus === 'active' && !!session

  const chat = useChat({
    tripId,
    senderId: session?.guestId ?? 'anonymous',
    senderType: 'guest',
    senderName: session?.guestName ?? 'Guest',
    enabled,
  })

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [chat.messages, isOpen])

  useEffect(() => {
    if (isOpen && chat.unreadCount > 0) {
      chat.markAllRead()
    }
  }, [isOpen]) // eslint-disable-line

  useEffect(() => {
    if (tripStatus === 'active' && session && !isOpen) {
      const t = setTimeout(() => {
        if (chat.messages.some(m => m.senderType === 'captain')) {
          setIsOpen(true)
        }
      }, 2000)
      return () => clearTimeout(t)
    }
  }, [tripStatus, session]) // eslint-disable-line

  if (!enabled) return null

  async function handleSend(text?: string) {
    const body = text ?? inputText.trim()
    if (!body) return
    await chat.sendMessage(body)
    setInputText('')
  }

  async function handleChip(chip: typeof QUICK_CHIPS[number]) {
    await chat.sendMessage(chip.label, chip.key)
  }

  const captainDisplayName = captainName ?? 'Your captain'

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed bottom-24 right-4 z-40
          w-14 h-14 rounded-full
          bg-[#0C447C] text-white
          shadow-[0_4px_16px_rgba(12,68,124,0.4)]
          flex items-center justify-center
          hover:bg-[#093a6b] transition-colors
          active:scale-95
        "
        aria-label="Open chat"
      >
        <MessageCircle size={22} />
        {chat.unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1
            w-5 h-5 rounded-full
            bg-[#E8593C] text-white
            text-[10px] font-bold
            flex items-center justify-center
          ">
            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
          </span>
        )}
      </button>

      {/* Chat sheet */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="
              fixed inset-x-0 bottom-0 z-50
              bg-white rounded-t-[20px]
              flex flex-col
              max-h-[70vh]
              shadow-[0_-4px_24px_rgba(12,68,124,0.15)]
            "
          >
            {/* Handle + header */}
            <div className="flex-shrink-0 pt-3 pb-2 px-5 border-b border-[#F5F8FC]">
              <div className="w-10 h-1 bg-[#D0E2F3] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="
                    w-8 h-8 rounded-full bg-[#0C447C]
                    flex items-center justify-center
                    text-white text-[13px] font-bold
                  ">
                    {captainDisplayName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-[#0D1B2A]">
                      {captainDisplayName}
                    </p>
                    <p className={cn(
                      'text-[11px]',
                      chat.connectionStatus === 'connected'
                        ? 'text-[#1D9E75]'
                        : 'text-[#6B7C93]'
                    )}>
                      {chat.connectionStatus === 'connected' ? '● Live' : '○ Connecting...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#F5F8FC] flex items-center justify-center text-[#6B7C93]"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {chat.isLoading ? (
                <p className="text-center text-[13px] text-[#6B7C93] py-4">
                  Loading...
                </p>
              ) : chat.messages.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-[15px] text-[#6B7C93] mb-1">
                    Ask {captainDisplayName} anything
                  </p>
                  <p className="text-[13px] text-[#6B7C93]">
                    Quick questions below, or type your own
                  </p>
                </div>
              ) : (
                chat.messages.map(msg => (
                  <ChatBubble
                    key={msg.id}
                    message={msg}
                    isMine={msg.senderType === 'guest'}
                  />
                ))
              )}
              {chat.isTyping && (
                <div className="flex items-center gap-2">
                  <TypingIndicator />
                  <span className="text-[12px] text-[#6B7C93]">
                    {captainDisplayName} is typing...
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick chips */}
            {chat.messages.length < 2 && (
              <div className="px-4 pb-2 flex gap-2 overflow-x-auto scrollbar-hide">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip.key}
                    onClick={() => handleChip(chip)}
                    className="
                      flex-shrink-0 h-[36px] px-3 rounded-full
                      border border-[#D0E2F3] bg-white
                      text-[13px] text-[#0D1B2A] font-medium
                      hover:border-[#0C447C] hover:bg-[#E8F2FB]
                      transition-colors whitespace-nowrap
                      flex items-center gap-1.5
                    "
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="
              flex-shrink-0 px-4
              pb-[calc(0.75rem+env(safe-area-inset-bottom))]
              pt-3 border-t border-[#F5F8FC]
              flex items-center gap-2
            ">
              <input
                type="text"
                value={inputText}
                onChange={e => {
                  setInputText(e.target.value)
                  if (e.target.value) chat.sendTyping()
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type a message..."
                maxLength={500}
                className="
                  flex-1 h-[44px] px-4 rounded-full text-[15px]
                  border border-[#D0E2F3] bg-white text-[#0D1B2A]
                  placeholder:text-[#6B7C93]
                  focus:outline-none focus:border-[#0C447C]
                "
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim()}
                className="
                  w-11 h-11 rounded-full
                  bg-[#0C447C] text-white
                  flex items-center justify-center
                  hover:bg-[#093a6b] transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed
                "
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ChatBubble({
  message, isMine,
}: {
  message: ChatMessage
  isMine: boolean
}) {
  const isSystem = message.senderType === 'system'

  if (isSystem) {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[12px] text-[#6B7C93] bg-[#F5F8FC] px-3 py-1 rounded-full">
          {message.body}
        </span>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col max-w-[80%]',
      isMine ? 'items-end ml-auto' : 'items-start mr-auto'
    )}>
      {!isMine && (
        <span className="text-[11px] text-[#6B7C93] mb-0.5 px-1">
          {message.senderName}
        </span>
      )}
      <div className={cn(
        'px-4 py-2.5 rounded-[18px] text-[15px] leading-relaxed',
        isMine
          ? 'bg-[#0C447C] text-white rounded-tr-[4px]'
          : 'bg-[#F5F8FC] text-[#0D1B2A] rounded-tl-[4px]'
      )}>
        {message.body}
      </div>
      <span className="text-[10px] text-[#6B7C93] mt-0.5 px-1">
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: '2-digit', minute: '2-digit',
        })}
      </span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 bg-[#F5F8FC] px-3 py-2 rounded-[18px] rounded-tl-[4px]">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#6B7C93] animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
