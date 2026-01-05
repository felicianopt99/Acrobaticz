#!/usr/bin/env tsx
import 'dotenv/config'
import {
  eventTimelineAlertsJob,
  overdueReturnsCheckJob,
  criticalEventDayJob,
} from '../../src/lib/jobs/notification-jobs'

async function main() {
  try {
    console.log(`[notifications] Starting generation at ${new Date().toISOString()}`)
    await Promise.all([
      eventTimelineAlertsJob(),
      overdueReturnsCheckJob(),
      criticalEventDayJob(),
    ])
    console.log(`[notifications] Generation completed at ${new Date().toISOString()}`)
    process.exit(0)
  } catch (err) {
    console.error('[notifications] Generation failed:', err)
    process.exit(1)
  }
}

main()
