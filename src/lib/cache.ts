/**
 * Simple in-memory cache implementation
 * For production, consider using Redis
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>()
  private cleanupInterval: ReturnType<typeof setInterval> | null = null

  constructor(cleanupIntervalMs = 60000) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, cleanupIntervalMs)
  }

  /**
   * Get value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value as T
  }

  /**
   * Set value in cache with TTL (milliseconds)
   */
  set<T>(key: string, value: T, ttlMs = 3600000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    })
  }

  /**
   * Remove value from cache
   */
  remove(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        expiresIn: Math.max(0, entry.expiresAt - Date.now()),
      })),
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Global cache instance
export const cacheManager = new CacheManager()

// Cache keys
export const CACHE_KEYS = {
  CATEGORIES: 'categories:all',
  CATEGORY: (id: string) => `category:${id}`,
  EQUIPMENT: (page: number, pageSize: number, filters: string) => `equipment:${page}:${pageSize}:${filters}`,
  CATALOG_SHARE: (token: string) => `catalog:share:${token}`,
} as const

// Cache TTLs (in milliseconds)
export const CACHE_TTL = {
  CATEGORIES: 3600000, // 1 hour
  CATEGORY: 1800000, // 30 minutes
  EQUIPMENT: 300000, // 5 minutes
  CATALOG_SHARE: 600000, // 10 minutes
} as const
