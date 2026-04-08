interface GuestRow {
  id: string
  fullName: string
  waiverSigned: boolean
  languageFlag: string
  addonEmojis: string[]
}

export function SnapshotGuestList({
  guests, maxGuests,
}: {
  guests: GuestRow[]
  maxGuests: number
}) {
  const signed = guests.filter(g => g.waiverSigned).length

  return (
    <div className="
      bg-white rounded-[20px] overflow-hidden
      border border-[#D0E2F3]
    ">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#F5F8FC]">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-semibold text-[#0D1B2A]">
            Passengers
          </h2>
          <span className="text-[14px] font-bold text-[#0C447C]">
            {guests.length} checked in · {signed} signed
          </span>
        </div>
      </div>

      {/* Guest rows */}
      {guests.length === 0 ? (
        <div className="px-5 py-8 text-center">
          <p className="text-[15px] text-[#6B7C93]">No guests yet</p>
        </div>
      ) : (
        <div className="divide-y divide-[#F5F8FC]">
          {guests.map(guest => (
            <div
              key={guest.id}
              className={
                guest.waiverSigned
                  ? 'px-5 py-3 flex items-center gap-3'
                  : 'px-5 py-3 flex items-center gap-3 bg-[#FEF9EE]'
              }
            >
              {/* Avatar */}
              <div className="
                w-9 h-9 rounded-full bg-[#E8F2FB]
                flex items-center justify-center
                text-[12px] font-bold text-[#0C447C]
                flex-shrink-0
              ">
                {guest.fullName.split(' ')
                  .map(n => n[0]).join('').slice(0, 2)}
              </div>

              {/* Name */}
              <span className="flex-1 text-[14px] font-medium text-[#0D1B2A] truncate">
                {guest.fullName}
              </span>

              {/* Language + addons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[14px]">{guest.languageFlag}</span>
                {guest.addonEmojis.length > 0 && (
                  <span className="text-[13px]">
                    {guest.addonEmojis.join('')}
                  </span>
                )}
                <span className={
                  guest.waiverSigned
                    ? 'text-[12px] font-bold text-[#1D9E75]'
                    : 'text-[12px] font-bold text-[#E5910A]'
                }>
                  {guest.waiverSigned ? '✓' : '⏳'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
