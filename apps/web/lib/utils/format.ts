export function formatTripDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${hours * 60}min`
  if (hours === Math.floor(hours)) return `${hours}hr`
  const whole = Math.floor(hours)
  const mins = (hours - whole) * 60
  return `${whole}hr ${mins}min`
}

export function formatTime(timeStr: string): string {
  const [hoursStr, minsStr] = timeStr.split(':')
  const hours = Number(hoursStr)
  const mins = minsStr ?? '00'
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${mins} ${ampm}`
}

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}
