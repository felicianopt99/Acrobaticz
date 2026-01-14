/**
 * Cache invalidation utilities
 * Invalidates cache when data is modified
 */

import { cacheManager, CACHE_KEYS } from './cache'

export class CacheInvalidation {
  /**
   * Invalidate category cache (when created, updated, or deleted)
   */
  static invalidateCategory(categoryId?: string) {
    // Always invalidate all categories
    cacheManager.remove(CACHE_KEYS.CATEGORIES)
    
    // Also invalidate specific category if provided
    if (categoryId) {
      cacheManager.remove(CACHE_KEYS.CATEGORY(categoryId))
    }

    console.log('[Cache] Invalidated category cache')
  }

  /**
   * Invalidate equipment cache (on any equipment change)
   */
  static invalidateEquipment() {
    // For now, we'll clear cache on any equipment change
    // In production, you might want to be more granular
    cacheManager.clear()
    console.log('[Cache] Invalidated all equipment cache')
  }

  /**
   * Invalidate catalog share cache
   */
  static invalidateCatalogShare(token: string) {
    cacheManager.remove(CACHE_KEYS.CATALOG_SHARE(token))
    console.log(`[Cache] Invalidated catalog share cache for token: ${token}`)
  }

  /**
   * Clear all cache
   */
  static clearAll() {
    cacheManager.clear()
    console.log('[Cache] Cleared all cache')
  }
}
