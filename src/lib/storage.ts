import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const EXTERNAL_STORAGE_PATH = process.env.EXTERNAL_STORAGE_PATH || '/mnt/backup_drive/av-rentals/cloud-storage';
const EXTERNAL_STORAGE_TEMP = process.env.EXTERNAL_STORAGE_TEMP || '/mnt/backup_drive/av-rentals/cloud-storage/temp';

export interface DiskHealth {
  isAccessible: boolean;
  available: number;
  total: number;
  usedPercent: number;
  lastCheck: Date;
  error?: string;
}

let cachedDiskHealth: DiskHealth | null = null;
let lastHealthCheck = 0;

/**
 * Check if external storage disk is accessible and writable
 */
export async function checkDiskHealth(): Promise<DiskHealth> {
  try {
    const now = Date.now();
    const checkInterval = parseInt(process.env.STORAGE_CHECK_INTERVAL || '300000', 10);
    
    // Return cached result if recent enough
    if (cachedDiskHealth && (now - lastHealthCheck) < checkInterval) {
      return cachedDiskHealth;
    }

    // Check if path exists and is accessible
    await fs.access(EXTERNAL_STORAGE_PATH, fs.constants.R_OK | fs.constants.W_OK);
    
    // Get disk usage statistics
    const result = execSync(`df -B1 "${EXTERNAL_STORAGE_PATH}"`, { encoding: 'utf-8' });
    const lines = result.trim().split('\n');
    const [, , total, used] = lines[1].split(/\s+/).map(Number);
    
    const available = total - used;
    const usedPercent = (used / total) * 100;

    cachedDiskHealth = {
      isAccessible: true,
      available,
      total,
      usedPercent,
      lastCheck: new Date(),
    };
    lastHealthCheck = now;

    return cachedDiskHealth;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const health: DiskHealth = {
      isAccessible: false,
      available: 0,
      total: 0,
      usedPercent: 0,
      lastCheck: new Date(),
      error: errorMsg,
    };
    cachedDiskHealth = health;
    lastHealthCheck = Date.now();
    return health;
  }
}

/**
 * Get storage path for a user's file
 */
export function getStoragePath(userId: string, folderId?: string, filename?: string): string {
  const basePath = path.join(EXTERNAL_STORAGE_PATH, userId, 'files');
  
  if (folderId) {
    const folderPath = path.join(basePath, folderId);
    if (filename) {
      return path.join(folderPath, filename);
    }
    return folderPath;
  }
  
  if (filename) {
    return path.join(basePath, filename);
  }
  
  return basePath;
}

/**
 * Get version storage path for a file
 */
export function getVersionPath(userId: string, fileId: string, versionNum: number): string {
  return path.join(EXTERNAL_STORAGE_PATH, userId, 'versions', fileId, `v${versionNum}`);
}

/**
 * Ensure all required storage directories exist
 */
export async function ensureStorageDirectories(): Promise<void> {
  try {
    // Create main directories
    await fs.mkdir(EXTERNAL_STORAGE_PATH, { recursive: true });
    await fs.mkdir(EXTERNAL_STORAGE_TEMP, { recursive: true });
    
    console.log('✅ Storage directories initialized:', EXTERNAL_STORAGE_PATH);
  } catch (error) {
    console.error('❌ Failed to initialize storage directories:', error);
    throw error;
  }
}

/**
 * Get disk usage for a specific user
 */
export async function getUserDiskUsage(userId: string): Promise<BigInt> {
  try {
    const userPath = path.join(EXTERNAL_STORAGE_PATH, userId);
    
    // Check if user directory exists
    try {
      await fs.access(userPath);
    } catch {
      return BigInt(0);
    }

    // Get size of user directory
    const result = execSync(`du -sb "${userPath}"`, { encoding: 'utf-8' });
    const [sizeStr] = result.trim().split(/\s+/);
    return BigInt(parseInt(sizeStr, 10));
  } catch (error) {
    console.error(`Failed to calculate disk usage for user ${userId}:`, error);
    return BigInt(0);
  }
}

/**
 * Get available disk space
 */
export async function getAvailableDiskSpace(): Promise<bigint> {
  const health = await checkDiskHealth();
  return BigInt(health.available);
}

/**
 * Check if enough space is available for a file
 */
export async function hasEnoughSpace(fileSize: bigint): Promise<boolean> {
  const available = await getAvailableDiskSpace();
  // Keep 1GB buffer as safety margin for system operations
  const buffer = BigInt(1) * BigInt(1024) * BigInt(1024) * BigInt(1024);
  return available > (fileSize + buffer);
}

/**
 * Create a user's storage directory structure
 */
export async function createUserStorageDirectories(userId: string): Promise<void> {
  try {
    const userBase = path.join(EXTERNAL_STORAGE_PATH, userId);
    await fs.mkdir(path.join(userBase, 'files'), { recursive: true });
    await fs.mkdir(path.join(userBase, 'versions'), { recursive: true });
    await fs.mkdir(path.join(userBase, 'temp'), { recursive: true });
  } catch (error) {
    console.error(`Failed to create storage directories for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error(`Failed to delete file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Delete a directory and all its contents
 */
export async function deleteDirectory(dirPath: string): Promise<void> {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    console.error(`Failed to delete directory ${dirPath}:`, error);
    throw error;
  }
}

/**
 * Move file from source to destination
 */
export async function moveFile(source: string, destination: string): Promise<void> {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    await fs.mkdir(destDir, { recursive: true });
    
    // Rename (move) file
    await fs.rename(source, destination);
  } catch (error) {
    console.error(`Failed to move file from ${source} to ${destination}:`, error);
    throw error;
  }
}

/**
 * Copy file from source to destination (for versioning)
 */
export async function copyFile(source: string, destination: string): Promise<void> {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destination);
    await fs.mkdir(destDir, { recursive: true });
    
    // Copy file
    await fs.copyFile(source, destination);
  } catch (error) {
    console.error(`Failed to copy file from ${source} to ${destination}:`, error);
    throw error;
  }
}

/**
 * Save uploaded file to storage
 */
export async function saveFile(buffer: Buffer, filePath: string): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, buffer);
  } catch (error) {
    console.error(`Failed to save file to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Read file from storage
 */
export async function readFile(filePath: string): Promise<Buffer> {
  try {
    return await fs.readFile(filePath);
  } catch (error) {
    console.error(`Failed to read file from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    console.error(`Failed to get stats for ${filePath}:`, error);
    throw error;
  }
}

/**
 * List files in a directory
 */
export async function listDirectory(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch (error) {
    console.error(`Failed to list directory ${dirPath}:`, error);
    return [];
  }
}

/**
 * Clean up temp directory (remove files older than specified time)
 */
export async function cleanupTempDirectory(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const files = await fs.readdir(EXTERNAL_STORAGE_TEMP);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(EXTERNAL_STORAGE_TEMP, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > olderThanMs) {
        await fs.rm(filePath, { recursive: true, force: true });
        console.log(`🗑️ Cleaned up temp file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup temp directory:', error);
  }
}
