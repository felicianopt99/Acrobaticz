import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/api-auth'
import {
  eventTimelineAlertsJob,
  overdueReturnsCheckJob,
  criticalEventDayJob,
} from '@/lib/jobs/notification-jobs'

// POST /api/notifications/generate - Admin-only trigger to manually run notification jobs
export async function POST(request: NextRequest) {

  try {
    // Run all notification generation jobs
    await Promise.all([
      eventTimelineAlertsJob(),
      overdueReturnsCheckJob(),
      criticalEventDayJob(),
    ])
    return NextResponse.json({ success: true, message: 'Notification jobs executed' })
  } catch (error) {
    console.error('Error running notification jobs:', error)
    return NextResponse.json({ error: 'Failed to run notification jobs' }, { status: 500 })
  }
}
