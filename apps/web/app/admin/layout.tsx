import { requireAdmin } from '@/lib/security/auth'
import Link from 'next/link'
import { Shield, BarChart3, Users, Settings, ChevronLeft } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', label: 'Pulse', icon: BarChart3 },
  { href: '/admin/safety', label: 'Safety Dictionary', icon: Shield },
  { href: '/admin/operators', label: 'Operators', icon: Users },
  { href: '/admin/config', label: 'Config', icon: Settings },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { operator, adminRole } = await requireAdmin('member')

  return (
    <div className="min-h-screen bg-bg">
      {/* Top bar */}
      <header className="bg-navy text-white">
        <div className="max-w-[1024px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronLeft size={16} />
            </Link>
            <div>
              <h1 className="text-[15px] font-bold tracking-wide">BoatCheckin Admin</h1>
              <p className="text-[11px] text-white/60">{operator.full_name} · {adminRole}</p>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="max-w-[1024px] mx-auto px-4 flex gap-1 overflow-x-auto pb-0">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium text-white/70 hover:text-white border-b-2 border-transparent hover:border-white/30 transition-all whitespace-nowrap"
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Content */}
      <main className="max-w-[1024px] mx-auto p-4">
        {children}
      </main>
    </div>
  )
}
