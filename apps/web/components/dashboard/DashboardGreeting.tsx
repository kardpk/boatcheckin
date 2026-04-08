export function DashboardGreeting({
  operatorName,
  todayTripCount,
}: {
  operatorName: string
  todayTripCount: number
}) {
  const { text, emoji } = getGreeting()

  return (
    <div className="pt-2">
      <h1 className="text-[22px] font-bold text-[#0D1B2A]">
        {text}, {operatorName} {emoji}
      </h1>
      <p className="text-[15px] text-[#6B7C93] mt-1">
        {todayTripCount === 0
          ? 'No charters today'
          : todayTripCount === 1
          ? 'You have 1 charter today'
          : `You have ${todayTripCount} charters today`
        }
      </p>
    </div>
  )
}

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good morning', emoji: '☀️' }
  if (hour < 17) return { text: 'Good afternoon', emoji: '⛵' }
  return { text: 'Good evening', emoji: '🌙' }
}
