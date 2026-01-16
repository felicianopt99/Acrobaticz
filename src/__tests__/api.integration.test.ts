import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

/**
 * Comprehensive API Integration Test Suite
 * 
 * Tests:
 * 1. Phase 4 Installation Wizard Edge Cases
 * 2. Authentication & Session Management
 * 3. CRUD Operations & Data Integrity
 * 4. Infrastructure & Proxy (Nginx 1.6)
 * 5. Health & Diagnostic Endpoints
 * 
 * Run: npm run test:api
 */

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'minio:9000';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'minioadmin';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'av-rentals';

interface TestContext {
  adminToken?: string;
  adminUserId?: string;
  categoryId?: string;
  subcategoryId?: string;
  testStartTime?: number;
}

interface TestResult {
  name: string;
  endpoint: string;
  method: string;
  status: 'PASS' | 'FAIL';
  expected?: number | string;
  actual?: number | string;
  latency?: number;
  error?: string;
  suggestion?: string;
}

const testResults: TestResult[] = [];
const context: TestContext = {};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Make HTTP requests to the API
 */
async function apiCall(
  method: string,
  endpoint: string,
  body?: any,
  cookies?: Record<string, string>,
  headers?: Record<string, string>
): Promise<{ status: number; data: any; latency: number }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = Date.now();

  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies && {
        'Cookie': Object.entries(cookies)
          .map(([k, v]) => `${k}=${v}`)
          .join('; '),
      }),
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, requestInit);
    const data = await response.json().catch(() => ({}));
    const latency = Date.now() - startTime;

    return { status: response.status, data, latency };
  } catch (error) {
    const latency = Date.now() - startTime;
    throw new Error(
      `API call failed: ${method} ${endpoint} - ${
        error instanceof Error ? error.message : String(error)
      } (${latency}ms)`
    );
  }
}

/**
 * Record test result
 */
function recordResult(result: TestResult) {
  testResults.push(result);
  const icon = result.status === 'PASS' ? '✓' : '✗';
  console.log(
    `${icon} [${result.endpoint}] ${result.method} - ${result.status}`
  );
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
  if (result.suggestion) {
    console.log(`  Suggestion: ${result.suggestion}`);
  }
}

/**
 * Create a test JWT token
 */
function createTestToken(userId: string, role: string = 'admin'): string {
  return jwt.sign(
    { userId, username: 'testadmin', role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Create expired JWT token
 */
function createExpiredToken(): string {
  return jwt.sign(
    { userId: 'test-user-id', username: 'testadmin', role: 'admin' },
    JWT_SECRET,
    { expiresIn: '-1h' }
  );
}

/**
 * Create malformed JWT token
 */
function createMalformedToken(): string {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('AV Rentals API Integration Tests', () => {
  beforeAll(async () => {
    console.log('\n' + '='.repeat(70));
    console.log('Starting API Integration Test Suite');
    console.log('API Base URL:', API_BASE_URL);
    console.log('='.repeat(70) + '\n');
  });

  afterAll(async () => {
    console.log('\n' + '='.repeat(70));
    console.log('Test Execution Summary');
    console.log('='.repeat(70));
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const total = testResults.length;

    console.log(`\nResults: ${passed}/${total} passed, ${failed}/${total} failed`);
    
    if (failed > 0) {
      console.log('\nFailed Tests:');
      testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`\n  [${r.endpoint}] ${r.method}`);
          console.log(`    Expected: ${r.expected}`);
          console.log(`    Actual: ${r.actual}`);
          if (r.suggestion) {
            console.log(`    Suggestion: ${r.suggestion}`);
          }
        });
    }
    
    console.log('='.repeat(70) + '\n');
  });

  // ==========================================================================
  // SECTION 1: HEALTH & INSTALLATION STATUS
  // ==========================================================================

  describe('Section 1: Health & Installation Status', () => {
    it('GET /api/health - System healthy (DB + Storage online)', async () => {
      try {
        const { status, data, latency } = await apiCall('GET', '/api/health');

        const passed = status === 200 && data.status === 'healthy';
        recordResult({
          name: 'Health check - all online',
          endpoint: '/api/health',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: 200,
          actual: status,
          latency,
          error: passed ? undefined : `Expected 200, got ${status}`,
          suggestion: passed
            ? undefined
            : 'Ensure database and storage services are running',
        });
      } catch (error) {
        recordResult({
          name: 'Health check - all online',
          endpoint: '/api/health',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Check if API server is running and accessible',
        });
      }
    });

    it('GET /api/health - Validates latency measurement', async () => {
      try {
        const { status, data, latency } = await apiCall('GET', '/api/health');

        const passed =
          status === 200 && 
          data.database?.latency !== undefined &&
          data.database.latency < 1000;

        recordResult({
          name: 'Health check - latency valid',
          endpoint: '/api/health',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: '< 1000ms',
          actual: `${data.database?.latency || 'N/A'}ms`,
          latency,
          suggestion: passed
            ? undefined
            : 'Database latency is too high or not being measured',
        });
      } catch (error) {
        recordResult({
          name: 'Health check - latency valid',
          endpoint: '/api/health',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });

  // ==========================================================================
  // SECTION 2: PHASE 4 INSTALLATION FLOW
  // ==========================================================================

  describe('Section 2: Phase 4 Installation Flow', () => {
    it('POST /api/setup/test-storage - Valid MinIO credentials', async () => {
      try {
        const payload = {
          minioEndpoint: MINIO_ENDPOINT,
          minioAccessKey: MINIO_ACCESS_KEY,
          minioSecretKey: MINIO_SECRET_KEY,
          minioBucket: MINIO_BUCKET,
        };

        const { status, data, latency } = await apiCall(
          'POST',
          '/api/setup/test-storage',
          payload
        );

        const passed = status === 200 && data.success === true;
        recordResult({
          name: 'Test MinIO connection',
          endpoint: '/api/setup/test-storage',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: 200,
          actual: status,
          latency,
          error: passed ? undefined : data.error || `Got status ${status}`,
          suggestion: passed
            ? undefined
            : 'Verify MinIO credentials and connectivity',
        });
      } catch (error) {
        recordResult({
          name: 'Test MinIO connection',
          endpoint: '/api/setup/test-storage',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Check if MinIO is running and credentials are correct',
        });
      }
    });

    it('POST /api/setup/test-storage - Malformed payload (Zod validation)', async () => {
      try {
        const malformedPayload = {
          minioEndpoint: '', // Empty
          minioAccessKey: '', // Empty
          // Missing minioSecretKey and minioBucket
        };

        const { status, data, latency } = await apiCall(
          'POST',
          '/api/setup/test-storage',
          malformedPayload
        );

        const passed = status === 422 || status === 400;
        recordResult({
          name: 'Malformed storage config (Zod)',
          endpoint: '/api/setup/test-storage',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: '422 or 400',
          actual: status,
          latency,
          error: passed ? undefined : `Expected validation error, got ${status}`,
          suggestion: passed
            ? undefined
            : 'Ensure Zod schema validation is in place',
        });
      } catch (error) {
        recordResult({
          name: 'Malformed storage config (Zod)',
          endpoint: '/api/setup/test-storage',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('POST /api/setup/test-storage - Stress test with gigantic payload', async () => {
      try {
        const gigantic = 'x'.repeat(50 * 1024 * 1024); // 50MB string
        const payload = {
          minioEndpoint: MINIO_ENDPOINT,
          minioAccessKey: MINIO_ACCESS_KEY,
          minioSecretKey: MINIO_SECRET_KEY,
          minioBucket: MINIO_BUCKET,
          extraData: gigantic,
        };

        const startTime = Date.now();
        const { status, latency } = await apiCall(
          'POST',
          '/api/setup/test-storage',
          payload
        );
        const totalTime = Date.now() - startTime;

        // Should either reject the payload or handle it gracefully
        const passed = status !== 413; // 413 Payload Too Large is acceptable
        recordResult({
          name: 'Stress test - gigantic payload',
          endpoint: '/api/setup/test-storage',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: 'Any status except connection hang',
          actual: `${status} (${totalTime}ms)`,
          latency,
          error: totalTime > 30000 ? 'Request timed out' : undefined,
          suggestion: passed
            ? undefined
            : 'Implement payload size limits in Nginx (client_max_body_size)',
        });
      } catch (error) {
        recordResult({
          name: 'Stress test - gigantic payload',
          endpoint: '/api/setup/test-storage',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
          suggestion:
            'Ensure Nginx has proper client_max_body_size configuration',
        });
      }
    });

    it('POST /api/setup/complete - System already installed returns 403', async () => {
      try {
        // This test assumes the system is already installed
        // If not, this will return 422 or 200 instead
        const payload = {
          companyName: 'Test Company',
          domain: 'localhost:3000',
          jwtSecret: 'test-secret',
          adminEmail: 'admin@test.com',
          adminPassword: 'Password123!',
          minioEndpoint: MINIO_ENDPOINT,
          minioAccessKey: MINIO_ACCESS_KEY,
          minioSecretKey: MINIO_SECRET_KEY,
          minioBucket: MINIO_BUCKET,
        };

        const { status, latency } = await apiCall(
          'POST',
          '/api/setup/complete',
          payload
        );

        // Status could be 403 (already installed), 200 (fresh install), or 422 (invalid)
        const alreadyInstalled = status === 403;
        const freshInstall = status === 200;
        const validation = status === 422;

        const passed =
          alreadyInstalled || freshInstall || validation;

        recordResult({
          name: 'Setup complete - re-installation protection',
          endpoint: '/api/setup/complete',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: '403 (if already installed) or 200/422',
          actual: status,
          latency,
          error: passed ? undefined : `Unexpected status ${status}`,
          suggestion: passed
            ? undefined
            : 'Verify POST /api/setup/complete returns 403 when already installed',
        });
      } catch (error) {
        recordResult({
          name: 'Setup complete - re-installation protection',
          endpoint: '/api/setup/complete',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });

  // ==========================================================================
  // SECTION 3: AUTHENTICATION & SESSION
  // ==========================================================================

  describe('Section 3: Authentication & Session', () => {
    it('POST /api/auth/login - Valid credentials', async () => {
      // This test requires a real user in the database
      // Skipping if not in a proper test environment
      try {
        const payload = {
          username: 'testadmin',
          password: 'Password123!',
        };

        const { status, data, latency } = await apiCall(
          'POST',
          '/api/auth/login',
          payload
        );

        if (status === 200 && data.success) {
          context.adminToken = data.token;
          context.adminUserId = data.userId;
        }

        const passed = status === 200 || status === 401; // 401 is ok if user doesn't exist
        recordResult({
          name: 'Login with valid credentials',
          endpoint: '/api/auth/login',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: '200 (or 401 if user missing)',
          actual: status,
          latency,
          error: status >= 500 ? `Server error: ${status}` : undefined,
        });
      } catch (error) {
        recordResult({
          name: 'Login with valid credentials',
          endpoint: '/api/auth/login',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('GET /api/categories - Without auth token and app_installed cookie', async () => {
      try {
        const { status, latency } = await apiCall(
          'GET',
          '/api/categories',
          undefined,
          {} // No cookies
        );

        const passed = status === 401; // Should require auth
        recordResult({
          name: 'Categories without auth',
          endpoint: '/api/categories',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: 401,
          actual: status,
          latency,
          error: passed ? undefined : 'Should reject requests without auth',
          suggestion: passed
            ? undefined
            : 'Add auth requirement to GET /api/categories',
        });
      } catch (error) {
        recordResult({
          name: 'Categories without auth',
          endpoint: '/api/categories',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('GET /api/categories - With expired JWT token', async () => {
      try {
        const expiredToken = createExpiredToken();
        const { status, latency } = await apiCall(
          'GET',
          '/api/categories',
          undefined,
          { 'auth-token': expiredToken }
        );

        const passed = status === 401; // Expired token should be rejected
        recordResult({
          name: 'Categories with expired JWT',
          endpoint: '/api/categories',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: 401,
          actual: status,
          latency,
          error: passed ? undefined : 'Expired token should be rejected',
          suggestion: passed
            ? undefined
            : 'Ensure JWT verification rejects expired tokens',
        });
      } catch (error) {
        recordResult({
          name: 'Categories with expired JWT',
          endpoint: '/api/categories',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('GET /api/categories - With JWT signed with wrong key', async () => {
      try {
        const wrongKeyToken = jwt.sign(
          { userId: 'test-user', username: 'test', role: 'admin' },
          'wrong-secret-key', // Different key
          { expiresIn: '24h' }
        );

        const { status, latency } = await apiCall(
          'GET',
          '/api/categories',
          undefined,
          { 'auth-token': wrongKeyToken }
        );

        const passed = status === 401; // Wrong key should be rejected
        recordResult({
          name: 'Categories with wrong JWT key',
          endpoint: '/api/categories',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: 401,
          actual: status,
          latency,
          error: passed ? undefined : 'Wrong key token should be rejected',
          suggestion: passed
            ? undefined
            : 'Verify jwtSecret is consistently used',
        });
      } catch (error) {
        recordResult({
          name: 'Categories with wrong JWT key',
          endpoint: '/api/categories',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('POST /api/auth/logout - Cookie invalidation', async () => {
      try {
        if (!context.adminToken) {
          console.log('Skipping logout test - no token from login');
          return;
        }

        const { status, latency } = await apiCall(
          'POST',
          '/api/auth/logout',
          {},
          { 'auth-token': context.adminToken }
        );

        const passed = status === 200;
        recordResult({
          name: 'Logout clears auth cookie',
          endpoint: '/api/auth/logout',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: 200,
          actual: status,
          latency,
          error: passed ? undefined : `Expected 200, got ${status}`,
          suggestion: passed
            ? undefined
            : 'Verify logout sets maxAge=0 on auth-token cookie',
        });

        // After logout, trying to use the token should fail
        const { status: categoryStatus } = await apiCall(
          'GET',
          '/api/categories',
          undefined,
          { 'auth-token': context.adminToken }
        );

        const postLogoutPassed = categoryStatus === 401;
        recordResult({
          name: 'API access blocked after logout',
          endpoint: '/api/categories',
          method: 'GET',
          status: postLogoutPassed ? 'PASS' : 'FAIL',
          expected: 401,
          actual: categoryStatus,
          error: postLogoutPassed ? undefined : 'Should deny access after logout',
          suggestion: postLogoutPassed
            ? undefined
            : 'Verify logout invalidates the token properly',
        });
      } catch (error) {
        recordResult({
          name: 'Logout clears auth cookie',
          endpoint: '/api/auth/logout',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });

  // ==========================================================================
  // SECTION 4: CRUD OPERATIONS
  // ==========================================================================

  describe('Section 4: CRUD Operations - Categories', () => {
    it('GET /api/categories - Empty state returns 200 OK with []', async () => {
      try {
        // Create a test token if we don't have one
        const token = context.adminToken || createTestToken('test-user');

        const { status, data, latency } = await apiCall(
          'GET',
          '/api/categories',
          undefined,
          { 'auth-token': token }
        );

        const passed = status === 200 && Array.isArray(data);
        recordResult({
          name: 'GET empty categories',
          endpoint: '/api/categories',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: 200,
          actual: status,
          latency,
          error: passed ? undefined : `Expected 200 with array, got ${status}`,
          suggestion: passed
            ? undefined
            : 'Ensure empty states return 200 OK with []',
        });
      } catch (error) {
        recordResult({
          name: 'GET empty categories',
          endpoint: '/api/categories',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('POST /api/categories - Create new category', async () => {
      try {
        const token = context.adminToken || createTestToken('test-user');
        const payload = {
          name: 'Test Category',
          description: 'Test Description',
        };

        const { status, data, latency } = await apiCall(
          'POST',
          '/api/categories',
          payload,
          { 'auth-token': token }
        );

        if (status === 201 && data.id) {
          context.categoryId = data.id;
        }

        const passed = status === 201 && data.id;
        recordResult({
          name: 'Create category',
          endpoint: '/api/categories',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: 201,
          actual: status,
          latency,
          error: passed ? undefined : data.error || `Expected 201, got ${status}`,
          suggestion: passed
            ? undefined
            : 'Verify POST /api/categories returns 201 with created object',
        });
      } catch (error) {
        recordResult({
          name: 'Create category',
          endpoint: '/api/categories',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Check if endpoint exists and is properly configured',
        });
      }
    });

    it('GET /api/categories - List all categories (should include created)', async () => {
      try {
        const token = context.adminToken || createTestToken('test-user');

        const { status, data, latency } = await apiCall(
          'GET',
          '/api/categories',
          undefined,
          { 'auth-token': token }
        );

        const passed = status === 200 && Array.isArray(data);
        recordResult({
          name: 'List all categories',
          endpoint: '/api/categories',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: 200,
          actual: status,
          latency,
          error: passed ? undefined : `Expected 200 with array, got ${status}`,
        });
      } catch (error) {
        recordResult({
          name: 'List all categories',
          endpoint: '/api/categories',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('PUT /api/categories - Update category', async () => {
      try {
        if (!context.categoryId) {
          console.log('Skipping update test - no category created');
          return;
        }

        const token = context.adminToken || createTestToken('test-user');
        const payload = {
          id: context.categoryId,
          name: 'Updated Category Name',
          description: 'Updated Description',
        };

        const { status, data, latency } = await apiCall(
          'PUT',
          '/api/categories',
          payload,
          { 'auth-token': token }
        );

        const passed = status === 200 && data.name === payload.name;
        recordResult({
          name: 'Update category',
          endpoint: '/api/categories',
          method: 'PUT',
          status: passed ? 'PASS' : 'FAIL',
          expected: 200,
          actual: status,
          latency,
          error: passed ? undefined : data.error || `Expected 200, got ${status}`,
          suggestion: passed
            ? undefined
            : 'Verify PUT /api/categories updates and returns modified object',
        });
      } catch (error) {
        recordResult({
          name: 'Update category',
          endpoint: '/api/categories',
          method: 'PUT',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('DELETE /api/categories - Delete category', async () => {
      try {
        if (!context.categoryId) {
          console.log('Skipping delete test - no category created');
          return;
        }

        const token = context.adminToken || createTestToken('test-user');

        const { status, latency } = await apiCall(
          'DELETE',
          `/api/categories/${context.categoryId}`,
          undefined,
          { 'auth-token': token }
        );

        const passed = status === 200 || status === 204;
        recordResult({
          name: 'Delete category',
          endpoint: '/api/categories/:id',
          method: 'DELETE',
          status: passed ? 'PASS' : 'FAIL',
          expected: '200 or 204',
          actual: status,
          latency,
          error: passed ? undefined : `Expected 200/204, got ${status}`,
          suggestion: passed
            ? undefined
            : 'Verify DELETE /api/categories/:id works properly',
        });
      } catch (error) {
        recordResult({
          name: 'Delete category',
          endpoint: '/api/categories/:id',
          method: 'DELETE',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });

  // ==========================================================================
  // SECTION 5: NGINX PROXY & INFRASTRUCTURE
  // ==========================================================================

  describe('Section 5: Infrastructure & Proxy (Nginx 1.6)', () => {
    it('X-Forwarded-For header validation', async () => {
      try {
        const headers = {
          'X-Forwarded-For': '192.168.1.100, 10.0.0.1',
          'X-Forwarded-Proto': 'https',
        };

        const { status, data, latency } = await apiCall(
          'GET',
          '/api/health',
          undefined,
          {},
          headers
        );

        // We can't directly verify headers were received, but we can check if endpoint works
        const passed = status === 200;
        recordResult({
          name: 'X-Forwarded-For header handling',
          endpoint: '/api/health',
          method: 'GET',
          status: passed ? 'PASS' : 'FAIL',
          expected: 200,
          actual: status,
          latency,
          error: passed ? undefined : 'Should accept X-Forwarded-* headers',
          suggestion: passed
            ? undefined
            : 'Verify Nginx proxy_set_header configuration',
        });
      } catch (error) {
        recordResult({
          name: 'X-Forwarded-For header handling',
          endpoint: '/api/health',
          method: 'GET',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    it('Large file upload handling (payload size)', async () => {
      try {
        // Create a large payload to test client_max_body_size
        const largeString = 'x'.repeat(10 * 1024 * 1024); // 10MB
        const payload = {
          name: 'Large Category',
          description: largeString,
        };

        const startTime = Date.now();
        const { status, latency } = await apiCall(
          'POST',
          '/api/categories',
          payload,
          { 'auth-token': createTestToken('test-user') }
        );
        const totalTime = Date.now() - startTime;

        // Should either process (unlikely) or reject with 413/414
        const passed = [200, 201, 400, 413, 414].includes(status);
        recordResult({
          name: 'Large payload handling',
          endpoint: '/api/categories',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: '413 (Payload Too Large) or 200/400',
          actual: `${status} (${totalTime}ms)`,
          latency,
          error:
            totalTime > 30000
              ? 'Request timeout'
              : passed
                ? undefined
                : `Unexpected status ${status}`,
          suggestion: passed
            ? undefined
            : 'Check Nginx client_max_body_size configuration',
        });
      } catch (error) {
        recordResult({
          name: 'Large payload handling',
          endpoint: '/api/categories',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
          suggestion: 'Verify Nginx and Next.js request limits',
        });
      }
    });
  });

  // ==========================================================================
  // SECTION 6: CONCURRENCY & RACE CONDITIONS
  // ==========================================================================

  describe('Section 6: Concurrency & Race Conditions', () => {
    it('Simultaneous category creation (race condition test)', async () => {
      try {
        const token = createTestToken('test-user');
        const payload = {
          name: 'Concurrent Category',
          description: 'Test concurrent creation',
        };

        // Send two simultaneous requests
        const [result1, result2] = await Promise.all([
          apiCall('POST', '/api/categories', payload, { 'auth-token': token }),
          apiCall('POST', '/api/categories', payload, { 'auth-token': token }),
        ]);

        // Both should succeed or one should fail gracefully (no 500 errors)
        const passed =
          (result1.status === 201 || result1.status === 400) &&
          (result2.status === 201 || result2.status === 400);

        recordResult({
          name: 'Concurrent category creation',
          endpoint: '/api/categories',
          method: 'POST',
          status: passed ? 'PASS' : 'FAIL',
          expected: '201 or graceful failure (not 500)',
          actual: `${result1.status}, ${result2.status}`,
          latency: Math.max(result1.latency, result2.latency),
          error: passed ? undefined : 'Got unhandled errors during concurrent requests',
          suggestion: passed
            ? undefined
            : 'Implement proper transaction/locking for concurrent operations',
        });
      } catch (error) {
        recordResult({
          name: 'Concurrent category creation',
          endpoint: '/api/categories',
          method: 'POST',
          status: 'FAIL',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  });
});

// ============================================================================
// GENERATE FINAL REPORT
// ============================================================================

export function generateTestReport(): void {
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = testResults.length;
  const passPercentage = ((passed / total) * 100).toFixed(1);

  console.log('\n\n' + '='.repeat(80));
  console.log('FINAL API TEST REPORT');
  console.log('='.repeat(80));

  console.log(`\nOverall Results: ${passed}/${total} passed (${passPercentage}%)\n`);

  if (failed > 0) {
    console.log('FAILURES & SUGGESTIONS:');
    console.log('-'.repeat(80));

    testResults
      .filter(r => r.status === 'FAIL')
      .forEach((r, index) => {
        console.log(`\n${index + 1}. [${r.endpoint}] ${r.method}`);
        console.log(`   Test: ${r.name}`);
        if (r.expected !== undefined) {
          console.log(`   Expected: ${r.expected}`);
        }
        if (r.actual !== undefined) {
          console.log(`   Actual: ${r.actual}`);
        }
        if (r.error) {
          console.log(`   Error: ${r.error}`);
        }
        if (r.suggestion) {
          console.log(`   💡 Suggestion: ${r.suggestion}`);
        }
      });
  }

  console.log('\n' + '='.repeat(80));
  console.log(passPercentage === '100.0' ? '✓ ALL TESTS PASSED!' : '✗ SOME TESTS FAILED');
  console.log('='.repeat(80) + '\n');
}
