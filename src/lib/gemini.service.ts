/**
 * Gemini AI Service
 * Service for managing interactions with Google's Gemini API
 * Supports content generation, analysis, and other AI tasks
 */

import { prisma } from '@/lib/db';
import { configService } from '@/lib/config-service';
import { getAPIKey } from '@/app/api/actions/api-configuration.actions';
import type { ApiResponse, ServerActionResult } from '@/types/translation.types';

// Constants
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;
const MAX_CONCURRENCY = 4;

// State management
let cachedGeminiApiKey: string | null = null;
let cacheExpiry: number = 0;
let inflight = 0;
const waitQueue: Array<() => void> = [];

/**
 * Get Gemini API key from database or config service with caching
 */
async function getGeminiApiKey(): Promise<string | null> {
  const now = Date.now();
  
  // Use cache if still valid (5 minute TTL)
  if (cachedGeminiApiKey && cacheExpiry > now) {
    return cachedGeminiApiKey;
  }

  try {
    // Try to get from database first
    cachedGeminiApiKey = await getAPIKey('gemini');
    
    // Fall back to config service if not in database
    if (!cachedGeminiApiKey) {
      cachedGeminiApiKey = await configService.get('Gemini', 'GEMINI_API_KEY');
    }
    
    // Set cache expiry to 5 minutes from now
    cacheExpiry = now + (5 * 60 * 1000);
    
    if (!cachedGeminiApiKey) {
      console.warn('No Gemini API key found in database or config');
    }
  } catch (error) {
    console.error('Failed to retrieve Gemini API key:', error);
    return null;
  }
  
  return cachedGeminiApiKey;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff with jitter
 */
function calcBackoffDelay(attempt: number): number {
  const expo = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 250);
  return expo + jitter;
}

/**
 * Concurrency limiter (semaphore)
 */
async function withConcurrency<T>(fn: () => Promise<T>): Promise<T> {
  if (inflight >= MAX_CONCURRENCY) {
    await new Promise<void>(resolve => waitQueue.push(resolve));
  }
  inflight++;
  try {
    return await fn();
  } finally {
    inflight--;
    const next = waitQueue.shift();
    if (next) next();
  }
}

/**
 * Interface for Gemini request
 */
export interface GeminiGenerateRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

/**
 * Interface for Gemini response
 */
export interface GeminiGenerateResponse {
  content: string;
  finishReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * Generate content using Gemini API with retry logic
 */
export async function generateContent(
  request: GeminiGenerateRequest
): Promise<ApiResponse<GeminiGenerateResponse>> {
  return withConcurrency(async () => {
    const apiKey = await getGeminiApiKey();
    
    if (!apiKey) {
      return {
        status: 'error',
        message: 'Gemini API key not configured',
        timestamp: new Date().toISOString(),
      };
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: request.prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: request.maxTokens || 1024,
              temperature: request.temperature || 0.7,
              topP: request.topP || 0.95,
              topK: request.topK || 40,
            },
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('No content in Gemini response');
        }

        const content = data.candidates[0].content.parts[0].text;
        const usage = data.usageMetadata;

        return {
          status: 'success',
          data: {
            content,
            finishReason: data.candidates[0].finishReason,
            usage: usage ? {
              inputTokens: usage.promptTokenCount || 0,
              outputTokens: usage.candidatesTokenCount || 0,
            } : undefined,
          },
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < MAX_RETRIES - 1) {
          const delay = calcBackoffDelay(attempt);
          await sleep(delay);
        }
      }
    }

    return {
      status: 'error',
      message: lastError?.message || 'Failed to generate content with Gemini',
      timestamp: new Date().toISOString(),
    };
  });
}

/**
 * Analyze text using Gemini
 */
export async function analyzeText(
  text: string,
  analysisType: 'sentiment' | 'summary' | 'keywords' | 'custom',
  customPrompt?: string
): Promise<ApiResponse<{ analysis: string }>> {
  let prompt = '';

  switch (analysisType) {
    case 'sentiment':
      prompt = `Analyze the sentiment of the following text and provide a brief analysis:\n\n${text}`;
      break;
    case 'summary':
      prompt = `Provide a concise summary of the following text:\n\n${text}`;
      break;
    case 'keywords':
      prompt = `Extract the top 10 keywords from the following text:\n\n${text}`;
      break;
    case 'custom':
      if (!customPrompt) {
        return {
          status: 'error',
          message: 'Custom prompt required for custom analysis',
          timestamp: new Date().toISOString(),
        };
      }
      prompt = customPrompt.replace('[TEXT]', text);
      break;
  }

  const response = await generateContent({ prompt });
  
  if (response.status === 'success' && response.data) {
    return {
      status: 'success',
      data: { analysis: response.data.content },
      timestamp: new Date().toISOString(),
    };
  }

  return {
    status: 'error',
    message: response.message || 'Analysis failed',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Clear cached API key (useful when configuration changes)
 */
export function clearApiKeyCache(): void {
  cachedGeminiApiKey = null;
  cacheExpiry = 0;
}
