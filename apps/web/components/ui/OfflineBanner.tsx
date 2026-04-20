'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  )
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    function handleOffline() {
      setIsOffline(true)
      setWasOffline(true)
    }
    function handleOnline() {
      setIsOffline(false)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline ? (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          className="
            fixed top-0 left-0 right-0 z-[70]
            bg-[#E5910A] text-white
            flex items-center justify-center
            py-2 px-4 text-[13px] font-medium
          "
        >
          You&apos;re offline some features unavailable
        </motion.div>
      ) : wasOffline ? (
        <motion.div
          initial={{ y: -48 }}
          animate={{ y: 0 }}
          exit={{ y: -48 }}
          transition={{ duration: 0.3 }}
          className="
            fixed top-0 left-0 right-0 z-[70]
            bg-[#1D9E75] text-white
            flex items-center justify-center
            py-2 px-4 text-[13px] font-medium
          "
          onAnimationComplete={() => {
            setTimeout(() => setWasOffline(false), 2000)
          }}
        >
          ✓ Back online
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
