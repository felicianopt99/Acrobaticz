import { prisma } from '@/lib/db';
import {
  createEventTimelineNotification,
  createOverdueNotification,
  createCriticalEventNotification,
  createMonthlySummaryNotification,
  cleanupOldNotifications,
} from '@/lib/notifications';

/**
 * Job 1: Event Timeline Alerts (runs every 3 hours)
 * Notifies about events starting in 3 days, 1 day, or 3 hours
 */
export async function eventTimelineAlertsJob() {
  try {
    const now = new Date();

    // Check for events starting in 3 days
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    in3Days.setHours(0, 0, 0, 0);

    const eventsIn3Days = await prisma.event.findMany({
      where: {
        startDate: {
          gte: in3Days,
          lt: new Date(in3Days.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const event of eventsIn3Days) {
      await createEventTimelineNotification(event.id, 3);
    }

    // Check for events starting in 1 day
    const in1Day = new Date(now);
    in1Day.setDate(in1Day.getDate() + 1);
    in1Day.setHours(0, 0, 0, 0);

    const eventsIn1Day = await prisma.event.findMany({
      where: {
        startDate: {
          gte: in1Day,
          lt: new Date(in1Day.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    for (const event of eventsIn1Day) {
      await createEventTimelineNotification(event.id, 1);
    }

    // Check for events starting in 3 hours
    const in3Hours = new Date(now);
    in3Hours.setHours(in3Hours.getHours() + 3);

    const eventsIn3Hours = await prisma.event.findMany({
      where: {
        startDate: {
          gte: now,
          lt: in3Hours,
        },
      },
    });

    for (const event of eventsIn3Hours) {
      await createEventTimelineNotification(event.id, 0.125); // 3 hours = 0.125 days
    }

    console.log(
      `Event Timeline Alerts Job: ${eventsIn3Days.length} + ${eventsIn1Day.length} + ${eventsIn3Hours.length} notifications sent`
    );
  } catch (error) {
    console.error('Error in eventTimelineAlertsJob:', error);
  }
}

/**
 * Job 2: Overdue Returns Check (runs daily at 7 AM)
 */
export async function overdueReturnsCheckJob() {
  try {
    const now = new Date();

    // Find all rentals where event has ended but equipment not checked in
    const overdueRentals = await prisma.rental.findMany({
      where: {
        prepStatus: { not: 'checked-in' },
        Event: {
          endDate: { lt: now },
        },
      },
      include: {
        Event: true,
      },
    });

    for (const rental of overdueRentals) {
      const daysOverdue = Math.floor((now.getTime() - rental.Event.endDate.getTime()) / (1000 * 60 * 60 * 24));

      // Only notify if overdue by at least 1 day
      if (daysOverdue >= 1) {
        // Check if we already notified today
        const existingNotif = await prisma.notification.findFirst({
          where: {
            entityId: rental.id,
            type: 'overdue',
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        });

        if (!existingNotif) {
          await createOverdueNotification(rental.id, daysOverdue);
        }
      }
    }

    console.log(`Overdue Returns Check Job: Checked ${overdueRentals.length} rentals`);
  } catch (error) {
    console.error('Error in overdueReturnsCheckJob:', error);
  }
}

/**
 * Job 3: Critical Event Day Check (runs hourly)
 */
export async function criticalEventDayJob() {
  try {
    const now = new Date();
    const in3Hours = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    // Find events starting within 3 hours
    const upcomingEvents = await prisma.event.findMany({
      where: {
        startDate: {
          gte: now,
          lte: in3Hours,
        },
      },
      include: {
        Rental: true,
      },
    });

    for (const event of upcomingEvents) {
      // Check if any equipment is checked out
      const checkedOutRentals = event.Rental.filter((r: { prepStatus: string | null }) => r.prepStatus === 'checked-out');

      if (checkedOutRentals.length > 0) {
        // Check if we already sent this critical alert (to avoid spamming)
        const existingNotif = await prisma.notification.findFirst({
          where: {
            entityId: event.id,
            type: 'critical_event',
            createdAt: {
              gte: new Date(now.getTime() - 60 * 60 * 1000), // Last hour
            },
          },
        });

        if (!existingNotif) {
          await createCriticalEventNotification(event.id);
        }
      }
    }

    console.log(`Critical Event Day Job: Checked ${upcomingEvents.length} upcoming events`);
  } catch (error) {
    console.error('Error in criticalEventDayJob:', error);
  }
}

/**
 * Job 4: Monthly Revenue Summary (runs 1st of month at 9 AM)
 */
export async function monthlySummaryJob() {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get all events from last month
    const events = await prisma.event.findMany({
      where: {
        startDate: {
          gte: lastMonth,
          lte: monthEnd,
        },
      },
      include: {
        Rental: {
          include: {
            EquipmentItem: true,
          },
        },
        Client: true,
      },
    });

    // Calculate total revenue (assuming daily rate for full rental period)
    let totalRevenue = 0;
    const clientRevenue: Record<string, number> = {};

    for (const event of events) {
      for (const rental of event.Rental) {
        const days = Math.ceil((event.endDate.getTime() - event.startDate.getTime()) / (1000 * 60 * 60 * 24));
        const revenue = rental.EquipmentItem.dailyRate * days * rental.quantityRented;
        totalRevenue += revenue;

        if (event.Client) {
          clientRevenue[event.Client.name] = (clientRevenue[event.Client.name] || 0) + revenue;
        }
      }
    }

    // Find top client
    const topClient = Object.entries(clientRevenue).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

    // Get managers and admins
    const recipients = await prisma.user.findMany({
      where: {
        role: { in: ['Manager', 'Admin', 'Owner'] },
        isActive: true,
      },
    });

    const monthName = lastMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    for (const recipient of recipients) {
      await createMonthlySummaryNotification(recipient.id, {
        totalRevenue,
        totalEvents: events.length,
        topClient,
        month: monthName,
      });
    }

    console.log(
      `Monthly Summary Job: ${totalRevenue.toFixed(2)}€ from ${events.length} events sent to ${recipients.length} recipients`
    );
  } catch (error) {
    console.error('Error in monthlySummaryJob:', error);
  }
}

/**
 * Cleanup Job: Delete old notifications (runs daily at 2 AM)
 */
export async function cleanupJob() {
  try {
    await cleanupOldNotifications();
    console.log('Notification Cleanup Job: Completed');
  } catch (error) {
    console.error('Error in cleanupJob:', error);
  }
}
