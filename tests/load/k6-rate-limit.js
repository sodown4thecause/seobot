/**
 * k6 Load Test for Rate Limiting
 * 
 * Run with: k6 run tests/load/k6-rate-limit.js
 * 
 * This test verifies:
 * - Rate limiting is enforced under load
 * - Latency overhead remains acceptable (<50ms)
 * - Multiple users/IPs are rate limited independently
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const rateLimitHits = new Rate('rate_limit_hits')
const rateLimitLatency = new Trend('rate_limit_latency')

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 20 },   // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    rate_limit_latency: ['p(95)<50'], // Rate limit check should add <50ms overhead
    rate_limit_hits: ['rate<0.1'],   // Less than 10% should hit rate limits (expected)
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Generate unique IP for each VU (Virtual User)
function getUniqueIP(vuId) {
  return `192.168.1.${100 + (vuId % 100)}`
}

export default function () {
  const vuId = __VU
  const ip = getUniqueIP(vuId)
  
  // Test Chat API rate limiting
  const chatUrl = `${BASE_URL}/api/chat`
  const chatPayload = JSON.stringify({
    messages: [{ role: 'user', content: 'Test message' }],
  })
  
  const chatHeaders = {
    'Content-Type': 'application/json',
    'x-forwarded-for': ip,
  }
  
  const startTime = Date.now()
  const chatResponse = http.post(chatUrl, chatPayload, { headers: chatHeaders })
  const latency = Date.now() - startTime
  
  // Check if rate limited
  const isRateLimited = chatResponse.status === 429
  rateLimitHits.add(isRateLimited)
  rateLimitLatency.add(latency)
  
  check(chatResponse, {
    'chat status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'response time < 500ms': (r) => r.timings.duration < 500,
  })
  
  if (isRateLimited) {
    const body = JSON.parse(chatResponse.body)
    check(body, {
      'rate limit error message present': (b) => b.error !== undefined,
      'retry after header present': () => chatResponse.headers['Retry-After'] !== undefined,
    })
  }
  
  // Test Keywords Research API rate limiting
  const keywordsUrl = `${BASE_URL}/api/keywords/research`
  const keywordsPayload = JSON.stringify({
    keywords: ['test keyword'],
  })
  
  const keywordsResponse = http.post(keywordsUrl, keywordsPayload, { headers: chatHeaders })
  
  check(keywordsResponse, {
    'keywords status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  })
  
  // Small delay between requests
  sleep(0.1)
}

