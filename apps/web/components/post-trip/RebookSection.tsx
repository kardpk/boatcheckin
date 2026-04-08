export function RebookSection({
  boatName, boatsetterUrl,
}: {
  boatName: string
  boatsetterUrl: string | null
}) {
  return (
    <div className="bg-white rounded-[20px] border border-[#D0E2F3] p-5 shadow-[0_1px_4px_rgba(12,68,124,0.06)]">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-[10px] bg-[#E8F2FB] flex items-center justify-center text-[20px] flex-shrink-0">
          ⚓
        </div>
        <div className="flex-1">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A] mb-1">
            Ready for another adventure?
          </h2>
          <p className="text-[14px] text-[#6B7C93] mb-4">
            {boatName} is available to book again.
          </p>
          {boatsetterUrl ? (
            <a
              href={boatsetterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex h-[48px] px-5 rounded-[12px]
                bg-[#0C447C] text-white font-semibold text-[14px]
                items-center gap-2
                hover:bg-[#093a6b] transition-colors
              "
            >
              Book {boatName} again →
            </a>
          ) : (
            <p className="text-[13px] text-[#6B7C93]">
              Contact the operator to book again.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
