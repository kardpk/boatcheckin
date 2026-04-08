'use client'

import { useState } from 'react'
import { LANGUAGE_FLAGS, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@/lib/i18n/detect'
import { cn } from '@/lib/utils/cn'
import type { SupportedLang } from '@/lib/i18n/detect'

interface LanguageSelectorProps {
  currentLang: SupportedLang
}

export function LanguageSelector({ currentLang }: LanguageSelectorProps) {
  const [showSheet, setShowSheet] = useState(false)

  function selectLang(lang: SupportedLang) {
    // Persist choice
    try {
      localStorage.setItem('dp-lang', lang)
    } catch {
      // Storage unavailable
    }
    // Reload with URL param so server picks it up
    const url = new URL(window.location.href)
    url.searchParams.set('lang', lang)
    window.location.href = url.toString()
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setShowSheet(true)}
        className="text-[20px] w-[36px] h-[36px] flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 transition-colors"
        aria-label="Select language"
      >
        {LANGUAGE_FLAGS[currentLang]}
      </button>

      {/* Bottom sheet */}
      {showSheet && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowSheet(false)}
          />

          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] pb-[env(safe-area-inset-bottom)]">
            <div className="px-5 pt-4 pb-2">
              <div className="w-10 h-1 bg-[#D0E2F3] rounded-full mx-auto mb-4" />
              <p className="text-[16px] font-semibold text-[#0D1B2A] mb-3">
                Select language
              </p>
            </div>

            <ul className="pb-4">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <li key={lang}>
                  <button
                    onClick={() => selectLang(lang)}
                    className={cn(
                      'w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors',
                      lang === currentLang
                        ? 'bg-[#E8F2FB]'
                        : 'hover:bg-[#F5F8FC]',
                    )}
                  >
                    <span className="text-[22px]">{LANGUAGE_FLAGS[lang]}</span>
                    <span className="flex-1 text-[15px] text-[#0D1B2A]">
                      {LANGUAGE_NAMES[lang]}
                    </span>
                    {lang === currentLang && (
                      <span className="text-[#0C447C] font-bold text-[14px]">✓</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  )
}
