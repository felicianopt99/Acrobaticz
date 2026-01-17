/**
 * DeepL API Rate Limiter & Batch Manager
 * Implements intelligent request batching and rate limiting for translation API
 * 
 * Features:
 * - Rate limiting (max X requests/second)
 * - Intelligent batching with 300ms buffer
 * - Exponential backoff for 429 errors
 * - Request queue management
 */

// Configuration
export const RATE_LIMITER_CONFIG = {
  maxRequestsPerSecond: 10, // DeepL free tier: safe value
  batchBufferMs: 300, // Accumulate texts for 300ms before sending
  maxTextsPerRequest: 50, // DeepL max texts per request
  maxCharactersPerRequest: 50000, // DeepL max characters per request
  retryDelayMs: 1000, // Base delay for exponential backoff
  maxRetries: 3,
};

interface BatchedRequest {
  texts: string[];
  timestamp: number;
}

interface RateLimiterState {
  requestCount: number;
  windowStart: number;
  queue: Array<() => Promise<any>>;
  isProcessing: boolean;
  batchBuffer: BatchedRequest;
  batchTimer: NodeJS.Timeout | null;
}

/**
 * DeepL Rate Limiter - Controls API request rate and batching
 */
export class DeepLRateLimiter {
  private state: RateLimiterState = {
    requestCount: 0,
    windowStart: Date.now(),
    queue: [],
    isProcessing: false,
    batchBuffer: {
      texts: [],
      timestamp: Date.now(),
    },
    batchTimer: null,
  };

  /**
   * Check if we're within rate limit
   */
  private isWithinRateLimit(): boolean {
    const now = Date.now();
    const windowAge = now - this.state.windowStart;

    // Reset window if older than 1 second
    if (windowAge > 1000) {
      this.state.requestCount = 0;
      this.state.windowStart = now;
    }

    return this.state.requestCount < RATE_LIMITER_CONFIG.maxRequestsPerSecond;
  }

  /**
   * Wait until we're within rate limit
   */
  private async waitForRateLimit(): Promise<void> {
    while (!this.isWithinRateLimit()) {
      const now = Date.now();
      const windowAge = now - this.state.windowStart;
      const waitTime = 1000 - windowAge + 10; // Small buffer
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Add texts to batch buffer
   */
  public addToBatch(texts: string[]): Promise<Map<string, string>> {
    return new Promise((resolve, reject) => {
      this.state.batchBuffer.texts.push(...texts);

      // Clear existing timer
      if (this.state.batchTimer) {
        clearTimeout(this.state.batchTimer);
      }

      // Set new timer to process batch
      this.state.batchTimer = setTimeout(async () => {
        try {
          const results = await this.processBatch();
          resolve(results);
        } catch (error) {
          reject(error);
        }
      }, RATE_LIMITER_CONFIG.batchBufferMs);
    });
  }

  /**
   * Process accumulated batch
   */
  private async processBatch(): Promise<Map<string, string>> {
    if (this.state.batchBuffer.texts.length === 0) {
      return new Map();
    }

    const textsToProcess = [...this.state.batchBuffer.texts];
    this.state.batchBuffer.texts = [];

    // Wait for rate limit
    await this.waitForRateLimit();

    // Split into sub-batches if needed
    const subBatches = this.splitIntoBatches(textsToProcess);
    const results = new Map<string, string>();

    for (const batch of subBatches) {
      // Simulate translation (in real code, this would call DeepL API)
      for (const text of batch) {
        results.set(text, text); // Placeholder
      }
      this.state.requestCount++;
    }

    return results;
  }

  /**
   * Split texts into batches respecting DeepL limits
   */
  private splitIntoBatches(texts: string[]): string[][] {
    const batches: string[][] = [];
    let currentBatch: string[] = [];
    let currentChars = 0;

    for (const text of texts) {
      const textLength = text.length;

      // Check if adding this text would exceed limits
      if (
        currentBatch.length >= RATE_LIMITER_CONFIG.maxTextsPerRequest ||
        currentChars + textLength > RATE_LIMITER_CONFIG.maxCharactersPerRequest
      ) {
        // Save current batch and start new one
        if (currentBatch.length > 0) {
          batches.push(currentBatch);
          currentBatch = [];
          currentChars = 0;
        }
      }

      currentBatch.push(text);
      currentChars += textLength;
    }

    // Add remaining batch
    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    return batches;
  }

  /**
   * Execute with exponential backoff for 429 errors
   */
  public async executeWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      // Wait for rate limit before executing
      await this.waitForRateLimit();
      this.state.requestCount++;

      return await fn();
    } catch (error: any) {
      // If 429 (Too Many Requests), backoff and retry
      if (error.status === 429 && attempt <= RATE_LIMITER_CONFIG.maxRetries) {
        const backoffTime =
          RATE_LIMITER_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);

        console.warn(
          `Rate limited (429). Retrying in ${backoffTime}ms (attempt ${attempt}/${RATE_LIMITER_CONFIG.maxRetries})`
        );

        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.executeWithBackoff(fn, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Get current limiter status
   */
  public getStatus() {
    return {
      requestsThisSecond: this.state.requestCount,
      maxRequestsPerSecond: RATE_LIMITER_CONFIG.maxRequestsPerSecond,
      bufferSize: this.state.batchBuffer.texts.length,
      queueLength: this.state.queue.length,
      isProcessing: this.state.isProcessing,
    };
  }

  /**
   * Reset limiter
   */
  public reset(): void {
    this.state.requestCount = 0;
    this.state.windowStart = Date.now();
    this.state.queue = [];
    this.state.isProcessing = false;
    this.state.batchBuffer.texts = [];

    if (this.state.batchTimer) {
      clearTimeout(this.state.batchTimer);
      this.state.batchTimer = null;
    }
  }
}

// Global instance
export const rateLimiter = new DeepLRateLimiter();

/**
 * Translate texts with automatic rate limiting and batching
 */
export async function translateWithRateLimit(
  texts: string[],
  translateFn: (texts: string[]) => Promise<Map<string, string>>
): Promise<Map<string, string>> {
  return rateLimiter.executeWithBackoff(() => translateFn(texts));
}
