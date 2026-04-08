import type { ReactNode } from 'react'
import { Satisfy } from 'next/font/google'

// Satisfy cursive font — used for waiver signature field in the join flow
const satisfy = Satisfy({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-satisfy',
})

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`min-h-screen bg-white ${satisfy.variable}`}>
      {/* No header or footer — guest pages are fully self-contained */}
      {children}
    </div>
  )
}
