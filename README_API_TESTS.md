# AV Rentals API Integration Test Suite

## 📋 Overview

A comprehensive, automated API testing framework for AV Rentals Phase 4 that validates:

- ✅ **Installation Flow** (Phase 4 setup, re-installation protection, payload validation)
- ✅ **Authentication & Sessions** (JWT handling, token expiration, logout validation)
- ✅ **Data Management** (CRUD operations, concurrency, empty states)
- ✅ **Infrastructure** (Nginx proxy, large payloads, X-Forwarded headers)
- ✅ **Health & Diagnostics** (System status, latency measurement)

**Status**: All 19 core tests with detailed failure analysis and fix suggestions.

---

## 🚀 Quick Start

### Prerequisites

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.production .env.local
# Edit .env.local with your configuration

# 3. Apply migrations
npm run db:migrate

# 4. Start services (if using Docker)
docker-compose up -d
```

### Run Tests

```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Run API tests
npm run test:api

# Watch mode (re-run on changes)
npm run test:api:watch
```

### Expected Output

```
========================================================================
FINAL API TEST REPORT
========================================================================

Overall Results: 19/19 passed (100.0%)

✓ Health check - all online
✓ Test MinIO connection
✓ Login with valid credentials
✓ Create category
... [16 more tests]

========================================================================
✓ ALL TESTS PASSED!
========================================================================
```

---

## 📁 File Structure

```
.
├── src/
│   └── __tests__/
│       ├── api.integration.test.ts    # Main test suite (19 tests)
│       ├── installation.test.ts       # Existing installation tests
│       └── translation.service.test.ts
├── scripts/
│   └── run-api-tests.sh               # Test runner script
├── .github/
│   └── workflows/
│       └── api-tests.yml              # CI/CD pipeline
├── docs/
│   └── API_TEST_GUIDE.md              # Comprehensive guide (7 sections)
├── API_TEST_QUICKREF.md               # Quick reference
└── package.json                       # npm run test:api

```

---

## 🧪 Test Coverage

### Section 1: Health & Diagnostics (2 tests)

Tests `/api/health` endpoint:
- System connectivity check
- Latency measurement validation

### Section 2: Phase 4 Installation (3 tests)

Tests setup wizard endpoints:
- MinIO storage connectivity
- Zod payload validation
- Re-installation protection (403 on second attempt)
- Stress test with 50MB payload

### Section 3: Authentication & Sessions (5 tests)

Tests JWT token handling:
- Valid credentials login
- Missing token rejection (401)
- Expired token rejection (401)
- Wrong signing key detection (401)
- Logout cookie invalidation
- Post-logout access denial

### Section 4: CRUD Operations (6 tests)

Tests `/api/categories` full lifecycle:
- GET empty state (returns 200 with [])
- POST create (201 with id)
- GET list (200 with array)
- PUT update (200 with modified object)
- DELETE (200/204)
- Cascade behavior validation

### Section 5: Concurrency (1 test)

Tests race conditions:
- Simultaneous identical requests
- Database constraint handling
- Transactional integrity

### Section 6: Infrastructure (2 tests)

Tests Nginx proxy behavior:
- X-Forwarded-For/X-Forwarded-Proto headers
- Large payload handling (10MB)
- client_max_body_size limits

---

## 📊 Test Results Interpretation

### PASS ✓

```
✓ [/api/health] GET - System healthy (DB + Storage online)
  Expected: 200
  Actual: 200
  Latency: 23ms
```

All assertions passed. Endpoint working as expected.

### FAIL ✗

```
✗ [/api/categories] GET - Categories without auth
  Expected: 401
  Actual: 200
  Error: Should reject requests without auth
  💡 Suggestion: Add auth requirement to GET /api/categories
```

Assertion failed. See suggestion for how to fix.

---

## 🔧 Common Issues & Solutions

### Issue 1: "API server is not running"

```bash
Error: API call failed: GET /api/health - fetch failed

Solution:
→ Start dev server: npm run dev
→ Verify: curl http://localhost:3000/api/health
```

### Issue 2: "Database connection failed"

```bash
FAIL: GET /api/health
Expected: 200
Actual: 503
Error: Database connection failed

Solution:
→ Apply migrations: npm run db:migrate
→ Check DATABASE_URL: echo $DATABASE_URL
→ Verify PostgreSQL: psql $DATABASE_URL -c "SELECT 1"
```

### Issue 3: "JWT token validation fails"

```bash
FAIL: GET /api/categories - Categories with expired JWT
Expected: 401
Actual: 200
Error: Expired token should be rejected

Solution:
→ Check JWT_SECRET is set: grep JWT_SECRET .env.local
→ Verify secret is used consistently across API
→ Test: npm run test:api 2>&1 | grep JWT
```

### Issue 4: "MinIO connection failed"

```bash
FAIL: POST /api/setup/test-storage
Expected: 200
Actual: 500
Error: MinIO connection failed

Solution:
→ Start MinIO: docker-compose up -d minio
→ Verify credentials: aws s3 ls --endpoint-url http://minio:9000 \
                               --access-key minioadmin \
                               --secret-key minioadmin
→ Check env vars: MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY
```

### Issue 5: "Nginx returns 413 on large uploads"

```bash
FAIL: POST /api/categories - Large payload handling
Expected: 413 or graceful handling
Actual: 500
Error: Server crashed

Solution:
→ Edit: nginx/app.conf.template
→ Add: client_max_body_size 100M;
→ Restart: docker-compose restart nginx
```

See **[docs/API_TEST_GUIDE.md](docs/API_TEST_GUIDE.md)** for detailed troubleshooting.

---

## 🔍 Detailed Reports

### View All Test Details

```bash
npm run test:api 2>&1 | tee test-results.txt
```

### Filter by Endpoint

```bash
npm run test:api 2>&1 | grep -A2 "POST /api/categories"
```

### Show Only Failures

```bash
npm run test:api 2>&1 | grep -B2 "FAIL"
```

### Check Latency Performance

```bash
npm run test:api 2>&1 | grep -i latency
```

---

## 📈 Performance Baselines

Target latencies for healthy system:

| Endpoint | Operation | Target | Alert |
|----------|-----------|--------|-------|
| `/api/health` | GET | < 50ms | > 200ms |
| `/api/categories` | GET | < 100ms | > 500ms |
| `/api/categories` | POST | < 200ms | > 1000ms |
| `/api/setup/test-storage` | POST | < 5s | > 10s |

---

## 🚢 CI/CD Integration

### GitHub Actions

Tests run automatically on:
- `push` to `main` or `develop`
- All pull requests

View results:
1. Go to **Actions** tab in GitHub
2. Click on **API Integration Tests** workflow
3. Click on specific run
4. Expand test step to see details

#### Configuration

File: `.github/workflows/api-tests.yml`

```yaml
jobs:
  api-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15-alpine
      minio:
        image: minio/minio:latest
    steps:
      - run: npm install
      - run: npm run db:migrate
      - run: npm run dev &
      - run: npm run test:api
```

### Pre-commit Hook

Optionally run tests before committing:

```bash
# In .husky/pre-commit
npm run test:api || exit 1
```

---

## 🛠️ Extending Tests

### Add a New Test Case

Edit `src/__tests__/api.integration.test.ts`:

```typescript
describe('Section 7: My New Feature', () => {
  it('should validate new endpoint', async () => {
    const { status, data, latency } = await apiCall(
      'GET',
      '/api/my-new-endpoint'
    );

    recordResult({
      name: 'My test description',
      endpoint: '/api/my-new-endpoint',
      method: 'GET',
      status: status === 200 ? 'PASS' : 'FAIL',
      expected: 200,
      actual: status,
      latency,
      error: status === 200 ? undefined : `Got ${status}`,
      suggestion: 'How to fix if it fails'
    });
  });
});
```

Run: `npm run test:api`

### Add Custom Assertions

```typescript
// Example: Check response time
const passed = latency < 100;

// Example: Validate data structure
const passed = data && data.id && Array.isArray(data.items);

// Example: Check multiple conditions
const passed = status === 200 && 
               data.success === true && 
               latency < 500;
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[API_TEST_GUIDE.md](docs/API_TEST_GUIDE.md)** | Comprehensive testing guide with 7 sections |
| **[API_TEST_QUICKREF.md](API_TEST_QUICKREF.md)** | Quick reference with commands and common issues |
| **[src/__tests__/api.integration.test.ts](src/__tests__/api.integration.test.ts)** | Test source code with comments |
| **[scripts/run-api-tests.sh](scripts/run-api-tests.sh)** | Test runner script |

---

## 🔐 Environment Variables

Create `.env.local` with test configuration:

```env
# Required for tests
API_BASE_URL=http://localhost:3000
JWT_SECRET=your-secret-key
NODE_ENV=test

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/av_rentals

# Storage (MinIO)
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=av-rentals

# Optional
LOG_LEVEL=info
DEBUG=false
```

---

## 📦 Dependencies

The test suite uses:

- **vitest** - Fast unit test framework
- **node-fetch** - HTTP client for API calls
- **jsonwebtoken** - JWT token creation/validation
- **@prisma/client** - Database access

All dependencies are already in `package.json`.

---

## 🎯 Next Steps

1. **Run tests locally**:
   ```bash
   npm run test:api
   ```

2. **Review failures** (if any):
   - Check the error message and suggestion
   - Refer to detailed guide in [docs/API_TEST_GUIDE.md](docs/API_TEST_GUIDE.md)

3. **Fix issues**:
   - Update API code or configuration
   - Re-run tests: `npm run test:api`

4. **Integrate with CI/CD**:
   - Tests automatically run on GitHub Actions
   - Review results in the Actions tab

5. **Extend tests**:
   - Add new test cases for new features
   - Follow the pattern in `src/__tests__/api.integration.test.ts`

---

## 📞 Support

### Getting Help

- **Test failures**: See [API_TEST_GUIDE.md](docs/API_TEST_GUIDE.md) Section specific to the failing test
- **Environment issues**: Check `.env.local` configuration
- **Server issues**: Ensure `npm run dev` is running
- **Database issues**: Check `npm run db:migrate` completed

### Reporting Issues

When reporting test failures, include:

```bash
# 1. Test output
npm run test:api > test-output.txt 2>&1

# 2. Environment check
echo "DATABASE_URL=$DATABASE_URL"
echo "JWT_SECRET=$JWT_SECRET"
curl http://localhost:3000/api/health

# 3. Server logs
tail -50 /tmp/server.log
```

---

## 📝 Test Maintenance

### Keep Tests Updated

When API changes:

1. Update relevant test cases in `src/__tests__/api.integration.test.ts`
2. Update expected status codes/responses
3. Run: `npm run test:api`
4. Update documentation if behavior changed

### Add Tests for New Endpoints

For each new API endpoint:

1. Create test case in appropriate `describe()` section
2. Test both success and failure paths
3. Include latency measurement
4. Add to this README's test coverage table

---

## 📊 Test Metrics

Track these metrics over time:

```
Week 1:  ✓ 19/19 (100%)
Week 2:  ✓ 19/19 (100%)  
Week 3:  ✓ 19/19 (100%)
```

Set alerts if pass rate drops below 95%.

---

## 🎓 Learning Resources

### Understanding Test Results

- **PASS**: All assertions passed, endpoint working correctly
- **FAIL**: Assertion failed, check suggestion for fix
- **Latency**: Time to complete request (check against baselines)

### Common Test Patterns

```typescript
// Pattern 1: Simple status check
status === 200 ? 'PASS' : 'FAIL'

// Pattern 2: Response structure validation  
status === 200 && data.id && Array.isArray(data.items)

// Pattern 3: Performance check
latency < 100 ? 'PASS' : 'FAIL'

// Pattern 4: Error condition test
status === 401 ? 'PASS' : 'FAIL'
```

---

## ✨ Summary

This test suite provides **automated validation** of:

✓ **19 comprehensive test cases**  
✓ **Detailed failure analysis** with fix suggestions  
✓ **Performance baselines** for latency monitoring  
✓ **CI/CD integration** with GitHub Actions  
✓ **Easy extension** for new endpoints  
✓ **Production-ready** testing framework  

**Run with one command**:
```bash
npm run test:api
```

**Get instant results** with PASS/FAIL and fixes.

---

**Last Updated**: January 15, 2025  
**Status**: Production Ready  
**Framework**: Vitest + Fetch API  
**Coverage**: 19 core tests
