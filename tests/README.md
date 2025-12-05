# Rate Limiting Tests

Comprehensive test suite for rate limiting functionality.

## Test Structure

```
tests/
├── setup.ts                    # Test configuration and mocks
├── unit/                       # Unit tests
│   └── rate-limit.test.ts     # Rate limiting logic tests
├── integration/                # Integration tests
│   └── rate-limit-api.test.ts  # API endpoint tests
└── load/                       # Load tests
    ├── k6-rate-limit.js        # k6 load test script
    └── README.md               # Load testing guide
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Unit Tests

Test the rate limiting logic in isolation:

```bash
npm run test:unit
```

### Integration Tests

Test rate limiting in actual API routes:

```bash
npm run test:integration
```

### All Tests

Run all tests:

```bash
npm test
```

### Watch Mode

Run tests in watch mode during development:

```bash
npm run test:watch
```

### Coverage

Generate coverage report:

```bash
npm run test:coverage
```

## Load Testing

Load tests use k6 to verify rate limiting under high load.

### Prerequisites

Install k6:
- macOS: `brew install k6`
- Linux: See [k6 installation guide](https://k6.io/docs/getting-started/installation/)
- Windows: Download from [k6 releases](https://github.com/grafana/k6/releases)

### Run Load Tests

```bash
# Test against local server
npm run load:test

# Test against staging
BASE_URL=https://staging.example.com npm run load:test
```

See `tests/load/README.md` for detailed load testing documentation.

## Test Coverage

The test suite covers:

### Unit Tests
- ✅ In-memory rate limiting (fallback)
- ✅ Redis rate limiting
- ✅ Window expiration
- ✅ Different rate limit types
- ✅ User identification (user ID vs IP)
- ✅ Rate limit response creation
- ✅ Error handling

### Integration Tests
- ✅ Chat API rate limiting
- ✅ Keywords research API rate limiting
- ✅ Content generation API rate limiting
- ✅ Rate limit headers
- ✅ Independent IP rate limiting

### Load Tests
- ✅ Rate limiting under load
- ✅ Latency overhead (<50ms target)
- ✅ Multiple concurrent users
- ✅ Rate limit enforcement accuracy

## CI Integration

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    npm ci
    npm run test:unit
    npm run test:integration

- name: Run load tests (optional)
  run: |
    npm run load:test
```

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { checkRateLimit } from '@/lib/redis/rate-limit'

describe('New Feature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should test new functionality', async () => {
    // Test implementation
  })
})
```

### Integration Test Example

```typescript
import { POST } from '@/app/api/your-route/route'

describe('Your API Route', () => {
  it('should enforce rate limits', async () => {
    const req = new NextRequest('http://localhost/api/your-route', {
      method: 'POST',
      // ... request setup
    })
    
    const response = await POST(req)
    expect(response.status).not.toBe(429)
  })
})
```

## Troubleshooting

### Tests failing with Redis connection errors

Tests mock Redis by default. If you see Redis errors:
1. Check that `tests/setup.ts` is properly mocking `getRedisClient`
2. Ensure mocks are cleared between tests

### Integration tests failing

Integration tests require proper mocking of:
- Supabase client
- AI SDK functions
- External API services

Check `tests/setup.ts` and test-specific mocks.

### Load tests timing out

If load tests timeout:
1. Ensure the server is running
2. Check BASE_URL environment variable
3. Verify rate limits aren't too strict for test load

