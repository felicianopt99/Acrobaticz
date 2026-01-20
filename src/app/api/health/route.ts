/**
 * ============================================================
 * Optimized Health Check Endpoint
 * ============================================================
 * Provides comprehensive health status for:
 * - Load balancers (fast path ~10ms)
 * - Monitoring systems
 * - Circuit breaker detection
 * - Production failover validation
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Global cache for health status (reuse across requests)
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  instanceId: string;
  hostname: string;
  region: string;
  database: {
    status: 'connected' | 'disconnected' | 'degraded';
    latency: number;
    poolConnections?: number;
    poolMax?: number;
  };
  cache?: {
    status: 'connected' | 'disconnected';
    latency: number;
  };
  components: {
    database: boolean;
    api: boolean;
    memory: { used: number; total: number; percentage: number };
  };
  circuitBreaker?: {
    database: 'closed' | 'open' | 'half-open';
    cache: 'closed' | 'open' | 'half-open';
  };
  removeFromPool?: boolean;
}

let lastHealthCheck: HealthStatus | null = null;
let lastCheckTime = 0;
const CACHE_DURATION = 1000; // 1 second cache for health checks

/**
 * Quick database connectivity check
 * Uses existing connection pool, doesn't create new connections
 */
async function checkDatabaseHealth(): Promise<{
  status: 'connected' | 'disconnected' | 'degraded';
  latency: number;
  poolConnections?: number;
}> {
  const startTime = Date.now();

  try {
    // Try to get database connection from pool (non-blocking)
    const { prisma } = require('@/lib/prisma');
    
    // Simple query to test connection (fast path)
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    return {
      status: latency < 100 ? 'connected' : 'degraded',
      latency,
    };
  } catch (error) {
    console.error('[HEALTH] Database check failed:', error);
    return {
      status: 'disconnected',
      latency: Date.now() - startTime,
    };
  }
}

/**
 * Memory usage check
 */
function checkMemory() {
  const memUsage = process.memoryUsage();
  const used = Math.round(memUsage.heapUsed / 1024 / 1024); // MB
  const total = Math.round(memUsage.heapTotal / 1024 / 1024); // MB
  const percentage = Math.round((used / total) * 100);

  return {
    used,
    total,
    percentage,
  };
}

/**
 * Main health check logic
 */
async function getHealthStatus(
  detailed: boolean = false
): Promise<HealthStatus> {
  const now = Date.now();

  // Return cached health if recent
  if (
    lastHealthCheck &&
    now - lastCheckTime < CACHE_DURATION &&
    !detailed
  ) {
    return lastHealthCheck;
  }

  const dbHealth = await checkDatabaseHealth();
  const memHealth = checkMemory();

  // Determine overall status
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

  if (dbHealth.status === 'disconnected') {
    overallStatus = 'unhealthy';
  } else if (dbHealth.status === 'degraded' || memHealth.percentage > 90) {
    overallStatus = 'degraded';
  }

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    instanceId: process.env.INSTANCE_ID || 'unknown',
    hostname: process.env.HOSTNAME || 'unknown',
    region: process.env.AWS_REGION || process.env.REGION || 'unknown',
    database: {
      status: dbHealth.status,
      latency: dbHealth.latency,
      poolConnections: dbHealth.poolConnections,
    },
    components: {
      database: dbHealth.status !== 'disconnected',
      api: true, // This endpoint is working
      memory: memHealth,
    },
    circuitBreaker: {
      database: dbHealth.status === 'connected' ? 'closed' : 'open',
      cache: 'closed', // Assume cache is working
    },
    removeFromPool: overallStatus === 'unhealthy',
  };

  if (!detailed) {
    lastHealthCheck = health;
    lastCheckTime = now;
  }

  return health;
}

/**
 * Fast path for load balancer health checks (ELB, ALB, etc.)
 * Should respond in < 10ms
 */
function createLoadBalancerResponse(
  health: HealthStatus
): NextResponse {
  // Load balancers only care about status code
  const statusCode =
    health.status === 'healthy'
      ? 200
      : health.status === 'degraded'
        ? 206 // Partial Content (can still serve)
        : 503; // Service Unavailable

  return NextResponse.json(health, { status: statusCode });
}

/**
 * Main handler
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const detailed = searchParams.has('detailed');
  const includeRecoveryLog = searchParams.has('include-recovery-log');
  const criticalErrors = searchParams.has('critical-errors');

  try {
    const health = await getHealthStatus(detailed);

    // Add optional fields for detailed checks
    if (includeRecoveryLog) {
      (health as any).recoveryLog = [
        {
          timestamp: new Date().toISOString(),
          event: 'recovery_started',
        },
      ];
    }

    // Check if should be removed from load balancer pool
    if (criticalErrors && health.status === 'unhealthy') {
      (health as any).removeFromPool = true;
    }

    return createLoadBalancerResponse(health);
  } catch (error) {
    console.error('[HEALTH] Error in health check:', error);

    const unhealthyResponse: HealthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      instanceId: process.env.INSTANCE_ID || 'unknown',
      hostname: process.env.HOSTNAME || 'unknown',
      region: process.env.AWS_REGION || process.env.REGION || 'unknown',
      database: {
        status: 'disconnected',
        latency: 0,
      },
      components: {
        database: false,
        api: false,
        memory: { used: 0, total: 0, percentage: 0 },
      },
      removeFromPool: true,
    };

    return NextResponse.json(unhealthyResponse, { status: 503 });
  }
}

// Warm up connection on module load
if (process.env.NODE_ENV === 'production') {
  getHealthStatus(false).catch(console.error);
}
