import Link from 'next/link'

export function TripCancelledPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <div className="text-[64px] text-[#6B7C93] mb-6">⚓</div>
      <h1 className="text-[22px] font-semibold text-[#0D1B2A] mb-3">
        This trip has been cancelled
      </h1>
      <p className="text-[15px] text-[#6B7C93] mb-8 max-w-[320px] leading-relaxed">
        If you have questions, please contact the operator directly.
      </p>
      <Link
        href="/"
        className="text-[14px] text-[#0C447C] font-medium hover:underline"
      >
        ← Return home
      </Link>
    </div>
  )
}
