'use server';

import { prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

export interface APIConfigRequest {
  provider: 'deepl' | 'gemini';
  apiKey: string;
  settings?: Record<string, unknown>;
}

export interface APIConfigResponse {
  id: string;
  provider: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  lastTestedAt: Date | null;
  testStatus: string;
  testError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get all API configurations (redacts sensitive data)
 */
export async function getAPIConfigurations(): Promise<APIConfigResponse[]> {
  try {
    const configs = await prisma.aPIConfiguration.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return configs.map((config) => ({
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      settings: config.settings as Record<string, unknown>,
      lastTestedAt: config.lastTestedAt,
      testStatus: config.testStatus,
      testError: config.testError,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));
  } catch (error) {
    console.error('Error fetching API configurations:', error);
    throw new Error('Failed to fetch API configurations');
  }
}

/**
 * Get a specific API configuration by provider
 */
export async function getAPIConfig(provider: string): Promise<APIConfigResponse | null> {
  try {
    const config = await prisma.aPIConfiguration.findUnique({
      where: { provider },
    });

    if (!config) return null;

    return {
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      settings: config.settings as Record<string, unknown>,
      lastTestedAt: config.lastTestedAt,
      testStatus: config.testStatus,
      testError: config.testError,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  } catch (error) {
    console.error(`Error fetching API config for ${provider}:`, error);
    throw new Error(`Failed to fetch API configuration for ${provider}`);
  }
}

/**
 * Get API key by provider (for service use)
 */
export async function getAPIKey(provider: string): Promise<string | null> {
  try {
    const config = await prisma.aPIConfiguration.findUnique({
      where: { provider },
      select: { apiKey: true, isActive: true },
    });

    if (!config || !config.isActive) return null;

    return config.apiKey;
  } catch (error) {
    console.error(`Error fetching API key for ${provider}:`, error);
    return null;
  }
}

/**
 * Update or create an API configuration
 */
export async function updateAPIConfiguration(
  request: APIConfigRequest
): Promise<APIConfigResponse> {
  try {
    const config = await prisma.aPIConfiguration.upsert({
      where: { provider: request.provider },
      update: {
        apiKey: request.apiKey,
        settings: (request.settings || {}) as Prisma.JsonObject,
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        provider: request.provider,
        apiKey: request.apiKey,
        settings: (request.settings || {}) as Prisma.JsonObject,
        updatedAt: new Date(),
      },
    });

    return {
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      settings: config.settings as Record<string, unknown>,
      lastTestedAt: config.lastTestedAt,
      testStatus: config.testStatus,
      testError: config.testError,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  } catch (error) {
    console.error('Error updating API configuration:', error);
    throw new Error('Failed to update API configuration');
  }
}

/**
 * Toggle API configuration active status
 */
export async function toggleAPIConfiguration(
  provider: string,
  isActive: boolean
): Promise<APIConfigResponse> {
  try {
    const config = await prisma.aPIConfiguration.update({
      where: { provider },
      data: { isActive },
    });

    return {
      id: config.id,
      provider: config.provider,
      isActive: config.isActive,
      settings: config.settings as Record<string, unknown>,
      lastTestedAt: config.lastTestedAt,
      testStatus: config.testStatus,
      testError: config.testError,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    };
  } catch (error) {
    console.error('Error toggling API configuration:', error);
    throw new Error('Failed to toggle API configuration');
  }
}

/**
 * Delete an API configuration
 */
export async function deleteAPIConfiguration(provider: string): Promise<boolean> {
  try {
    await prisma.aPIConfiguration.delete({
      where: { provider },
    });
    return true;
  } catch (error) {
    console.error('Error deleting API configuration:', error);
    throw new Error('Failed to delete API configuration');
  }
}

/**
 * Test connection to an API
 */
export async function testAPIConnection(provider: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const config = await prisma.aPIConfiguration.findUnique({
      where: { provider },
    });

    if (!config) {
      return {
        success: false,
        message: `API configuration for ${provider} not found`,
      };
    }

    let testResult = { success: false, message: '' };

    if (provider === 'deepl') {
      testResult = await testDeepLConnection(config.apiKey);
    } else if (provider === 'gemini') {
      testResult = await testGeminiConnection(config.apiKey);
    } else {
      return {
        success: false,
        message: `Unknown provider: ${provider}`,
      };
    }

    // Update test status in database
    await prisma.aPIConfiguration.update({
      where: { provider },
      data: {
        testStatus: testResult.success ? 'success' : 'failed',
        testError: testResult.success ? null : testResult.message,
        lastTestedAt: new Date(),
      },
    });

    return testResult;
  } catch (error) {
    console.error(`Error testing ${provider} connection:`, error);
    return {
      success: false,
      message: `Error testing connection: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Test DeepL API connection
 */
async function testDeepLConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
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

    if (response.ok) {
      return {
        success: true,
        message: 'DeepL API connection successful',
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        message: `DeepL API error: ${response.status} - ${error}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `DeepL connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Test Gemini API connection
 */
async function testGeminiConnection(apiKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'test',
                },
              ],
            },
          ],
        }),
      }
    );

    if (response.ok) {
      return {
        success: true,
        message: 'Gemini API connection successful',
      };
    } else {
      const error = await response.text();
      return {
        success: false,
        message: `Gemini API error: ${response.status} - ${error}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Gemini connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
