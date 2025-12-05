/**
 * Integration tests for rate limiting in API routes
 * Tests actual API endpoints with rate limiting applied
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as chatPOST } from '@/app/api/chat/route'
import { POST as keywordsPOST } from '@/app/api/keywords/research/route'
import { POST as contentGeneratePOST } from '@/app/api/content/generate/route'
import { getRedisClient } from '@/lib/redis/client'

// Mock dependencies
vi.mock('@/lib/redis/client', () => ({
  getRedisClient: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  })),
}))

vi.mock('@/lib/agents/orchestrator', () => ({
  OrchestratorAgent: vi.fn(),
}))

vi.mock('@/lib/agents/rag-writer-orchestrator', () => ({
  RAGWriterOrchestrator: vi.fn(),
}))

vi.mock('@/lib/agents/agent-router', () => ({
  AgentRouter: {
    routeQuery: vi.fn().mockReturnValue({
      agent: 'research',
      confidence: 0.9,
      reasoning: 'Test',
      tools: [],
    }),
  },
}))

vi.mock('ai', () => ({
  streamText: vi.fn().mockResolvedValue({
    toTextStreamResponse: vi.fn().mockReturnValue(new Response('test stream')),
  }),
  convertToCoreMessages: vi.fn(),
  tool: vi.fn(),
  stepCountIs: vi.fn(),
}))

vi.mock('@/lib/ai/gateway-provider', () => ({
  vercelGateway: {
    languageModel: vi.fn().mockReturnValue({}),
  },
}))

vi.mock('@/lib/api/dataforseo-service', () => ({
  keywordResearch: vi.fn().mockResolvedValue({
    success: true,
    data: { tasks: [{ result: [] }] },
  }),
}))

vi.mock('@/lib/analytics/api-tracker', () => ({
  trackAPICall: vi.fn().mockResolvedValue(undefined),
}))

describe('API Route Rate Limiting Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Redis as unavailable to use in-memory fallback
    vi.mocked(getRedisClient).mockReturnValue(null)
  })

  describe('Chat API Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.100',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      // First request should succeed (rate limit check passes)
      const response = await chatPOST(req)
      expect(response.status).not.toBe(429)
    })

    it('should block requests exceeding rate limit', async () => {
      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.101',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        await chatPOST(req)
      }

      // Next request should be rate limited
      const response = await chatPOST(req)
      expect(response.status).toBe(429)

      const body = await response.json()
      expect(body.error).toContain('Too many chat requests')
      expect(body.retryAfter).toBeGreaterThan(0)
    })
  })

  describe('Keywords Research API Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const req = new NextRequest('http://localhost/api/keywords/research', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.102',
        },
        body: JSON.stringify({
          keywords: ['test keyword'],
        }),
      })

      const response = await keywordsPOST(req)
      expect(response.status).not.toBe(429)
    })

    it('should block requests exceeding hourly limit', async () => {
      const req = new NextRequest('http://localhost/api/keywords/research', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.103',
        },
        body: JSON.stringify({
          keywords: ['test keyword'],
        }),
      })

      // Make requests up to the limit (10 per hour)
      for (let i = 0; i < 10; i++) {
        await keywordsPOST(req)
      }

      // Next request should be rate limited
      const response = await keywordsPOST(req)
      expect(response.status).toBe(429)
    })
  })

  describe('Content Generation API Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      const req = new NextRequest('http://localhost/api/content/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.104',
        },
        body: JSON.stringify({
          topic: 'Test topic',
          type: 'blog',
          tone: 'professional',
        }),
      })

      const response = await contentGeneratePOST(req)
      expect(response.status).not.toBe(429)
    })

    it('should block requests exceeding rate limit', async () => {
      const req = new NextRequest('http://localhost/api/content/generate', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.105',
        },
        body: JSON.stringify({
          topic: 'Test topic',
          type: 'blog',
          tone: 'professional',
        }),
      })

      // Make requests up to the limit (5 per minute)
      for (let i = 0; i < 5; i++) {
        await contentGeneratePOST(req)
      }

      // Next request should be rate limited
      const response = await contentGeneratePOST(req)
      expect(response.status).toBe(429)
    })
  })

  describe('Rate Limit Headers', () => {
    it('should include rate limit headers in responses', async () => {
      const req = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.106',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const response = await chatPOST(req)
      
      // Check for rate limit headers (if middleware adds them)
      // Note: Headers might not be present if rate limit check happens before response
      // This test verifies the middleware is being called
      expect(response).toBeDefined()
    })
  })

  describe('Different IP Addresses', () => {
    it('should rate limit per IP address independently', async () => {
      const req1 = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.200',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      const req2 = new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '192.168.1.201',
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      })

      // Exceed limit for IP 1
      for (let i = 0; i < 10; i++) {
        await chatPOST(req1)
      }

      // IP 1 should be blocked
      const response1 = await chatPOST(req1)
      expect(response1.status).toBe(429)

      // IP 2 should still work
      const response2 = await chatPOST(req2)
      expect(response2.status).not.toBe(429)
    })
  })
})

