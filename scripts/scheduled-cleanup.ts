/**
 * Scheduled Database Cleanup Cron Job
 * 
 * This file should be executed periodically via a cron job or scheduled task.
 * 
 * Example cron configuration:
 * - Daily at 2 AM: 0 2 * * * node scripts/scheduled-cleanup.js
 * - Weekly on Sunday at 3 AM: 0 3 * * 0 node scripts/scheduled-cleanup.js
 * 
 * For production deployment, consider using:
 * - AWS EventBridge + Lambda
 * - Google Cloud Scheduler
 * - Vercel Crons (if using Vercel)
 * - node-cron library
 */

import { DatabaseCleanup } from '../src/lib/database-cleanup'

async function main() {
  const startTime = new Date()
  console.log(`[Scheduled Cleanup] Starting at ${startTime.toISOString()}`)

  try {
    // Get stats first
    console.log('[Scheduled Cleanup] Getting cleanup statistics...')
    const stats = await DatabaseCleanup.getCleanupStats()
    console.log('[Scheduled Cleanup] Statistics:', JSON.stringify(stats, null, 2))

    // Run full cleanup
    console.log('[Scheduled Cleanup] Running full cleanup...')
    const result = await DatabaseCleanup.runFullCleanup({
      activityLogRetention: 90,
      trashedFileRetention: 30,
      trashedFolderRetention: 30,
    })

    const duration = new Date().getTime() - startTime.getTime()
    console.log('[Scheduled Cleanup] Completed successfully!')
    console.log(`[Scheduled Cleanup] Duration: ${duration}ms`)
    console.log('[Scheduled Cleanup] Result:', JSON.stringify(result, null, 2))

    process.exit(0)
  } catch (error) {
    console.error('[Scheduled Cleanup] Error:', error)
    process.exit(1)
  }
}

main()
