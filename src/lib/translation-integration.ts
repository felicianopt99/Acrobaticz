/**
 * Translation Integration Utilities
 * Triggers and hooks for automatic translation of products and categories
 */

import { prisma } from '@/lib/db';
import { translateProduct, translateCategory } from '@/app/api/actions/translation.actions';
import type { Language } from '@/types/translation.types';

const DEFAULT_TARGET_LANGUAGES: Language[] = ['pt'];

/**
 * Trigger automatic translation when creating/updating equipment
 * Call this in your equipment creation/update handlers
 */
export async function triggerProductTranslation(
  productId: string,
  name: string,
  description: string | null,
  targetLanguages: Language[] = DEFAULT_TARGET_LANGUAGES
): Promise<void> {
  try {
    // Create a translation job for tracking
    await prisma.translationJob.create({
      data: {
        contentType: 'product',
        contentId: productId,
        targetLanguages: JSON.stringify(targetLanguages),
        status: 'pending',
      },
    });

    // Run translation asynchronously (fire and forget)
    // In production, consider using a job queue (Bull, RabbitMQ, etc.)
    translateProduct(productId, name, description, targetLanguages).catch(error => {
      console.error(`Failed to auto-translate product ${productId}:`, error);
      // Update job status to failed
      prisma.translationJob.updateMany({
        where: {
          contentType: 'product',
          contentId: productId,
          status: 'pending',
        },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(err => console.error('Failed to update job status:', err));
    });
  } catch (error) {
    console.error('Error triggering product translation:', error);
  }
}

/**
 * Trigger automatic translation when creating/updating category
 * Call this in your category creation/update handlers
 */
export async function triggerCategoryTranslation(
  categoryId: string,
  name: string,
  description: string | null,
  targetLanguages: Language[] = DEFAULT_TARGET_LANGUAGES
): Promise<void> {
  try {
    // Create a translation job for tracking
    await prisma.translationJob.create({
      data: {
        contentType: 'category',
        contentId: categoryId,
        targetLanguages: JSON.stringify(targetLanguages),
        status: 'pending',
      },
    });

    // Run translation asynchronously
    translateCategory(categoryId, name, description, targetLanguages).catch(error => {
      console.error(`Failed to auto-translate category ${categoryId}:`, error);
      prisma.translationJob.updateMany({
        where: {
          contentType: 'category',
          contentId: categoryId,
          status: 'pending',
        },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(err => console.error('Failed to update job status:', err));
    });
  } catch (error) {
    console.error('Error triggering category translation:', error);
  }
}

/**
 * Get translation job status
 */
export async function getTranslationJobStatus(jobId: string) {
  try {
    return await prisma.translationJob.findUnique({
      where: { id: jobId },
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    return null;
  }
}

/**
 * Get pending translation jobs
 */
export async function getPendingTranslationJobs(limit: number = 100) {
  try {
    return await prisma.translationJob.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  } catch (error) {
    console.error('Error getting pending jobs:', error);
    return [];
  }
}

/**
 * Process pending translation jobs (for batch processing)
 * Useful for background jobs or scheduled tasks
 */
export async function processPendingTranslationJobs(): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
}> {
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
  };

  try {
    const pendingJobs = await getPendingTranslationJobs();

    for (const job of pendingJobs) {
      stats.processed++;

      try {
        const targetLanguages = JSON.parse(job.targetLanguages) as Language[];

        if (job.contentType === 'product') {
          const product = await prisma.equipmentItem.findUnique({
            where: { id: job.contentId },
          });

          if (product) {
            await translateProduct(
              product.id,
              product.name,
              product.description,
              targetLanguages
            );
            stats.succeeded++;
          }
        } else if (job.contentType === 'category') {
          const category = await prisma.category.findUnique({
            where: { id: job.contentId },
          });

          if (category) {
            await translateCategory(
              category.id,
              category.name,
              category.description,
              targetLanguages
            );
            stats.succeeded++;
          }
        }
      } catch (error) {
        stats.failed++;
        console.error(`Failed to process job ${job.id}:`, error);

        // Update job status
        await prisma.translationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    }

    return stats;
  } catch (error) {
    console.error('Error processing translation jobs:', error);
    return stats;
  }
}
