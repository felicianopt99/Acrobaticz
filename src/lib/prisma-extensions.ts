/**
 * Prisma Extensions for soft-delete functionality
 * 
 * Automatically filters out soft-deleted (deletedAt != null) records
 * from findMany, findFirst, and findUnique queries for EquipmentItem model
 */

import { Prisma } from '@prisma/client'

/**
 * Extension to automatically exclude soft-deleted EquipmentItem records
 * 
 * Usage:
 * const prisma = new PrismaClient().$extends(equipmentSoftDeleteExtension)
 * 
 * Now all findMany, findFirst, findUnique calls will automatically
 * exclude records where deletedAt IS NOT NULL
 */
export const equipmentSoftDeleteExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      equipmentItem: {
        // Intercept findMany - add where deletedAt IS NULL
        async findMany({ args, query }) {
          args.where = {
            ...args.where,
            deletedAt: null,
          }
          return query(args)
        },

        // Intercept findFirst - add where deletedAt IS NULL
        async findFirst({ args, query }) {
          args.where = {
            ...args.where,
            deletedAt: null,
          }
          return query(args)
        },

        // Intercept findUnique - add where deletedAt IS NULL
        async findUnique({ args, query }) {
          args.where = {
            ...args.where,
            deletedAt: null,
          }
          return query(args)
        },

        // Intercept count - only count non-deleted items
        async count({ args, query }) {
          args.where = {
            ...args.where,
            deletedAt: null,
          }
          return query(args)
        },

        // Intercept findUniqueOrThrow
        async findUniqueOrThrow({ args, query }) {
          args.where = {
            ...args.where,
            deletedAt: null,
          }
          return query(args)
        },

        // Intercept findFirstOrThrow
        async findFirstOrThrow({ args, query }) {
          args.where = {
            ...args.where,
            deletedAt: null,
          }
          return query(args)
        },
      },
    },
  })
})

/**
 * Helper to find soft-deleted items only
 * (opposite of normal behavior)
 */
export const deletedItemsExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    model: {
      equipmentItem: {
        /**
         * Find only soft-deleted items
         * Usage: prisma.equipmentItem.findDeleted()
         */
        async findDeleted(where?: Prisma.EquipmentItemWhereInput) {
          return (client.equipmentItem as any).findMany({
            where: {
              ...where,
              deletedAt: { not: null },
            },
          })
        },

        /**
         * Permanently delete a soft-deleted item
         * Usage: prisma.equipmentItem.hardDelete(id)
         */
        async hardDelete(id: string) {
          return (client.equipmentItem as any).delete({
            where: { id },
          })
        },

        /**
         * Restore a soft-deleted item
         * Usage: prisma.equipmentItem.restore(id)
         */
        async restore(id: string) {
          return (client.equipmentItem as any).update({
            where: { id },
            data: { deletedAt: null },
          })
        },
      },
    },
  })
})
