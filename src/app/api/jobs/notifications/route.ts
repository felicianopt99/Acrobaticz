import { NextRequest, NextResponse } from 'next/server';
import {
  eventTimelineAlertsJob,
  overdueReturnsCheckJob,
  criticalEventDayJob,
  monthlySummaryJob,
  cleanupJob,
} from '@/lib/jobs/notification-jobs';

const CRON_SECRET = process.env.CRON_SECRET;

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret or internal call
    const authHeader = request.headers.get('authorization');
    const isValidCron = authHeader === `Bearer ${CRON_SECRET}` || authHeader?.includes('Bearer') === false;

    if (!CRON_SECRET || !isValidCron) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobType } = await request.json();

    let result = {};

    switch (jobType) {
      case 'event-timeline':
        await eventTimelineAlertsJob();
        result = { job: 'event-timeline', status: 'completed' };
        break;

      case 'overdue-check':
        await overdueReturnsCheckJob();
        result = { job: 'overdue-check', status: 'completed' };
        break;

      case 'critical-event':
        await criticalEventDayJob();
        result = { job: 'critical-event', status: 'completed' };
        break;

      case 'monthly-summary':
        await monthlySummaryJob();
        result = { job: 'monthly-summary', status: 'completed' };
        break;

      case 'cleanup':
        await cleanupJob();
        result = { job: 'cleanup', status: 'completed' };
        break;

      case 'all':
        await Promise.all([
          eventTimelineAlertsJob(),
          overdueReturnsCheckJob(),
          criticalEventDayJob(),
          monthlySummaryJob(),
          cleanupJob(),
        ]);
        result = { job: 'all', status: 'completed' };
        break;

      default:
        return NextResponse.json({ error: 'Invalid job type' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running notification job:', error);
    return NextResponse.json({ error: 'Job execution failed' }, { status: 500 });
  }
}
