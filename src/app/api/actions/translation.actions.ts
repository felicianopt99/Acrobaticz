'use server';

/**
 * Translation Server Actions
 * Client-facing actions for translation operations
 * All actions follow the standard API response pattern: { status, data, timestamp }
 */

import { prisma } from '@/lib/db';
import {
  deeplTranslateText,
  batchTranslate,
  clearExpiredCache,
  getCacheStats,
  resetApiKeyCache,
} from '@/lib/deepl.service';
import type {
  Language,
  TranslationRequest,
  TranslationStatus,
  ServerActionResult,
  SUPPORTED_LANGUAGES,
} from '@/types/translation.types';

/**
 * Translate product/equipment
 * Automatically translates all configured languages and stores in DB
 */
export async function translateProduct(
  productId: string,
  name: string,
  description: string | null,
  targetLanguages: Language[] = ['pt']
): Promise<ServerActionResult<TranslationStatus>> {
  const timestamp = new Date().toISOString();

  try {
    // Validate input
    if (!productId || !name) {
      return {
        status: 'error',
        message: 'Product ID and name are required',
        timestamp,
      };
    }

    const translations: TranslationStatus['translations'] = {};
    let hasErrors = false;

    // Translate name for each language
    for (const lang of targetLanguages) {
      try {
        const nameResult = await deeplTranslateText(name, lang);

        if (nameResult.status === 'success' && nameResult.data) {
          // Save to ProductTranslation table
          await prisma.productTranslation.upsert({
            where: {
              productId_language: {
                productId,
                language: lang,
              },
            },
            create: {
              id: crypto.randomUUID(),
              productId,
              language: lang,
              name: nameResult.data.translatedText,
              description: description
                ? (await deeplTranslateText(description, lang)).data?.translatedText
                : undefined,
              isAutomatic: true,
              updatedAt: new Date(),
            },
            update: {
              name: nameResult.data.translatedText,
              description: description
                ? (await deeplTranslateText(description, lang)).data?.translatedText
                : undefined,
              updatedAt: new Date(),
            },
          });

          translations[lang] = {
            status: 'completed',
            text: nameResult.data.translatedText,
            translatedAt: timestamp,
          };
        } else {
          throw new Error(nameResult.message || 'Translation failed');
        }
      } catch (error) {
        hasErrors = true;
        translations[lang] = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // Update translation job status
    await prisma.translationJob.updateMany({
      where: {
        contentType: 'product',
        contentId: productId,
        status: 'pending',
      },
      data: {
        status: hasErrors ? 'failed' : 'completed',
        progress: 100,
        completedItems: targetLanguages.length,
        completedAt: new Date(),
      },
    });

    const result: TranslationStatus = {
      contentId: productId,
      contentType: 'product',
      contentName: name,
      translations,
      lastUpdated: timestamp,
      isAutomatic: true,
    };

    return {
      status: hasErrors ? 'error' : 'success',
      data: result,
      message: hasErrors ? 'Some translations failed' : 'Product translated successfully',
      timestamp,
    };
  } catch (error) {
    console.error('Error translating product:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Product translation failed',
      timestamp,
    };
  }
}

/**
 * Translate category
 * Automatically translates all configured languages and stores in DB
 */
export async function translateCategory(
  categoryId: string,
  name: string,
  description: string | null,
  targetLanguages: Language[] = ['pt']
): Promise<ServerActionResult<TranslationStatus>> {
  const timestamp = new Date().toISOString();

  try {
    if (!categoryId || !name) {
      return {
        status: 'error',
        message: 'Category ID and name are required',
        timestamp,
      };
    }

    const translations: TranslationStatus['translations'] = {};
    let hasErrors = false;

    for (const lang of targetLanguages) {
      try {
        const nameResult = await deeplTranslateText(name, lang);

        if (nameResult.status === 'success' && nameResult.data) {
          await prisma.categoryTranslation.upsert({
            where: {
              categoryId_language: {
                categoryId,
                language: lang,
              },
            },
            create: {
              id: crypto.randomUUID(),
              categoryId,
              language: lang,
              name: nameResult.data.translatedText,
              description: description
                ? (await deeplTranslateText(description, lang)).data?.translatedText
                : undefined,
              isAutomatic: true,
              updatedAt: new Date(),
            },
            update: {
              name: nameResult.data.translatedText,
              description: description
                ? (await deeplTranslateText(description, lang)).data?.translatedText
                : undefined,
              updatedAt: new Date(),
            },
          });

          translations[lang] = {
            status: 'completed',
            text: nameResult.data.translatedText,
            translatedAt: timestamp,
          };
        } else {
          throw new Error(nameResult.message || 'Translation failed');
        }
      } catch (error) {
        hasErrors = true;
        translations[lang] = {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const result: TranslationStatus = {
      contentId: categoryId,
      contentType: 'category',
      contentName: name,
      translations,
      lastUpdated: timestamp,
      isAutomatic: true,
    };

    return {
      status: hasErrors ? 'error' : 'success',
      data: result,
      message: hasErrors ? 'Some translations failed' : 'Category translated successfully',
      timestamp,
    };
  } catch (error) {
    console.error('Error translating category:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Category translation failed',
      timestamp,
    };
  }
}

/**
 * Get translation status for a product
 */
export async function getProductTranslationStatus(
  productId: string
): Promise<ServerActionResult<TranslationStatus>> {
  const timestamp = new Date().toISOString();

  try {
    const product = await prisma.equipmentItem.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return {
        status: 'error',
        message: 'Product not found',
        timestamp,
      };
    }

    const translations = await prisma.productTranslation.findMany({
      where: { productId },
    });

    const translationMap: TranslationStatus['translations'] = {};
    for (const t of translations) {
      translationMap[t.language as Language] = {
        status: 'completed',
        text: t.name,
        translatedAt: t.updatedAt.toISOString(),
      };
    }

    const result: TranslationStatus = {
      contentId: productId,
      contentType: 'product',
      contentName: product.name,
      translations: translationMap,
      lastUpdated: new Date().toISOString(),
      isAutomatic: translations.some(t => t.isAutomatic),
    };

    return {
      status: 'success',
      data: result,
      timestamp,
    };
  } catch (error) {
    console.error('Error getting product translation status:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get status',
      timestamp,
    };
  }
}

/**
 * Get translation status for a category
 */
export async function getCategoryTranslationStatus(
  categoryId: string
): Promise<ServerActionResult<TranslationStatus>> {
  const timestamp = new Date().toISOString();

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return {
        status: 'error',
        message: 'Category not found',
        timestamp,
      };
    }

    const translations = await prisma.categoryTranslation.findMany({
      where: { categoryId },
    });

    const translationMap: TranslationStatus['translations'] = {};
    for (const t of translations) {
      translationMap[t.language as Language] = {
        status: 'completed',
        text: t.name,
        translatedAt: t.updatedAt.toISOString(),
      };
    }

    const result: TranslationStatus = {
      contentId: categoryId,
      contentType: 'category',
      contentName: category.name,
      translations: translationMap,
      lastUpdated: new Date().toISOString(),
      isAutomatic: translations.some(t => t.isAutomatic),
    };

    return {
      status: 'success',
      data: result,
      timestamp,
    };
  } catch (error) {
    console.error('Error getting category translation status:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Failed to get status',
      timestamp,
    };
  }
}

/**
 * Retranslate product (manual refresh)
 */
export async function retranslateProduct(
  productId: string,
  targetLanguages: Language[] = ['pt']
): Promise<ServerActionResult<TranslationStatus>> {
  const product = await prisma.equipmentItem.findUnique({
    where: { id: productId },
  });

  if (!product) {
    return {
      status: 'error',
      message: 'Product not found',
      timestamp: new Date().toISOString(),
    };
  }

  // Delete existing translations to force re-translation
  await prisma.productTranslation.deleteMany({
    where: {
      productId,
      language: { in: targetLanguages },
    },
  });

  // Clear cache for this product
  await prisma.translationCache.deleteMany({
    where: {
      contentId: productId,
      contentType: 'product',
      targetLanguage: { in: targetLanguages },
    },
  });

  // Re-translate
  return translateProduct(productId, product.name, product.description, targetLanguages);
}

/**
 * Retranslate category (manual refresh)
 */
export async function retranslateCategory(
  categoryId: string,
  targetLanguages: Language[] = ['pt']
): Promise<ServerActionResult<TranslationStatus>> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return {
      status: 'error',
      message: 'Category not found',
      timestamp: new Date().toISOString(),
    };
  }

  // Delete existing translations
  await prisma.categoryTranslation.deleteMany({
    where: {
      categoryId,
      language: { in: targetLanguages },
    },
  });

  // Clear cache
  await prisma.translationCache.deleteMany({
    where: {
      contentId: categoryId,
      contentType: 'category',
      targetLanguage: { in: targetLanguages },
    },
  });

  // Re-translate
  return translateCategory(categoryId, category.name, category.description, targetLanguages);
}

/**
 * Get cache statistics
 */
export async function getCacheStatistics() {
  return getCacheStats();
}

/**
 * Clear expired cache
 */
export async function clearExpiredCacheAction() {
  return clearExpiredCache();
}

/**
 * Cleanup and reset translations
 */
export async function cleanupTranslations(): Promise<
  ServerActionResult<{
    deletedCacheEntries: number;
    deletedJobs: number;
  }>
> {
  const timestamp = new Date().toISOString();

  try {
    // Clear expired cache
    const cacheResult = await clearExpiredCache();
    const deletedCache = cacheResult.data?.deletedCount || 0;

    // Clean up old completed jobs
    const jobResult = await prisma.translationJob.deleteMany({
      where: {
        status: 'completed',
        completedAt: {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
    });

    return {
      status: 'success',
      data: {
        deletedCacheEntries: deletedCache,
        deletedJobs: jobResult.count,
      },
      timestamp,
    };
  } catch (error) {
    console.error('Error cleaning up translations:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Cleanup failed',
      timestamp,
    };
  }
}
