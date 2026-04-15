export function RebookSection({
  boatName, boatsetterUrl,
}: {
  boatName: string
  boatsetterUrl: string | null
}) {
  return (
    <div className="bg-white rounded-[14px] border border-border p-5 shadow-[0_1px_4px_rgba(12,68,124,0.06)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-gold-dim flex items-center justify-center text-[20px] flex-shrink-0">

        </div>
        <div className="flex-1">
          <h2 className="text-[16px] font-semibold text-navy mb-1">
            Ready for another adventure?
          </h2>
          <p className="text-[14px] text-text-mid mb-4">
            {boatName} is available to book again.
          </p>
          {boatsetterUrl ? (
            <a
              href={boatsetterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex h-[48px] px-5 rounded-[12px]
                bg-gold text-white font-semibold text-[14px]
                items-center gap-2
                hover:bg-gold-hi transition-colors
              "
            >
              Book {boatName} again →
            </a>
          ) : (
            <p className="text-[13px] text-text-mid">
              Contact the operator to book again.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
