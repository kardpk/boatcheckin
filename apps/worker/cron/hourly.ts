import { runWeatherMonitor } from '../workers/weatherWorker'
import { runReminderWorker } from '../workers/reminderWorker'

export async function runHourlyCron(): Promise<void> {
  console.log('[hourly] starting at', new Date().toISOString())

  // Run jobs in parallel where safe
  // Weather monitor and reminder worker are independent
  const [weatherResult, reminderResult] = await Promise.allSettled([
    runWeatherMonitor(),
    runReminderWorker(),
  ])

  if (weatherResult.status === 'rejected') {
    console.error('[hourly] weather monitor failed:', weatherResult.reason)
  }
  if (reminderResult.status === 'rejected') {
    console.error('[hourly] reminder worker failed:', reminderResult.reason)
  }

  console.log('[hourly] complete')
}

// Entry point for Render cron
runHourlyCron().catch(err => {
  console.error('[hourly] fatal error:', err)
  process.exit(1)
})
