import Link from 'next/link'

export function EmptyDashboard({ operatorName }: { operatorName: string }) {
  return (
    <div className="max-w-[640px] mx-auto px-4 py-12 text-center">
      <div className="text-[64px] mb-4">⚓</div>
      <h1 className="text-[24px] font-bold text-[#0D1B2A] mb-2">
        Welcome aboard, {operatorName}!
      </h1>
      <p className="text-[16px] text-[#6B7C93] mb-8 max-w-[400px] mx-auto">
        Set up your boat profile to start creating trips and checking in guests.
      </p>
      <Link
        href="/dashboard/boats/new"
        className="
          inline-flex items-center justify-center
          h-[56px] px-8 rounded-[14px]
          bg-[#0C447C] text-white font-semibold text-[16px]
          hover:bg-[#093a6b] transition-colors
          shadow-[0_4px_12px_rgba(12,68,124,0.3)]
        "
      >
        Set up my boat →
      </Link>
    </div>
  )
}
