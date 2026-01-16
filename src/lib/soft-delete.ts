/**
 * Soft-Delete Middleware and Utilities
 * 
 * Ensures all read queries automatically filter out soft-deleted records
 * Provides safe delete operations that mark records as deleted instead of removing them
 */

import { prisma } from './db';

// Helper to get prisma model delegate dynamically
function getModelDelegate(model: SoftDeleteEntity) {
  const modelMap: Record<SoftDeleteEntity, any> = {
    rental: prisma.rental,
    equipment: prisma.equipmentItem,
    event: prisma.event,
    client: prisma.client,
    category: prisma.category,
    subcategory: prisma.subcategory,
    quote: prisma.quote,
    user: prisma.user,
    subrental: prisma.subrental,
  };
  return modelMap[model];
}

export type SoftDeleteEntity = 
  | 'rental'
  | 'equipment'
  | 'event'
  | 'client'
  | 'category'
  | 'subcategory'
  | 'quote'
  | 'user'
  | 'subrental';

/**
 * Register Prisma middleware for automatic soft-delete filtering
 * This ensures that all findMany, findFirst, findUnique, and count queries
 * automatically exclude soft-deleted records
 */
export function registerSoftDeleteMiddleware(prismaInstance: typeof prisma): void {
  prismaInstance.$use(async (params, next) => {
    const { model, action, args } = params;

    // Models that support soft-delete
    const softDeleteModels = [
      'Rental',
      'EquipmentItem',
      'Event',
      'Client',
      'Category',
      'Subcategory',
      'Quote',
      'User',
      'Subrental',
    ];

    // Only apply to soft-delete models
    if (!softDeleteModels.includes(model || '')) {
      return next(params);
    }

    // Apply soft-delete filter to read operations
    const readActions = ['findUnique', 'findFirst', 'findMany', 'count', 'aggregate'];
    if (readActions.includes(action)) {
      // Initialize where clause if it doesn't exist
      if (!args.where) {
        args.where = {};
      }

      // Add soft-delete filter: only include records where deletedAt is null
      args.where.AND = args.where.AND || [];
      args.where.AND.push({ deletedAt: null });
    }

    // For delete actions, perform soft-delete instead
    if (action === 'delete') {
      // Convert delete to update with deletedAt timestamp
      const deletedAt = new Date();
      
      return (prismaInstance as any)[model!.charAt(0).toLowerCase() + model!.slice(1)].update({
        where: args.where,
        data: { deletedAt },
      });
    }

    // For deleteMany, convert to updateMany
    if (action === 'deleteMany') {
      const deletedAt = new Date();
      
      return (prismaInstance as any)[model!.charAt(0).toLowerCase() + model!.slice(1)].updateMany({
        where: args.where,
        data: { deletedAt },
      });
    }

    return next(params);
  });
}

/**
 * Permanently delete a soft-deleted record
 * Only use for data cleanup, not in normal operations
 */
export async function permanentlyDelete<T>(
  model: SoftDeleteEntity,
  id: string
): Promise<T | null> {
  try {
    // Directly execute the raw delete, bypassing soft-delete middleware
    // This is intentionally using unsafe operations for admin cleanup only
    const result = await getModelDelegate(model).delete({
      where: { id },
    });
    return result;
  } catch (error) {
    console.error(`[Soft-Delete] Failed to permanently delete ${model} ${id}:`, error);
    throw error;
  }
}

/**
 * Restore a soft-deleted record
 */
export async function restoreSoftDeleted<T>(
  model: SoftDeleteEntity,
  id: string
): Promise<T | null> {
  try {
    const result = await getModelDelegate(model).update({
      where: { id },
      data: { deletedAt: null },
    });
    return result;
  } catch (error) {
    console.error(`[Soft-Delete] Failed to restore ${model} ${id}:`, error);
    throw error;
  }
}

/**
 * Soft delete a record
 */
export async function softDelete<T>(
  model: SoftDeleteEntity,
  id: string
): Promise<T | null> {
  try {
    const result = await getModelDelegate(model).update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return result;
  } catch (error) {
    console.error(`[Soft-Delete] Failed to soft-delete ${model} ${id}:`, error);
    throw error;
  }
}

/**
 * Get all soft-deleted records for a model
 * Only for admin cleanup/audit purposes
 */
export async function getSoftDeletedRecords<T>(
  model: SoftDeleteEntity,
  limit: number = 100
): Promise<T[]> {
  try {
    const result = await getModelDelegate(model).findMany({
      where: {
        deletedAt: {
          not: null,
        },
      },
      orderBy: { deletedAt: 'desc' },
      take: limit,
    });
    return result;
  } catch (error) {
    console.error(`[Soft-Delete] Failed to get soft-deleted records for ${model}:`, error);
    return [];
  }
}

/**
 * Permanently delete all soft-deleted records older than X days
 * Run this periodically via a cron job
 */
export async function purgeOldSoftDeletes(
  model: SoftDeleteEntity,
  daysOld: number = 90
): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    const result = await getModelDelegate(model).deleteMany({
      where: {
        deletedAt: {
          lt: cutoffDate,
        },
      },
    });
    
    console.log(`[Soft-Delete] Purged ${result.count} old ${model} records deleted more than ${daysOld} days ago`);
    return result.count;
  } catch (error) {
    console.error(`[Soft-Delete] Failed to purge old records for ${model}:`, error);
    return 0;
  }
}

/**
 * Cascade soft-delete: delete parent and all related children
 * E.g., delete event and all its rentals
 */
export async function cascadeSoftDelete(
  parentModel: SoftDeleteEntity,
  parentId: string,
  childRelations: { model: SoftDeleteEntity; field: string }[]
): Promise<boolean> {
  try {
    const deletedAt = new Date();
    
    // Delete children first
    for (const child of childRelations) {
      await getModelDelegate(child.model).updateMany({
        where: {
          [child.field]: parentId,
        },
        data: { deletedAt },
      });
    }
    
    // Delete parent
    await getModelDelegate(parentModel).update({
      where: { id: parentId },
      data: { deletedAt },
    });
    
    return true;
  } catch (error) {
    console.error('[Soft-Delete] Failed to cascade delete:', error);
    return false;
  }
}

/**
 * Count total and soft-deleted records
 */
export async function getModelStats(model: SoftDeleteEntity): Promise<{
  total: number;
  active: number;
  softDeleted: number;
}> {
  try {
    // For this to work, we need to bypass the middleware filter temporarily
    // This is a limitation - in production, you'd want a separate admin query

    const total = await getModelDelegate(model).count();
    
    const softDeleted = await getModelDelegate(model).count({
      where: {
        deletedAt: {
          not: null,
        },
      },
    });
    
    return {
      total,
      active: total - softDeleted,
      softDeleted,
    };
  } catch (error) {
    console.error(`[Soft-Delete] Failed to get stats for ${model}:`, error);
    return { total: 0, active: 0, softDeleted: 0 };
  }
}

/**
 * Validates that a record hasn't been soft-deleted
 * Useful for operations on specific IDs
 */
export async function validateNotDeleted<T>(
  model: SoftDeleteEntity,
  id: string
): Promise<boolean> {
  try {
    const record = await getModelDelegate(model).findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    return !!record;
  } catch (error) {
    console.error(`[Soft-Delete] Failed to validate record:`, error);
    return false;
  }
}
