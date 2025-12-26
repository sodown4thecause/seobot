/**
 * Test setup file
 * Configures mocks and test environment
 */

import { vi } from 'vitest'

// Mock environment variables - set all required vars before any imports
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'test-token'
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-role'
process.env.DATAFORSEO_USERNAME = process.env.DATAFORSEO_USERNAME || 'test@example.com'
process.env.DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD || 'test-password'
process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'pplx-test-key'
process.env.JINA_API_KEY = process.env.JINA_API_KEY || 'jina-test-key'
process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || 'test-gemini-key'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-key'

// Mock Next.js server components
vi.mock('server-only', () => ({}))

// Mock env config to bypass validation in tests
vi.mock('@/lib/config/env', () => ({
  getServerEnv: vi.fn(() => ({
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
    DATAFORSEO_USERNAME: 'test@example.com',
    DATAFORSEO_PASSWORD: 'test-password',
    PERPLEXITY_API_KEY: 'pplx-test-key',
    JINA_API_KEY: 'jina-test-key',
    GOOGLE_GENERATIVE_AI_API_KEY: 'test-gemini-key',
    OPENAI_API_KEY: 'sk-test-key',
  })),
  getClientEnv: vi.fn(() => ({
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  })),
}))

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  })),
  createAdminClient: vi.fn(() => ({
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'test/path.png' },
          error: null,
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/image.png' },
        }),
      }),
    },
  })),
}))

// Mock API tracker
vi.mock('@/lib/analytics/api-tracker', () => ({
  trackAPICall: vi.fn().mockResolvedValue(undefined),
}))

// Mock workflow analytics
const mockAnalytics = {
  recordExecution: vi.fn().mockResolvedValue(undefined),
  recordWorkflowExecution: vi.fn(),
  getWorkflowMetrics: vi.fn().mockResolvedValue({
    averageDuration: 0,
    successRate: 100,
    totalExecutions: 0,
    averageStepsCompleted: 0
  }),
}

vi.mock('@/lib/workflows/analytics', () => ({
  workflowAnalytics: mockAnalytics,
  analytics: mockAnalytics,
  WorkflowAnalyticsService: vi.fn(() => mockAnalytics),
}))
