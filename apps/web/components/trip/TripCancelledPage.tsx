import Link from 'next/link'

export function TripCancelledPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      
      <h1 className="text-[22px] font-semibold text-navy mb-3">
        This trip has been cancelled
      </h1>
      <p className="text-[15px] text-text-mid mb-8 max-w-[320px] leading-relaxed">
        If you have questions, please contact the operator directly.
      </p>
      <Link
        href="/"
        className="text-[14px] text-navy font-medium hover:underline"
      >
        ← Return home
      </Link>
    </div>
  )
}
