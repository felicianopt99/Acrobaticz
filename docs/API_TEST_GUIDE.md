# API Integration Test Suite - Complete Guide

## Overview

This document describes the comprehensive API integration test suite for AV Rentals Phase 4. The test suite covers:

- **Installation Flow**: Phase 4 setup edge cases and stress testing
- **Authentication & Sessions**: Token validation, expiration, bypass attempts
- **CRUD Operations**: Complete data management workflows with concurrency tests
- **Infrastructure**: Nginx proxy behavior, headers, payload sizes
- **Health & Diagnostics**: System status monitoring

## Quick Start

### Run All API Tests

```bash
npm run test:api
```

### Run Tests in Watch Mode

```bash
npm run test:api:watch
```

### Run All Tests

```bash
npm run test:run
```

### Prerequisites

1. **Development Server Running**:
   ```bash
   npm run dev
   ```
   The tests expect the API to be available at `http://localhost:3000`

2. **Database Connection**:
   - PostgreSQL must be running
   - Prisma migrations must be applied: `npm run db:migrate`

3. **MinIO/S3 Storage** (for storage tests):
   - MinIO should be running on `minio:9000` (or configure via env vars)
   - Default credentials: `minioadmin:minioadmin`

## Test Sections

### Section 1: Health & Installation Status

Tests the `/api/health` endpoint under different conditions:

| Test | Endpoint | Purpose |
|------|----------|---------|
| System healthy | `GET /api/health` | Verify DB and storage connectivity |
| Latency measurement | `GET /api/health` | Validate response time reporting |

**Expected Results**:
- ✓ Status 200
- ✓ Includes database latency measurement
- ✓ Response time < 1000ms

**Common Issues & Fixes**:
```
FAIL: Status 503 (Service Unavailable)
→ Fix: Ensure PostgreSQL is running
→ Check: DATABASE_URL in .env

FAIL: Latency showing undefined
→ Fix: Update health endpoint to measure database query time
→ Reference: src/app/api/health/route.ts
```

---

### Section 2: Phase 4 Installation Flow

Tests the setup wizard endpoints with focus on edge cases:

#### 2.1 MinIO Storage Test

```bash
POST /api/setup/test-storage
{
  "minioEndpoint": "minio:9000",
  "minioAccessKey": "minioadmin",
  "minioSecretKey": "minioadmin",
  "minioBucket": "av-rentals"
}
```

**Expected Results**:
- ✓ Status 200 with `success: true`
- ✓ Response includes latency measurement

**Common Issues & Fixes**:
```
FAIL: Status 422 (Unprocessable Entity)
→ Fix: Verify payload matches schema requirements
→ Suggestion: Check Zod schema validation in src/lib/schemas/install.schema.ts

FAIL: Timeout (> 30s)
→ Fix: Check MinIO connectivity
→ Verify: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY in env
```

#### 2.2 Stress Test: Gigantic Payload

Tests API robustness with 50MB payloads:

**Expected Results**:
- ✓ Server rejects gracefully (413 or 400)
- ✓ No connection hangs
- ✓ Response time < 30 seconds

**Common Issues & Fixes**:
```
FAIL: Request timeout or 500 error
→ Fix: Configure Nginx client_max_body_size
→ Location: nginx/app.conf.template
→ Suggestion: Set to 50MB minimum
   client_max_body_size 50M;
```

#### 2.3 Re-installation Protection

```bash
POST /api/setup/complete
```

**Expected Results**:
- ✓ Status 403 if already installed
- ✓ Status 200 if fresh install
- ✓ Status 422 if invalid data

**Common Issues & Fixes**:
```
FAIL: Status 200 when should be 403
→ Explanation: System wasn't detected as already installed
→ Check: Cookie 'app_installed' is set after completion
→ Verify: POST /api/setup/complete sets app_installed=true

FAIL: Status 500
→ Fix: Review error logs for validation/database errors
→ Debug: Check InstallationCompleteSchema in src/lib/schemas/
```

---

### Section 3: Authentication & Session Management

#### 3.1 JWT Token Validation

Tests JWT handling with various token states:

| Test | Token State | Expected |
|------|------------|----------|
| Valid token | Fresh, correct key | 200 ✓ |
| Expired token | Past expiresIn | 401 ✓ |
| Wrong key | Signed with different secret | 401 ✓ |
| Missing token | No auth-token cookie | 401 ✓ |

**Request Example**:
```bash
curl -H "Cookie: auth-token=eyJhbGc..." http://localhost:3000/api/categories
```

**Common Issues & Fixes**:
```
FAIL: Expired token returns 200 instead of 401
→ Fix: Add expiration check in JWT verification
→ Code: jwt.verify(token, jwtSecret) throws on expiration
→ Ensure: try-catch block properly catches verification errors

FAIL: Token with wrong key still works
→ Fix: Verify JWT_SECRET is consistent
→ Check: Is configService returning the same secret?
→ Debug: Log jwt.verify errors to diagnose

FAIL: 401 returns HTML error page instead of JSON
→ Fix: Set proper Content-Type headers
→ Response should be JSON with status 401
```

#### 3.2 Logout & Cookie Invalidation

```bash
POST /api/auth/logout
```

**Expected Behavior**:
1. Logout returns 200 OK
2. Cookie is cleared (`maxAge: 0`)
3. Subsequent API calls return 401

**Common Issues & Fixes**:
```
FAIL: After logout, API still accepts requests
→ Fix: Verify logout sets maxAge=0 on auth-token
→ Code Location: src/app/api/auth/logout/route.ts
→ Verify: response.cookies.set('auth-token', '', { maxAge: 0 })

FAIL: Logout response is not cached, causes race conditions
→ Fix: Ensure token validation happens server-side every request
→ Don't rely on client-side token deletion
```

---

### Section 4: CRUD Operations - Categories

Tests complete data management lifecycle:

#### 4.1 Empty State
```bash
GET /api/categories
```
- ✓ Returns 200 OK with `[]`
- ✗ Do NOT return 500 "No data"

#### 4.2 Create
```bash
POST /api/categories
{ "name": "Test", "description": "..." }
```
- ✓ Returns 201 Created with `id`

#### 4.3 Read
```bash
GET /api/categories
```
- ✓ Returns 200 with array including created item

#### 4.4 Update
```bash
PUT /api/categories
{ "id": "...", "name": "Updated" }
```
- ✓ Returns 200 with updated object

#### 4.5 Delete
```bash
DELETE /api/categories/:id
```
- ✓ Returns 200 or 204 No Content
- ✓ Verify deletion is immediate (check with GET)

**Common Issues & Fixes**:
```
FAIL: Empty GET returns 500
→ Fix: Handle empty result sets
→ Code: return NextResponse.json([]) not NextResponse.json(null)

FAIL: POST returns 500 "Unique constraint violation"
→ Explanation: Category with same name already exists
→ Fix: Add unique constraint handling or allow duplicates

FAIL: DELETE returns 200 but item still exists
→ Check: Is transaction committed?
→ Verify: await prisma.category.delete() completes

FAIL: Cascade delete not working
→ Check: Prisma schema has onDelete: Cascade
→ Or manually delete subcategories first
```

---

### Section 5: Concurrency & Race Conditions

Tests simultaneous requests:

#### 5.1 Duplicate Category Creation

Two simultaneous POST requests with identical payload:

```bash
POST /api/categories (Request 1)
POST /api/categories (Request 2)  # Same time
```

**Expected Results**:
- ✓ Both succeed (2x 201) - OK if duplicates allowed
- ✓ One succeeds, one fails (201 + 400) - OK if unique constraint
- ✗ One returns 500 - FAIL, race condition

**Common Issues & Fixes**:
```
FAIL: Intermittent 500 errors on concurrent requests
→ Root Cause: Race condition in transaction
→ Fix: Use database-level locking or Prisma $transaction

Solution 1: Use Prisma transaction:
const result = await prisma.$transaction(async (tx) => {
  // Check if exists
  const exists = await tx.category.findFirst({...})
  if (exists) throw new Error('Already exists')
  // Create
  return tx.category.create({...})
})

Solution 2: Add UNIQUE constraint in database:
ALTER TABLE Category ADD CONSTRAINT unique_name UNIQUE(name);

Solution 3: Use optimistic locking:
- Add version field
- Check version before update
- Retry on mismatch
```

---

### Section 6: Infrastructure & Proxy (Nginx 1.6)

#### 6.1 X-Forwarded Headers

Tests that reverse proxy headers are properly handled:

```bash
curl -H "X-Forwarded-For: 192.168.1.100" \
     -H "X-Forwarded-Proto: https" \
     http://localhost:3000/api/health
```

**Expected**:
- ✓ Returns 200
- ✓ Logs can track client IP from X-Forwarded-For
- ✓ Protocol correctly detected from X-Forwarded-Proto

**Nginx Configuration**:
```nginx
location ~ ^/api/ {
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  proxy_set_header Host $host;
  proxy_pass http://app:3000;
}
```

#### 6.2 Large Payload Handling

Tests 10MB payload upload:

```bash
POST /api/categories
{ "name": "X" * 10MB }
```

**Expected Results**:
- ✓ Returns 413 Payload Too Large (graceful rejection)
- ✓ Server doesn't hang or crash
- ✓ Response time < 5 seconds

**Nginx Configuration**:
```nginx
# In nginx/app.conf.template
http {
  client_max_body_size 100M;  # Adjust based on needs
  proxy_buffering off;         # For streaming
  proxy_request_buffering off; # For uploads
}
```

**Common Issues & Fixes**:
```
FAIL: 500 error on large uploads
→ Fix 1: Check Nginx client_max_body_size
→ Fix 2: Check Next.js request body size limits
→ Fix 3: Increase proxy_buffer_size in Nginx

FAIL: Request timeout (> 60s)
→ Configuration: nginx has 60s timeout by default
→ Fix: proxy_connect_timeout 90;
→       proxy_send_timeout 90;
→       proxy_read_timeout 90;

FAIL: Connection reset by peer
→ Cause: Buffer overflow in Nginx
→ Fix: Increase proxy_buffer_size and proxy_buffers
```

---

### Section 7: Health Checks under Various Conditions

The test suite can be extended to test health checks with services offline:

```bash
# Database Online, Storage Offline
GET /api/health → 200, status: "degraded"

# Database Offline
GET /api/health → 503, error: "Database connection failed"

# Both Offline
GET /api/health → 503
```

**Health Endpoint Response Structure**:
```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-15T...",
  "installation": {
    "installed": true,
    "completedAt": "2024-01-01T..."
  },
  "database": {
    "connected": true,
    "latency": 12,
    "error": null
  },
  "storage": {
    "configured": true,
    "type": "minio",
    "error": null
  }
}
```

---

## Environment Variables for Testing

Create or update `.env.local`:

```env
# API Testing
API_BASE_URL=http://localhost:3000
JWT_SECRET=your-test-secret-key

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/av_rentals

# Storage
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=av-rentals

# Node environment
NODE_ENV=test
```

---

## Test Report Output

### Sample Passing Report

```
========================================================================
FINAL API TEST REPORT
========================================================================

Overall Results: 24/24 passed (100.0%)

========================================================================
✓ ALL TESTS PASSED!
========================================================================
```

### Sample Failing Report

```
========================================================================
FINAL API TEST REPORT
========================================================================

Overall Results: 20/24 passed (83.3%)

FAILURES & SUGGESTIONS:
------------------------------------------------------------------------

1. [/api/categories] GET
   Test: Categories without auth
   Expected: 401
   Actual: 200
   Error: Should reject requests without auth
   💡 Suggestion: Add auth requirement to GET /api/categories

2. [/api/setup/test-storage] POST
   Test: Stress test - gigantic payload
   Expected: 413 (Payload Too Large) or 200/400
   Actual: 500 (45234ms)
   Error: Request timed out
   💡 Suggestion: Check Nginx client_max_body_size configuration

... [additional failures]

========================================================================
✗ SOME TESTS FAILED
========================================================================
```

---

## Running Tests in CI/CD Pipeline

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      minio:
        image: minio/minio
        env:
          MINIO_ROOT_USER: minioadmin
          MINIO_ROOT_PASSWORD: minioadmin
    
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run db:migrate
      - run: npm run dev &
      - run: sleep 5  # Wait for server
      - run: npm run test:api
```

---

## Extending the Test Suite

### Adding New Test Cases

1. **Create a new `describe` block**:
```typescript
describe('Section 8: My New Feature', () => {
  it('should do something', async () => {
    const { status, data, latency } = await apiCall(
      'GET',
      '/api/my-endpoint'
    );
    
    recordResult({
      name: 'My test name',
      endpoint: '/api/my-endpoint',
      method: 'GET',
      status: status === 200 ? 'PASS' : 'FAIL',
      expected: 200,
      actual: status,
      latency,
      error: status === 200 ? undefined : `Got ${status}`,
      suggestion: 'How to fix if fails'
    });
  });
});
```

2. **Add to Section comment** at the top of each suite

3. **Run the tests**:
```bash
npm run test:api
```

---

## Troubleshooting

### "API server is not running"

```bash
# Terminal 1: Start the development server
npm run dev

# Terminal 2: Run the tests
npm run test:api
```

### "Database connection failed"

```bash
# Check migrations are applied
npm run db:migrate

# Check DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

### "MinIO connection refused"

```bash
# Check MinIO is running (if using docker-compose)
docker-compose ps

# If not running, start it
docker-compose up -d minio

# Verify credentials
aws s3 ls --endpoint-url http://minio:9000 \
  --access-key minioadmin \
  --secret-key minioadmin
```

### "JWT_SECRET mismatch"

```bash
# Ensure JWT_SECRET is set in .env.local
echo "JWT_SECRET=your-secret" >> .env.local

# Verify it's being used
grep JWT_SECRET .env.local

# Check it matches in config service
npm run db:push  # Ensure SystemSetting table is created
```

---

## Performance Baselines

Target latencies for healthy system:

| Endpoint | Operation | Target | Alert |
|----------|-----------|--------|-------|
| `/api/health` | GET | < 50ms | > 200ms |
| `/api/categories` | GET | < 100ms | > 500ms |
| `/api/categories` | POST | < 200ms | > 1000ms |
| `/api/setup/test-storage` | POST | < 5s | > 10s |

---

## Summary

The API Integration Test Suite provides comprehensive validation of:

✓ Installation flow robustness  
✓ Authentication & authorization  
✓ CRUD operation correctness  
✓ Concurrent request handling  
✓ Infrastructure resilience  
✓ Health check accuracy  

Run with: `npm run test:api`

For issues or extensions, refer to the individual test sections above.
