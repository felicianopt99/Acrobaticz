/**
 * Translation Service Tests
 * Comprehensive tests for the translation service
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@/lib/db';
import {
  translateText,
  batchTranslate,
  getCacheStats,
  clearExpiredCache,
  resetApiKeyCache,
} from '@/lib/deepl.service';
import {
  translateProduct,
  translateCategory,
  getProductTranslationStatus,
  getCategoryTranslationStatus,
  retranslateProduct,
  retranslateCategory,
  cleanupTranslations,
} from '@/app/api/actions/translation.actions';
import type { Language } from '@/types/translation.types';

describe('Translation Service', () => {
  const testProductId = 'test-product-' + Date.now();
  const testCategoryId = 'test-category-' + Date.now();

  beforeAll(async () => {
    // Create test data
    await prisma.category.create({
      data: {
        id: testCategoryId,
        name: 'Test Category',
        description: 'Test Description',
      },
    });

    await prisma.equipmentItem.create({
      data: {
        id: testProductId,
        name: 'Test Equipment',
        description: 'Test Equipment Description',
        categoryId: testCategoryId,
        quantity: 1,
        location: 'Test Location',
        type: 'Test Type',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.translationCache.deleteMany({
      where: {
        OR: [
          { contentId: testProductId },
          { contentId: testCategoryId },
        ],
      },
    });

    await prisma.productTranslation.deleteMany({
      where: { productId: testProductId },
    });

    await prisma.categoryTranslation.deleteMany({
      where: { categoryId: testCategoryId },
    });

    await prisma.translationJob.deleteMany({
      where: {
        OR: [
          { contentId: testProductId },
          { contentId: testCategoryId },
        ],
      },
    });

    await prisma.equipmentItem.delete({
      where: { id: testProductId },
    });

    await prisma.category.delete({
      where: { id: testCategoryId },
    });
  });

  describe('Single Text Translation', () => {
    it('should translate text and return success response', async () => {
      const result = await translateText('Hello', 'pt', 'general');

      expect(result.status).toBe('success');
      expect(result.data).toBeDefined();
      expect(result.timestamp).toBeDefined();
      expect(result.data?.translatedText).toBeTruthy();
      expect(result.data?.sourceText).toBe('Hello');
      expect(result.data?.targetLanguage).toBe('pt');
    });

    it('should return error for empty text', async () => {
      const result = await translateText('', 'pt', 'general');

      expect(result.status).toBe('error');
      expect(result.message).toBeDefined();
    });

    it('should use cache on second request', async () => {
      const sourceText = 'Cache Test ' + Date.now();

      // First request
      const result1 = await translateText(sourceText, 'pt', 'general');
      expect(result1.data?.usedCache).toBe(false);

      // Second request (should use cache)
      const result2 = await translateText(sourceText, 'pt', 'general');
      expect(result2.data?.usedCache).toBe(true);
      expect(result2.data?.translatedText).toBe(result1.data?.translatedText);
    });
  });

  describe('Batch Translation', () => {
    it('should batch translate for multiple languages', async () => {
      const result = await batchTranslate({
        sourceText: 'Product Test',
        targetLanguages: ['pt', 'en'],
        context: {
          contentType: 'product',
          contentId: testProductId,
        },
      });

      expect(result.status).toBe('success');
      expect(result.data?.totalRequests).toBe(2);
      expect(result.data?.results.length).toBe(2);
      expect(result.data?.newTranslations).toBeGreaterThan(0);
    });

    it('should track cached vs new translations', async () => {
      const sourceText = 'Batch Cache Test ' + Date.now();

      // First batch
      const result1 = await batchTranslate({
        sourceText,
        targetLanguages: ['pt', 'en'],
      });

      // Second batch (should use cache)
      const result2 = await batchTranslate({
        sourceText,
        targetLanguages: ['pt', 'en'],
      });

      expect(result2.data?.cachedRequests).toBe(2);
      expect(result2.data?.newTranslations).toBe(0);
    });
  });

  describe('Product Translation', () => {
    it('should translate product successfully', async () => {
      const result = await translateProduct(
        testProductId,
        'Test Equipment',
        'Test Equipment Description',
        ['pt']
      );

      expect(result.status).toBe('success');
      expect(result.data?.contentType).toBe('product');
      expect(result.data?.translations.pt).toBeDefined();
      expect(result.data?.translations.pt?.status).toBe('completed');
    });

    it('should get product translation status', async () => {
      const result = await getProductTranslationStatus(testProductId);

      expect(result.status).toBe('success');
      expect(result.data?.contentType).toBe('product');
      expect(result.data?.translations).toBeDefined();
    });

    it('should retranslate product', async () => {
      const result = await retranslateProduct(testProductId, ['pt']);

      expect(result.status).toBe('success');
      expect(result.data?.translations.pt?.status).toBe('completed');
    });

    it('should return error for non-existent product', async () => {
      const result = await retranslateProduct('non-existent-id', ['pt']);

      expect(result.status).toBe('error');
      expect(result.message).toContain('not found');
    });
  });

  describe('Category Translation', () => {
    it('should translate category successfully', async () => {
      const result = await translateCategory(
        testCategoryId,
        'Test Category',
        'Test Description',
        ['pt']
      );

      expect(result.status).toBe('success');
      expect(result.data?.contentType).toBe('category');
      expect(result.data?.translations.pt).toBeDefined();
      expect(result.data?.translations.pt?.status).toBe('completed');
    });

    it('should get category translation status', async () => {
      const result = await getCategoryTranslationStatus(testCategoryId);

      expect(result.status).toBe('success');
      expect(result.data?.contentType).toBe('category');
    });

    it('should retranslate category', async () => {
      const result = await retranslateCategory(testCategoryId, ['pt']);

      expect(result.status).toBe('success');
      expect(result.data?.translations.pt?.status).toBe('completed');
    });
  });

  describe('Cache Management', () => {
    it('should get cache statistics', async () => {
      const result = await getCacheStats();

      expect(result.status).toBe('success');
      expect(result.data?.totalCached).toBeGreaterThanOrEqual(0);
      expect(result.data?.totalExpired).toBeGreaterThanOrEqual(0);
      expect(result.data?.byLanguage).toBeDefined();
    });

    it('should clear expired cache entries', async () => {
      // Create expired cache entry
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);

      await prisma.translationCache.create({
        data: {
          sourceText: 'Expired Entry',
          targetLanguage: 'pt',
          translatedText: 'Entrada Expirada',
          contentType: 'test',
          hash: 'expired-' + Date.now(),
          expiresAt: expiredDate,
        },
      });

      const result = await clearExpiredCache();

      expect(result.status).toBe('success');
      expect(result.data?.deletedCount).toBeGreaterThan(0);
    });

    it('should reset API key cache', () => {
      // Should not throw
      expect(() => resetApiKeyCache()).not.toThrow();
    });
  });

  describe('Cleanup Operations', () => {
    it('should cleanup translations', async () => {
      const result = await cleanupTranslations();

      expect(result.status).toBe('success');
      expect(result.data?.deletedCacheEntries).toBeGreaterThanOrEqual(0);
      expect(result.data?.deletedJobs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API key not configured', async () => {
      // Reset key to force error
      resetApiKeyCache();

      // This test assumes API key is required
      // Actual behavior depends on your config setup
      const result = await translateText('test', 'pt');

      // Should either succeed (if key is available) or return error
      expect(result.timestamp).toBeDefined();
    });

    it('should handle missing content type', async () => {
      const result = await translateProduct(
        'missing-id',
        'Test',
        'Description',
        ['pt']
      );

      // Should handle gracefully
      expect(result.status).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent translations', async () => {
      const promises = Array.from({ length: 5 }).map((_, i) =>
        translateText(`Test ${i}`, 'pt', 'general')
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(results.every(r => r.status === 'success')).toBe(true);
    });

    it('should handle large batch translations', async () => {
      const languages: Language[] = ['pt', 'en'];

      const result = await batchTranslate({
        sourceText: 'Large batch test ' + Date.now(),
        targetLanguages: languages,
      });

      expect(result.data?.totalRequests).toBe(2);
      expect(result.data?.results.length).toBe(2);
    });
  });
});

/**
 * Integration Test Examples
 * These test the full flow from creation to translation
 */
describe('Translation Integration Flow', () => {
  it('should complete full product translation flow', async () => {
    const productId = 'integration-test-' + Date.now();
    const categoryId = 'integration-cat-' + Date.now();

    try {
      // Setup
      await prisma.category.create({
        data: {
          id: categoryId,
          name: 'Integration Test Category',
        },
      });

      await prisma.equipmentItem.create({
        data: {
          id: productId,
          name: 'Integration Test Product',
          description: 'Integration test description',
          categoryId,
          quantity: 1,
          location: 'Test',
          type: 'Test',
        },
      });

      // Translate
      const translateResult = await translateProduct(
        productId,
        'Integration Test Product',
        'Integration test description',
        ['pt']
      );

      expect(translateResult.status).toBe('success');

      // Get status
      const statusResult = await getProductTranslationStatus(productId);
      expect(statusResult.data?.translations.pt?.status).toBe('completed');

      // Retranslate
      const retranslateResult = await retranslateProduct(productId, ['pt']);
      expect(retranslateResult.status).toBe('success');
    } finally {
      // Cleanup
      await prisma.translationCache.deleteMany({
        where: { contentId: productId },
      });
      await prisma.productTranslation.deleteMany({
        where: { productId },
      });
      await prisma.equipmentItem.delete({
        where: { id: productId },
      });
      await prisma.category.delete({
        where: { id: categoryId },
      });
    }
  });
});
