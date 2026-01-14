/**
 * Database Cleanup Utilities
 * - Remove old ActivityLogs (> 90 days)
 * - Delete soft-deleted CloudFiles and CloudFolders
 */

import { prisma } from '@/lib/db'

export class DatabaseCleanup {
  /**
   * Clean old activity logs (older than 90 days)
   * Run this periodically via cron job
   */
  static async cleanupActivityLogs(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const deleted = await prisma.activityLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(
        `[Database Cleanup] Deleted ${deleted.count} activity logs older than ${retentionDays} days`
      );

      return {
        success: true,
        deletedCount: deleted.count,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      console.error('[Database Cleanup] Error cleaning activity logs:', error);
      throw error;
    }
  }

  /**
   * Permanently delete soft-deleted CloudFiles
   * (files with isTrashed = true for > 30 days)
   */
  static async cleanupTrashedCloudFiles(retentionDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const deleted = await prisma.cloudFile.deleteMany({
        where: {
          isTrashed: true,
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(
        `[Database Cleanup] Permanently deleted ${deleted.count} trashed cloud files older than ${retentionDays} days`
      );

      return {
        success: true,
        deletedCount: deleted.count,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      console.error('[Database Cleanup] Error cleaning trashed cloud files:', error);
      throw error;
    }
  }

  /**
   * Permanently delete soft-deleted CloudFolders
   * (folders with isTrashed = true for > 30 days)
   */
  static async cleanupTrashedCloudFolders(retentionDays = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const deleted = await prisma.cloudFolder.deleteMany({
        where: {
          isTrashed: true,
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(
        `[Database Cleanup] Permanently deleted ${deleted.count} trashed cloud folders older than ${retentionDays} days`
      );

      return {
        success: true,
        deletedCount: deleted.count,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      console.error('[Database Cleanup] Error cleaning trashed cloud folders:', error);
      throw error;
    }
  }

  /**
   * Run all cleanup tasks
   */
  static async runFullCleanup(options: {
    activityLogRetention?: number
    trashedFileRetention?: number
    trashedFolderRetention?: number
  } = {}) {
    const {
      activityLogRetention = 90,
      trashedFileRetention = 30,
      trashedFolderRetention = 30,
    } = options;

    console.log('[Database Cleanup] Starting full database cleanup...');
    const startTime = Date.now();

    try {
      const [activityLogs, trashedFiles, trashedFolders] = await Promise.all([
        this.cleanupActivityLogs(activityLogRetention),
        this.cleanupTrashedCloudFiles(trashedFileRetention),
        this.cleanupTrashedCloudFolders(trashedFolderRetention),
      ]);

      const duration = Date.now() - startTime;

      const summary = {
        success: true,
        duration: `${duration}ms`,
        results: {
          activityLogs,
          trashedFiles,
          trashedFolders,
        },
        totalDeleted:
          activityLogs.deletedCount +
          trashedFiles.deletedCount +
          trashedFolders.deletedCount,
      };

      console.log(
        `[Database Cleanup] Full cleanup completed in ${duration}ms. Total deleted: ${summary.totalDeleted}`
      );

      return summary;
    } catch (error) {
      console.error('[Database Cleanup] Full cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Get cleanup statistics
   */
  static async getCleanupStats() {
    try {
      const [
        totalActivityLogs,
        oldActivityLogs,
        totalTrashedFiles,
        totalTrashedFolders,
      ] = await Promise.all([
        prisma.activityLog.count(),
        prisma.activityLog.count({
          where: {
            createdAt: {
              lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.cloudFile.count({
          where: {
            isTrashed: true,
            updatedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        prisma.cloudFolder.count({
          where: {
            isTrashed: true,
            updatedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);

      return {
        activityLogs: {
          total: totalActivityLogs,
          eligibleForCleanup: oldActivityLogs,
        },
        trashedFiles: {
          eligibleForCleanup: totalTrashedFiles,
        },
        trashedFolders: {
          eligibleForCleanup: totalTrashedFolders,
        },
        totalEligibleForCleanup:
          oldActivityLogs + totalTrashedFiles + totalTrashedFolders,
      };
    } catch (error) {
      console.error('[Database Cleanup] Error getting cleanup stats:', error);
      throw error;
    }
  }
}
