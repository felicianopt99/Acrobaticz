/**
 * Orphan Cleanup Utilities
 * Synchronizes database deletions with physical file system
 * - When EquipmentItem is deleted, remove associated image files
 * - When CloudFile is deleted, remove from storage
 * - Handles orphaned files left behind by incomplete deletions
 */

import { prisma } from '@/lib/db'
import { deleteFile, getStoragePath, CLOUD_STORAGE_PATH } from '@/lib/storage'
import fs from 'fs/promises'
import path from 'path'

interface OrphanCleanupStats {
  equipmentImagesDeleted: number
  cloudFilesDeleted: number
  cloudFoldersDeleted: number
  orphanedFilesFound: number
  orphanedFilesDeleted: number
  errors: Array<{ type: string; id: string; error: string }>
}

export class OrphanCleanup {
  /**
   * Clean up equipment images when items are hard-deleted from database
   * Should be called when equipment is permanently deleted
   */
  static async cleanupEquipmentImages(equipmentIds: string[]): Promise<number> {
    if (!equipmentIds.length) return 0

    let deletedCount = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const id of equipmentIds) {
      try {
        // Try to find any orphaned image paths in activity log
        const activityLogs = await prisma.activityLog.findMany({
          where: {
            entityType: 'EquipmentItem',
            entityId: id,
            action: { in: ['CREATE', 'UPDATE'] },
          },
          select: { oldData: true, newData: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })

        // Extract image paths from logs
        const imagePaths = new Set<string>()
        for (const log of activityLogs) {
          try {
            if (log.newData) {
              const data = typeof log.newData === 'string' ? JSON.parse(log.newData) : log.newData
              if (data.imageUrl) imagePaths.add(data.imageUrl)
            }
            if (log.oldData) {
              const data = typeof log.oldData === 'string' ? JSON.parse(log.oldData) : log.oldData
              if (data.imageUrl) imagePaths.add(data.imageUrl)
            }
          } catch (e) {
            // Skip malformed log entries
          }
        }

        // Delete each image file
        for (const imagePath of imagePaths) {
          try {
            // Only delete local files (not remote URLs)
            if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
              await deleteFile(imagePath)
              deletedCount++
            }
          } catch (e) {
            // Continue if individual file deletion fails
            console.warn(`Failed to delete equipment image: ${imagePath}`, e)
          }
        }
      } catch (error) {
        errors.push({
          id,
          error: error instanceof Error ? error.message : String(error),
        })
        console.error(`[Orphan Cleanup] Error cleaning equipment ${id}:`, error)
      }
    }

    if (deletedCount > 0) {
      console.log(
        `[Orphan Cleanup] Cleaned up ${deletedCount} equipment image files for ${equipmentIds.length} items`
      )
    }

    return deletedCount
  }

  /**
   * Clean up cloud files and their versions when permanently deleted from database
   * Should be called when CloudFiles are hard-deleted
   */
  static async cleanupCloudFiles(fileIds: string[]): Promise<number> {
    if (!fileIds.length) return 0

    let deletedCount = 0
    const errors: Array<{ id: string; error: string }> = []

    // Get all file records that are about to be deleted or recently deleted
    const files = await prisma.cloudFile.findMany({
      where: { id: { in: fileIds } },
      select: {
        id: true,
        storagePath: true,
        ownerId: true,
      },
    })

    for (const file of files) {
      try {
        // Delete main file
        try {
          await deleteFile(file.storagePath)
          deletedCount++
        } catch (e) {
          console.warn(
            `[Orphan Cleanup] Failed to delete cloud file at ${file.storagePath}:`,
            e
          )
        }

        // Delete versions
        const versionPath = path.join(
          path.dirname(file.storagePath),
          '.versions',
          path.basename(file.storagePath)
        )
        try {
          await deleteFile(versionPath)
        } catch (e) {
          // Versions might not exist
        }

        // Delete associated file versions from database
        await prisma.fileVersion.deleteMany({
          where: { fileId: file.id },
        })
      } catch (error) {
        errors.push({
          id: file.id,
          error: error instanceof Error ? error.message : String(error),
        })
        console.error(`[Orphan Cleanup] Error cleaning cloud file ${file.id}:`, error)
      }
    }

    if (deletedCount > 0) {
      console.log(`[Orphan Cleanup] Cleaned up ${deletedCount} cloud files`)
    }

    return deletedCount
  }

  /**
   * Clean up folder and all its contents when permanently deleted from database
   * Should be called when CloudFolders are hard-deleted
   */
  static async cleanupCloudFolders(folderIds: string[]): Promise<number> {
    if (!folderIds.length) return 0

    let deletedCount = 0
    const errors: Array<{ id: string; error: string }> = []

    for (const folderId of folderIds) {
      try {
        // Get all files in folder
        const files = await prisma.cloudFile.findMany({
          where: { folderId },
          select: { id: true, storagePath: true },
        })

        // Delete each file
        for (const file of files) {
          try {
            await deleteFile(file.storagePath)
            deletedCount++
          } catch (e) {
            console.warn(
              `[Orphan Cleanup] Failed to delete file in folder: ${file.storagePath}`,
              e
            )
          }
        }

        // Delete folder directory itself
        const folder = await prisma.cloudFolder.findUnique({
          where: { id: folderId },
          select: { id: true, ownerId: true, name: true },
        })

        if (folder) {
          // Construct storage path from folder id and owner
          const folderPath = path.join(CLOUD_STORAGE_PATH, folder.ownerId, 'folders', folder.id)
          try {
            await fs.rm(folderPath, { recursive: true, force: true })
          } catch (e) {
            console.warn(
              `[Orphan Cleanup] Failed to delete folder directory: ${folderPath}`,
              e
            )
          }
        }
      } catch (error) {
        errors.push({
          id: folderId,
          error: error instanceof Error ? error.message : String(error),
        })
        console.error(`[Orphan Cleanup] Error cleaning folder ${folderId}:`, error)
      }
    }

    if (deletedCount > 0) {
      console.log(`[Orphan Cleanup] Cleaned up ${deletedCount} files in ${folderIds.length} folders`)
    }

    return deletedCount
  }

  /**
   * Scan storage for orphaned files not referenced in database
   * Returns list of orphaned file paths that should be cleaned
   */
  static async findOrphanedFiles(userId?: string): Promise<string[]> {
    const orphanedFiles: string[] = []

    try {
      const EXTERNAL_STORAGE_PATH =
        process.env.EXTERNAL_STORAGE_PATH || '/mnt/backup_drive/av-rentals/cloud-storage'

      // Get base storage path
      const basePath = userId
        ? path.join(EXTERNAL_STORAGE_PATH, userId, 'files')
        : EXTERNAL_STORAGE_PATH

      // Check if path exists
      try {
        await fs.access(basePath)
      } catch {
        return [] // Path doesn't exist, no orphaned files
      }

      // Recursively scan directory
      await this._scanDirectoryForOrphans(basePath, orphanedFiles)

      console.log(`[Orphan Cleanup] Found ${orphanedFiles.length} potential orphaned files`)
      return orphanedFiles
    } catch (error) {
      console.error('[Orphan Cleanup] Error scanning for orphaned files:', error)
      return []
    }
  }

  /**
   * Recursively scan directory for orphaned files
   * Checks each file against database records
   */
  private static async _scanDirectoryForOrphans(
    dirPath: string,
    orphanedFiles: string[]
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Skip special directories
          if (entry.name === '.versions' || entry.name === 'temp') {
            continue
          }
          // Recursively scan subdirectories
          await this._scanDirectoryForOrphans(fullPath, orphanedFiles)
        } else {
          // Check if file exists in database
          const exists = await prisma.cloudFile.findFirst({
            where: { storagePath: fullPath },
            select: { id: true },
          })

          if (!exists) {
            orphanedFiles.push(fullPath)
          }
        }
      }
    } catch (error) {
      console.warn(`[Orphan Cleanup] Error scanning directory ${dirPath}:`, error)
    }
  }

  /**
   * Delete orphaned files from storage
   */
  static async deleteOrphanedFiles(filePaths: string[]): Promise<number> {
    if (!filePaths.length) return 0

    let deletedCount = 0

    for (const filePath of filePaths) {
      try {
        await deleteFile(filePath)
        deletedCount++
      } catch (error) {
        console.error(`[Orphan Cleanup] Failed to delete orphaned file: ${filePath}`, error)
      }
    }

    console.log(`[Orphan Cleanup] Deleted ${deletedCount} orphaned files`)
    return deletedCount
  }

  /**
   * Run full orphan cleanup (database sync + orphaned file detection)
   */
  static async runFullCleanup(): Promise<OrphanCleanupStats> {
    console.log('[Orphan Cleanup] Starting full orphan cleanup...')
    const startTime = Date.now()

    const stats: OrphanCleanupStats = {
      equipmentImagesDeleted: 0,
      cloudFilesDeleted: 0,
      cloudFoldersDeleted: 0,
      orphanedFilesFound: 0,
      orphanedFilesDeleted: 0,
      errors: [],
    }

    try {
      // Find files that should have been deleted but weren't
      const orphanedFiles = await this.findOrphanedFiles()
      stats.orphanedFilesFound = orphanedFiles.length

      // Delete orphaned files
      if (orphanedFiles.length > 0) {
        stats.orphanedFilesDeleted = await this.deleteOrphanedFiles(orphanedFiles)
      }

      const duration = Date.now() - startTime
      console.log(
        `[Orphan Cleanup] Full cleanup completed in ${duration}ms. Cleaned ${stats.orphanedFilesDeleted} orphaned files.`
      )

      return stats
    } catch (error) {
      console.error('[Orphan Cleanup] Full cleanup failed:', error)
      throw error
    }
  }
}
