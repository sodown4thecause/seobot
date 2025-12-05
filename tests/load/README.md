# Load Testing with k6

This directory contains load tests for rate limiting functionality.

## Prerequisites

Install k6:
- macOS: `brew install k6`
- Linux: See [k6 installation guide](https://k6.io/docs/getting-started/installation/)
- Windows: Download from [k6 releases](https://github.com/grafana/k6/releases)

## Running Load Tests

### Basic Rate Limiting Test

```bash
# Test against local development server
k6 run tests/load/k6-rate-limit.js

# Test against staging/production
BASE_URL=https://staging.example.com k6 run tests/load/k6-rate-limit.js
```

### Custom Test Scenarios

You can modify the `options` in `k6-rate-limit.js` to test different scenarios:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up to 50 concurrent users
    { duration: '2m', target: 50 },   // Maintain 50 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    rate_limit_latency: ['p(95)<50'],
  },
}
```

## Test Metrics

The load test measures:

1. **Rate Limit Hits**: Percentage of requests that hit rate limits (expected)
2. **Rate Limit Latency**: Overhead added by rate limiting checks (<50ms target)
3. **HTTP Request Duration**: Overall request latency
4. **Success Rate**: Percentage of successful requests

## Expected Results

- Rate limit latency should remain below 50ms (95th percentile)
- Rate limiting should be enforced correctly (429 responses when limits exceeded)
- Multiple IPs/users should be rate limited independently
- System should handle load gracefully without errors

## CI Integration

To run load tests in CI:

```yaml
# .github/workflows/load-test.yml
- name: Run k6 load tests
  run: |
    k6 run --out json=results.json tests/load/k6-rate-limit.js
    # Analyze results.json for failures
```

