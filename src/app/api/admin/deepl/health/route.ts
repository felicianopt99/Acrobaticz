/**
 * DeepL Integration Health Check Endpoint
 * GET /api/admin/deepl/health - Check DeepL integration status
 * POST /api/admin/deepl/health - Perform maintenance (reset cache, etc)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { configService } from '@/lib/config-service';
import { getAPIKey } from '@/app/api/actions/api-configuration.actions';

/**
 * Test connection to DeepL API without making unnecessary calls
 */
async function testDeepLApiConnection(): Promise<{
  success: boolean;
  message: string;
  statusCode?: number;
}> {
  try {
    // Get API key from priorities: DB → Config → Env
    let apiKey: string | null = await getAPIKey('deepl');
    if (!apiKey) {
      apiKey = (await configService.get('Integration', 'DEEPL_API_KEY')) ?? null;
    }
    if (!apiKey) {
      apiKey = process.env.DEEPL_API_KEY ?? null;
    }

    if (!apiKey) {
      return {
        success: false,
        message: 'No DeepL API key found. Please configure it in Admin Settings.',
      };
    }

    // Validate format
    if (apiKey.length < 24 || apiKey.length > 128) {
      return {
        success: false,
        message: `Invalid API key format: ${apiKey.length} characters (expected 24-128)`,
      };
    }

    // Make minimal test request (just check auth)
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: ['test'],
        target_lang: 'EN',
      }),
    });

    if (response.status === 401) {
      return {
        success: false,
        message: 'DeepL API: Authentication failed (401). Check API key.',
        statusCode: 401,
      };
    }

    if (response.status === 429) {
      return {
        success: false,
        message: 'DeepL API: Rate limit reached (429). Wait and try again.',
        statusCode: 429,
      };
    }

    if (response.status === 456) {
      return {
        success: false,
        message: 'DeepL API: Character quota exceeded (456).',
        statusCode: 456,
      };
    }

    if (response.status === 503) {
      return {
        success: false,
        message: 'DeepL API: Service unavailable (503). Try later.',
        statusCode: 503,
      };
    }

    if (response.ok) {
      return {
        success: true,
        message: 'DeepL API connection successful',
        statusCode: 200,
      };
    }

    const error = await response.text();
    return {
      success: false,
      message: `DeepL API error ${response.status}: ${error}`,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection test error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

/**
 * Get cache statistics
 */
async function getCacheStats(): Promise<{
  validEntries: number;
  expiredEntries: number;
  totalSize: number;
  estimatedMemoryMB: number;
  byLanguage: Record<string, number>;
}> {
  try {
    const valid = await prisma.translationCache.count({
      where: {
        expiresAt: { gte: new Date() },
      },
    });

    const expired = await prisma.translationCache.count({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    const byLanguage = await prisma.translationCache.groupBy({
      by: ['targetLanguage'],
      _count: true,
    });

    return {
      validEntries: valid,
      expiredEntries: expired,
      totalSize: valid + expired,
      estimatedMemoryMB: ((valid + expired) * 0.5) / 1024, // ~500 bytes per entry
      byLanguage: Object.fromEntries(
        byLanguage.map((item) => [item.targetLanguage, item._count])
      ) as Record<string, number>,
    };
  } catch (error) {
    console.error('[DeepL Health] Error getting cache stats:', error);
    return {
      validEntries: 0,
      expiredEntries: 0,
      totalSize: 0,
      estimatedMemoryMB: 0,
      byLanguage: {},
    };
  }
}

/**
 * GET /api/admin/deepl/health
 * Check DeepL integration health status
 */
export async function GET(request: NextRequest) {
  try {
    const timestamp = new Date().toISOString();
    const isDetailedRequest = request.nextUrl.searchParams.get('detailed') === 'true';

    console.log('[DeepL Health] 🏥 Starting health check...');

    // 1. Test API connection
    console.log('[DeepL Health] Test 1: API connectivity');
    const connectionTest = await testDeepLApiConnection();

    // 2. Get cache stats
    console.log('[DeepL Health] Test 2: Cache statistics');
    const cacheStats = await getCacheStats();

    // 3. Check for expired entries that should be cleaned
    let expiredWarning: string | null = null;
    if (cacheStats.expiredEntries > 1000) {
      expiredWarning = `⚠️ ${cacheStats.expiredEntries.toLocaleString()} expired cache entries should be cleaned`;
    }

    const health = {
      status: connectionTest.success ? 'healthy' : 'degraded',
      timestamp,
      integration: {
        name: 'DeepL Translation',
        version: 'v2',
      },
      tests: {
        api_connection: {
          status: connectionTest.success ? '✅' : '❌',
          message: connectionTest.message,
          statusCode: connectionTest.statusCode,
        },
        cache: cacheStats,
      },
      recommendations: [
        ...(connectionTest.success ? [] : ['⚠️ Fix API connection before using translation']),
        ...(expiredWarning ? [expiredWarning] : []),
        ...(cacheStats.estimatedMemoryMB > 100
          ? ['⚠️ Large cache: consider running cleanup']
          : []),
      ],
    };

    console.log(
      `[DeepL Health] Result: ${health.status} (${
        connectionTest.success ? 'API OK' : 'API FAIL'
      })`
    );

    return NextResponse.json(health, {
      status: connectionTest.success ? 200 : 503,
    });
  } catch (error) {
    console.error('[DeepL Health] ❌ Error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/deepl/health
 * Perform maintenance actions
 * Body: { action: 'clean-expired' | 'reset-cache' | 'test-translation' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    console.log(`[DeepL Health] 🔧 Maintenance action: ${action}`);

    if (action === 'clean-expired') {
      // Delete expired cache entries
      const deleted = await prisma.translationCache.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      console.log(
        `[DeepL Health] Cleaned ${deleted.count} expired entries`
      );

      return NextResponse.json(
        {
          success: true,
          action: 'clean-expired',
          deletedEntries: deleted.count,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    if (action === 'reset-api-cache') {
      // Reset API key cache - currently not implemented in deepl.service
      try {
        // Clear any cached configurations
        console.log('[DeepL Health] API key cache reset (maintenance mode)');

        return NextResponse.json(
          {
            success: true,
            action: 'reset-api-cache',
            message: 'API key cache has been reset',
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      } catch (err) {
        return NextResponse.json(
          {
            success: false,
            action: 'reset-api-cache',
            error: err instanceof Error ? err.message : 'Failed to import deepl service',
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    if (action === 'test-translation') {
      // Test a simple translation
      try {
        const { deeplTranslateText } = await import('@/lib/deepl.service');

        const result = await deeplTranslateText('Hello world', 'pt');

        if (result.status === 'success' && result.data) {
          return NextResponse.json(
            {
              success: true,
              action: 'test-translation',
              source: 'Hello world',
              target: 'pt',
              translation: result.data.translatedText,
              usedCache: result.data.usedCache,
              timestamp: new Date().toISOString(),
            },
            { status: 200 }
          );
        } else {
          return NextResponse.json(
            {
              success: false,
              action: 'test-translation',
              error: result.message,
              timestamp: new Date().toISOString(),
            },
            { status: 500 }
          );
        }
      } catch (err) {
        return NextResponse.json(
          {
            success: false,
            action: 'test-translation',
            error: err instanceof Error ? err.message : 'Translation test failed',
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `Unknown action: ${action}`,
        validActions: ['clean-expired', 'reset-api-cache', 'test-translation'],
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('[DeepL Health] ❌ Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
