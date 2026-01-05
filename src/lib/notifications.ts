import { prisma } from '@/lib/db';
import { getSocketIO } from '@/lib/socket-server';

export type NotificationType =
  | 'conflict'
  | 'status_change'
  | 'event_timeline'
  | 'overdue'
  | 'critical_event'
  | 'low_stock'
  | 'equipment_available'
  | 'monthly_summary';

export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';
export type EntityType = 'event' | 'rental' | 'equipment' | 'inventory';

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  entityType?: EntityType;
  entityId?: string;
  actionUrl?: string;
  groupKey?: string;
  expiresAt?: Date;
}

/**
 * Send notification to a single user
 */
export async function sendNotificationToUser(payload: NotificationPayload) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        priority: payload.priority,
        entityType: payload.entityType,
        entityId: payload.entityId,
        actionUrl: payload.actionUrl,
        groupKey: payload.groupKey,
        expiresAt: payload.expiresAt,
      },
    });

    // Broadcast via Socket.IO
    try {
      const io = getSocketIO();
      if (io) {
        io.to(`user-${payload.userId}`).emit('notification', notification);
      }
    } catch (e) {
      // Socket not available, that's ok
    }

    return notification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send notification to all users with a specific role
 */
export async function sendNotificationToRole(
  role: string,
  payload: Omit<NotificationPayload, 'userId'>
) {
  try {
    const users = await prisma.user.findMany({
      where: { role, isActive: true },
    });

    const notifications = await Promise.all(
      users.map((user) =>
        sendNotificationToUser({
          ...payload,
          userId: user.id,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error sending notifications to role:', error);
    throw error;
  }
}

/**
 * Send notification to all users in a team for an event
 */
export async function sendNotificationToTeam(
  eventId: string,
  payload: Omit<NotificationPayload, 'userId'>
) {
  try {
    // Get event with staff
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventStaff: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const notifications = [];

    // Send to event staff
    if (event.eventStaff && event.eventStaff.length > 0) {
      for (const staffMember of event.eventStaff) {
        const notification = await sendNotificationToUser({
          ...payload,
          userId: staffMember.userId,
        });
        notifications.push(notification);
      }
    }

    // Also send to managers and admins
    const managers = await prisma.user.findMany({
      where: {
        role: { in: ['Manager', 'Admin'] },
        isActive: true,
      },
    });

    for (const manager of managers) {
      const notification = await sendNotificationToUser({
        ...payload,
        userId: manager.id,
      });
      notifications.push(notification);
    }

    return notifications;
  } catch (error) {
    console.error('Error sending notifications to team:', error);
    throw error;
  }
}

// ========== Notification Creation Functions ==========

/**
 * 1. Equipment Conflict Alert
 */
export async function createConflictNotification(
  eventIds: string[],
  equipmentName: string
) {
  try {
    // Get manager and admin users
    const recipients = await prisma.user.findMany({
      where: {
        role: { in: ['Manager', 'Admin'] },
        isActive: true,
      },
    });

    const groupKey = `conflict_${new Date().toISOString().split('T')[0]}`;

    const notifications = await Promise.all(
      recipients.map((user) =>
        sendNotificationToUser({
          userId: user.id,
          type: 'conflict',
          title: '⚠️ Equipment Conflict Alert',
          message: `${equipmentName} is booked for overlapping dates in multiple events`,
          priority: 'critical',
          entityType: 'event',
          actionUrl: `/rentals?event=${eventIds[0]}`,
          groupKey,
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error creating conflict notification:', error);
    throw error;
  }
}

/**
 * 2. Rental Status Change Notification
 */
export async function createStatusChangeNotification(
  rentalId: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        event: {
          include: {
            eventStaff: true,
          },
        },
        equipment: true,
      },
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    const statusMessages: Record<string, string> = {
      pending: 'Pending',
      'checked-out': 'Checked Out',
      'in-transit': 'In Transit',
      'checked-in': 'Checked In',
    };

    const title = `📋 ${rental.equipment.name} - Status Changed`;
    const message = `Status changed from ${statusMessages[oldStatus]} to ${statusMessages[newStatus]}`;

    // Send to technician assigned
    if (rental.event.eventStaff && rental.event.eventStaff.length > 0) {
      for (const staff of rental.event.eventStaff) {
        await sendNotificationToUser({
          userId: staff.userId,
          type: 'status_change',
          title,
          message,
          priority: newStatus === 'checked-in' ? 'high' : 'medium',
          entityType: 'rental',
          entityId: rentalId,
          actionUrl: `/rentals/${rentalId}/prep`,
        });
      }
    }

    // Send to managers
    await sendNotificationToRole('Manager', {
      type: 'status_change',
      title,
      message,
      priority: newStatus === 'checked-in' ? 'high' : 'medium',
      entityType: 'rental',
      entityId: rentalId,
      actionUrl: `/events/${rental.eventId}`,
    });
  } catch (error) {
    console.error('Error creating status change notification:', error);
    throw error;
  }
}

/**
 * 3. Event Timeline Alerts (3 days, 1 day, 3 hours)
 */
export async function createEventTimelineNotification(
  eventId: string,
  daysUntil: number
) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventStaff: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    let title = '';
    let message = '';
    let priority: NotificationPriority = 'medium';

    if (daysUntil === 3) {
      title = '⏰ Event in 3 Days';
      message = `${event.name} starts in 3 days`;
      priority = 'medium';
    } else if (daysUntil === 1) {
      title = '⏰ Event Tomorrow';
      message = `${event.name} starts tomorrow`;
      priority = 'high';
    } else if (daysUntil === 0.125) {
      // 3 hours
      title = '⏰ Event Starting in 3 Hours';
      message = `${event.name} starts in 3 hours. Check prep status!`;
      priority = 'critical';
    }

    await sendNotificationToTeam(eventId, {
      type: 'event_timeline',
      title,
      message,
      priority,
      entityType: 'event',
      entityId: eventId,
      actionUrl: `/events/${eventId}`,
    });
  } catch (error) {
    console.error('Error creating event timeline notification:', error);
    throw error;
  }
}

/**
 * 4. Overdue Return Alert
 */
export async function createOverdueNotification(rentalId: string, daysOverdue: number) {
  try {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        event: true,
        equipment: true,
      },
    });

    if (!rental) {
      throw new Error('Rental not found');
    }

    const title = `🚨 OVERDUE: ${rental.equipment.name}`;
    const message = `${rental.equipment.name} from event "${rental.event.name}" is ${daysOverdue} days overdue. Event ended on ${rental.event.endDate?.toLocaleDateString()}`;

    // Send to warehouse and managers
    await sendNotificationToRole('Manager', {
      type: 'overdue',
      title,
      message,
      priority: 'critical',
      entityType: 'rental',
      entityId: rentalId,
      actionUrl: `/events/${rental.eventId}`,
    });

    // Also send to warehouse manager if role exists
    const warehouseManagers = await prisma.user.findMany({
      where: {
        role: 'Warehouse Manager',
        isActive: true,
      },
    });

    for (const user of warehouseManagers) {
      await sendNotificationToUser({
        userId: user.id,
        type: 'overdue',
        title,
        message,
        priority: 'critical',
        entityType: 'rental',
        entityId: rentalId,
        actionUrl: `/events/${rental.eventId}`,
      });
    }
  } catch (error) {
    console.error('Error creating overdue notification:', error);
    throw error;
  }
}

/**
 * 5. Critical Event Day Alert
 */
export async function createCriticalEventNotification(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        rentals: true,
        eventStaff: true,
      },
    });

    if (!event) {
      throw new Error('Event not found');
    }

    const checkedOutRentals = event.rentals.filter((r) => r.prepStatus === 'checked-out');

    if (checkedOutRentals.length === 0) {
      return; // Only notify if equipment is checked out
    }

    const title = '🎤 CRITICAL: Event Starting Soon';
    const message = `${event.name} starts in 3 hours. ${checkedOutRentals.length} items are checked out.`;

    await sendNotificationToTeam(eventId, {
      type: 'critical_event',
      title,
      message,
      priority: 'critical',
      entityType: 'event',
      entityId: eventId,
      actionUrl: `/events/${eventId}`,
    });
  } catch (error) {
    console.error('Error creating critical event notification:', error);
    throw error;
  }
}

/**
 * 6. Low Stock / Consumable Alert
 */
export async function createLowStockNotification(
  inventoryItemId: string,
  itemName: string,
  quantity: number
) {
  try {
    const title = '📦 Low Stock Alert';
    const message = `${itemName} stock is running low (${quantity} remaining). Please reorder.`;

    await sendNotificationToRole('Manager', {
      type: 'low_stock',
      title,
      message,
      priority: 'high',
      entityType: 'inventory',
      entityId: inventoryItemId,
      actionUrl: `/inventory`,
    });

    // Also send to warehouse manager
    const warehouseManagers = await prisma.user.findMany({
      where: {
        role: 'Warehouse Manager',
        isActive: true,
      },
    });

    for (const user of warehouseManagers) {
      await sendNotificationToUser({
        userId: user.id,
        type: 'low_stock',
        title,
        message,
        priority: 'high',
        entityType: 'inventory',
        entityId: inventoryItemId,
        actionUrl: `/inventory`,
      });
    }
  } catch (error) {
    console.error('Error creating low stock notification:', error);
    throw error;
  }
}

/**
 * 7. Equipment Back in Service
 */
export async function createEquipmentAvailableNotification(
  equipmentId: string,
  equipmentName: string
) {
  try {
    const title = '✅ Equipment Available';
    const message = `${equipmentName} is back in service and available for rental.`;

    await sendNotificationToRole('Manager', {
      type: 'equipment_available',
      title,
      message,
      priority: 'medium',
      entityType: 'equipment',
      entityId: equipmentId,
      actionUrl: `/inventory`,
    });

    await sendNotificationToRole('Admin', {
      type: 'equipment_available',
      title,
      message,
      priority: 'medium',
      entityType: 'equipment',
      entityId: equipmentId,
      actionUrl: `/inventory`,
    });
  } catch (error) {
    console.error('Error creating equipment available notification:', error);
    throw error;
  }
}

/**
 * 8. Monthly Revenue Summary
 */
export async function createMonthlySummaryNotification(
  userId: string,
  data: {
    totalRevenue: number;
    totalEvents: number;
    topClient: string;
    month: string;
  }
) {
  try {
    const title = '💰 Monthly Revenue Summary';
    const message = `${data.month}: Revenue ${data.totalRevenue.toFixed(2)}€ | ${data.totalEvents} events | Top client: ${data.topClient}`;

    await sendNotificationToUser({
      userId,
      type: 'monthly_summary',
      title,
      message,
      priority: 'medium',
      actionUrl: '/dashboard',
    });
  } catch (error) {
    console.error('Error creating monthly summary notification:', error);
    throw error;
  }
}

// ========== Helper Functions ==========

/**
 * Check if user has preference enabled for notification type
 */
export async function isNotificationEnabled(
  userId: string,
  notificationType: NotificationType
): Promise<boolean> {
  try {
    let preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.notificationPreference.create({
        data: { userId },
      });
    }

    const preferenceMap: Record<NotificationType, keyof typeof preferences> = {
      conflict: 'conflictAlerts',
      status_change: 'statusChanges',
      event_timeline: 'eventReminders',
      overdue: 'overdueAlerts',
      critical_event: 'criticalAlerts',
      low_stock: 'stockAlerts',
      equipment_available: 'equipmentAvailable',
      monthly_summary: 'monthlySummary',
    };

    const preferenceKey = preferenceMap[notificationType];
    return (preferences[preferenceKey as keyof typeof preferences] as boolean) ?? true;
  } catch (error) {
    console.error('Error checking notification preference:', error);
    return true; // Default to enabled on error
  }
}

/**
 * Delete old notifications
 */
export async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // Delete read notifications older than 30 days
    await prisma.notification.deleteMany({
      where: {
        isRead: true,
        createdAt: { lt: thirtyDaysAgo },
      },
    });

    // Delete unread notifications older than 60 days
    await prisma.notification.deleteMany({
      where: {
        isRead: false,
        createdAt: { lt: sixtyDaysAgo },
      },
    });

    // Delete expired notifications
    const now = new Date();
    await prisma.notification.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    console.log('Notification cleanup completed');
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}

/**
 * Get unread count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
}

/**
 * Mark notifications as read
 */
export async function markNotificationsAsRead(notificationIds: string[]) {
  try {
    return await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
      },
      data: {
        isRead: true,
      },
    });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

/**
 * Delete notifications
 */
export async function deleteNotifications(notificationIds: string[]) {
  try {
    return await prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
      },
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    throw error;
  }
}

/**
 * Get conflicting equipment rentals
 */
export async function checkEquipmentConflicts(
  equipmentId: string,
  startDate: Date,
  endDate: Date,
  excludeRentalId?: string
): Promise<string[]> {
  try {
    const conflicts = await prisma.rental.findMany({
      where: {
        equipmentId,
        event: {
          startDate: { lt: endDate },
          endDate: { gt: startDate },
        },
        ...(excludeRentalId && { id: { not: excludeRentalId } }),
      },
      include: {
        event: true,
      },
    });

    return conflicts.map((c) => c.eventId);
  } catch (error) {
    console.error('Error checking equipment conflicts:', error);
    return [];
  }
}
