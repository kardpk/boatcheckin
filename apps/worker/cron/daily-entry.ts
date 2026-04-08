import { runDailyCron } from './daily'

runDailyCron().catch(err => {
  console.error('[daily] fatal error:', err)
  process.exit(1)
})
