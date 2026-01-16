/**
 * Activity Logger Middleware for Prisma
 * 
 * Automatically logs all create, update, delete operations to ActivityLog table
 * Tracks user actions for audit trail and compliance
 */

import { prisma } from './db';

export type ActivityAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW';
export type ActivityEntity = 
  | 'Rental' 
  | 'Equipment' 
  | 'Event' 
  | 'Client' 
  | 'Category' 
  | 'Subcategory' 
  | 'Quote' 
  | 'User'
  | 'Subrental'
  | 'ActivityLog';

export interface ActivityLogData {
  userId: string;
  entityType: ActivityEntity;
  entityId: string;
  action: ActivityAction;
  timestamp: Date;
  changes?: Record<string, { oldValue: any; newValue: any }>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log activity to database
 * This is called automatically by Prisma middleware
 */
async function logActivity(data: ActivityLogData): Promise<void> {
  try {
    // Prevent logging ActivityLog itself to avoid infinite loops
    if (data.entityType === 'ActivityLog') {
      return;
    }

    await prisma.activityLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        oldData: data.changes ? JSON.stringify(data.changes) : null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    });
  } catch (error) {
    // Log errors but don't fail the operation
    console.error('[Activity Logger] Failed to log activity:', error);
  }
}

/**
 * Register Prisma middleware for activity logging
 * Must be called once during application initialization
 */
export function registerActivityLogger(prismaInstance: typeof prisma): void {
  prismaInstance.$use(async (params, next) => {
    const result = await next(params);

    // Get userId from context or session (implement based on your auth system)
    const userId = process.env.CURRENT_USER_ID || 'system';
    
    // Map of Prisma model names to our ActivityEntity types
    const modelToEntity: Record<string, ActivityEntity> = {
      rental: 'Rental',
      equipmentItem: 'Equipment',
      event: 'Event',
      client: 'Client',
      category: 'Category',
      subcategory: 'Subcategory',
      quote: 'Quote',
      user: 'User',
      subrental: 'Subrental',
    };

    const entityType = modelToEntity[params.model?.toLowerCase() || ''];
    if (!entityType) return result;

    // Map Prisma action to our ActivityAction
    const actionMap: Record<string, ActivityAction> = {
      create: 'CREATE',
      update: 'UPDATE',
      delete: 'DELETE',
      findUnique: 'VIEW',
      findMany: 'VIEW',
      findFirst: 'VIEW',
    };

    const action = actionMap[params.action];
    if (!action) return result;

    // Extract entity ID
    let entityId = '';
    if (params.args?.data?.id) {
      entityId = params.args.data.id;
    } else if (params.args?.where?.id) {
      entityId = params.args.where.id;
    } else if (result?.id) {
      entityId = result.id;
    }

    // Calculate changes for updates
    let changes: Record<string, { oldValue: any; newValue: any }> | undefined;
    if (action === 'UPDATE' && params.args?.data) {
      changes = {};
      for (const [key, value] of Object.entries(params.args.data)) {
        changes[key] = {
          oldValue: null, // In real scenario, fetch from database
          newValue: value,
        };
      }
    }

    // Log the activity asynchronously (non-blocking)
    logActivity({
      userId,
      entityType,
      entityId,
      action,
      timestamp: new Date(),
      changes,
    }).catch((err) => {
      console.error('[Activity Logger] Failed to log activity:', err);
    });

    return result;
  });
}

/**
 * Get activity logs for a specific entity
 */
export async function getActivityLogs(
  entityType: ActivityEntity,
  entityId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const logs = await prisma.activityLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs;
  } catch (error) {
    console.error('[Activity Logger] Failed to fetch activity logs:', error);
    return [];
  }
}

/**
 * Get activity logs for a specific user
 */
export async function getUserActivityLogs(
  userId: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return logs;
  } catch (error) {
    console.error('[Activity Logger] Failed to fetch user activity logs:', error);
    return [];
  }
}

/**
 * Clean old activity logs (older than 90 days)
 * Run this periodically via a cron job
 */
export async function cleanOldActivityLogs(daysOld: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const result = await prisma.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
    console.log(`[Activity Logger] Cleaned ${result.count} old activity logs`);
    return result.count;
  } catch (error) {
    console.error('[Activity Logger] Failed to clean old logs:', error);
    return 0;
  }
}

/**
 * Manual activity log function (for use in API endpoints)
 * Use this when the automatic middleware isn't sufficient
 */
export async function logManualActivity(
  userId: string,
  entityType: ActivityEntity,
  entityId: string,
  action: ActivityAction,
  changes?: Record<string, { oldValue: any; newValue: any }>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logActivity({
    userId,
    entityType,
    entityId,
    action,
    timestamp: new Date(),
    changes,
    ipAddress,
    userAgent,
  });
}
