# Testing Patterns

**Analysis Date:** 2026-02-24

## Test Framework

**Runner:** Vitest 2.1.9

**Config:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
    },
    resolve: {
        alias: [
            { find: '@', replacement: resolve(__dirname, './') },
            { find: /^server-only$/, replacement: resolve(__dirname, './tests/mocks/server-only.ts') },
        ],
    },
})
```

**Run Commands:**

```bash
npm run test              # Run all tests in watch mode
npm run test:unit         # Run unit tests only (tests/unit/**/*.test.ts)
npm run test:integration  # Run integration tests only (tests/integration/**/*.test.ts)
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage report
```

**Test Scripts (package.json):**

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Test File Organization

### Location

**Pattern:** Tests co-located in `tests/` directory, mirroring source structure

```
tests/
├── setup.ts                    # Global test setup
├── mocks/
│   ├── db.ts                   # Database mock
│   └── server-only.ts          # server-only module mock
├── unit/
│   ├── agents/
│   │   ├── agent-router.test.ts
│   │   └── seo-aeo-prompt-contract.test.ts
│   ├── chat/
│   │   ├── message-handler.test.ts
│   │   └── intent-classifier.test.ts
│   ├── workflow-state.test.ts
│   ├── rate-limit.test.ts
│   └── ...
└── integration/
    ├── user-journeys.test.ts
    ├── rate-limit-api.test.ts
    ├── mode-switching.test.ts
    ├── error-recovery.test.ts
    └── cross-workflow.test.ts
```

### Naming

**Pattern:** `[module-name].test.ts` or `[feature].test.ts`

```
agent-router.test.ts           # Unit tests for agent-router.ts
workflow-state.test.ts         # Tests for workflow state management
seo-aeo-prompt-contract.test.ts # Tests for prompt formatting
error-recovery.test.ts         # Integration tests for error handling
```

## Test Setup

### Global Setup

**File:** `tests/setup.ts`

```typescript
/**
 * Test setup file
 * Configures mocks and test environment
 */

import { beforeEach, vi } from 'vitest'
import * as dbMock from './mocks/db'

// Mock DB to avoid real network calls in unit tests
vi.mock('@/lib/db', () => dbMock)

// Reset in-memory DB between tests
beforeEach(() => {
  dbMock.__resetDb()
})

// Mock environment variables
process.env.UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://test-redis.upstash.io'
process.env.UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'test-token'
// ... more env vars

// Mock Next.js server components
vi.mock('server-only', () => ({}))

// Mock Clerk server SDK
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: null })),
  currentUser: vi.fn(async () => ({ id: 'test-user-id' })),
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
}))
```

## Test Structure

### Suite Organization

**Pattern:** Nested describe blocks by feature → scenario → test case

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { AgentRouter } from '@/lib/agents/agent-router'
import { AGENT_IDS } from '@/lib/agents/constants'

describe('AgentRouter', () => {
  describe('routeQuery', () => {
    describe('Onboarding Agent Routing', () => {
      it('should route to onboarding when page context is "onboarding"', () => {
        const result = AgentRouter.routeQuery('hello', { page: 'onboarding' })
        
        expect(result.agent).toBe(AGENT_IDS.ONBOARDING)
        expect(result.confidence).toBeGreaterThan(0.9)
        expect(result.tools).toContain('client_ui')
      })

      it('should route to onboarding for setup-related queries', () => {
        const queries = [
          'how do I setup my account',
          'getting started with the platform',
          'show me a tutorial',
        ]

        for (const query of queries) {
          const result = AgentRouter.routeQuery(query)
          expect(result.agent).toBe(AGENT_IDS.ONBOARDING)
        }
      })
    })

    describe('Content Agent Routing', () => {
      it('should route to content for explicit content creation requests', () => {
        // ...
      })
    })
  })
})
```

### Assertion Patterns

**Pattern:** Descriptive messages on complex assertions

```typescript
// Simple assertions
expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
expect(result.confidence).toBeGreaterThan(0.9)
expect(result.tools).toContain('client_ui')

// With descriptive message for debugging
expect(
  result.agent,
  `Query "${query}" should route to onboarding but got ${result.agent}`
).toBe(AGENT_IDS.ONBOARDING)

// Multiple assertions on object structure
result.stepResults.forEach(stepResult => {
  expect(stepResult).toHaveProperty('stepId')
  expect(stepResult).toHaveProperty('status')
  expect(['completed', 'failed', 'skipped']).toContain(stepResult.status)
})
```

## Mocking Patterns

### Framework

**Tool:** Vitest built-in mocking (`vi.fn()`, `vi.mock()`)

### Module Mocks

**Pattern:** Mock entire modules at top level

```typescript
// Mock persistence
vi.mock('@/lib/workflows/persistence', () => ({
  workflowPersistence: {
    saveExecution: vi.fn().mockResolvedValue(undefined),
    saveCheckpoint: vi.fn().mockResolvedValue(undefined),
    loadExecution: vi.fn(),
    resumeFromCheckpoint: vi.fn(),
  },
}))

// Mock Redis cache
vi.mock('@/lib/redis/client', () => ({
  cacheGet: vi.fn(),
  cacheSet: vi.fn(),
}))
```

### Function Mocks

**Pattern:** Mock specific methods with spyOn

```typescript
import { vi } from 'vitest'
import { WorkflowEngine } from '@/lib/workflows/engine'

// Mock private method
vi.spyOn(WorkflowEngine.prototype as any, 'executeTool').mockImplementation(
  async (toolName: string) => {
    return {
      toolName: toolName,
      success: true,
      data: { result: 'test' },
      duration: 100,
      cached: false
    }
  }
)

// Mock to track calls
const executionOrder: string[] = []
const originalExecuteStep = WorkflowEngine.prototype.executeStep
WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(
  async function (step: WorkflowStep) {
    executionOrder.push(step.id)
    return originalExecuteStep.call(this, step)
  }
)
```

### What to Mock

**Required mocks:**
- Database connections (`@/lib/db`)
- External API clients (Supabase, Redis, DataForSEO)
- Authentication services (Clerk)
- Environment variables
- Server-only modules

**Never mock:**
- Pure utility functions
- Type definitions
- Constants

### Mock Data Builders

**Pattern:** Create reusable mock factories

```typescript
// tests/mocks/db.ts
class SelectBuilder {
  private whereCondition: unknown
  private descCompletedAt = false
  private limitCount: number | undefined

  from(_table: unknown) {
    return this
  }

  where(condition: unknown) {
    this.whereCondition = condition
    return this
  }

  limit(n: number) {
    this.limitCount = n
    return this.execute()
  }

  private execute(): Promise<UserProgressRow[]> {
    let result = applyFilters(rows, this.whereCondition)
    result = sortRows(result, this.descCompletedAt)
    if (this.limitCount != null) result = result.slice(0, this.limitCount)
    return Promise.resolve(result)
  }
}

export const db = {
  select: () => new SelectBuilder(),
  insert: (_table: unknown) => new InsertBuilder('user_progress'),
  update: (_table: unknown) => new UpdateBuilder(),
} as const
```

## Fixtures and Test Data

### Pattern

**Approach:** Inline test data or shared fixtures

```typescript
// Inline fixtures in test file
beforeEach(() => {
  mockContext = {
    userQuery: 'test query',
    conversationHistory: [],
    previousStepResults: {},
    userPreferences: {},
    cache: new Map(),
  }

  mockWorkflow = {
    id: 'test-workflow',
    name: 'Test Workflow',
    description: 'Test workflow for state integrity',
    icon: '🧪',
    category: 'seo',
    estimatedTime: '1 minute',
    tags: ['test'],
    steps: [
      {
        id: 'step1',
        name: 'Step 1',
        description: 'First step',
        agent: 'research',
        parallel: false,
        tools: [{ name: 'test_tool', params: {} }],
        outputFormat: 'json',
      },
    ],
  }
})
```

## Async Testing

### Pattern

```typescript
// Testing async operations
it('should execute workflow and return results', async () => {
  const engine = new WorkflowEngine(
    mockWorkflow,
    mockContext,
    'test-conversation',
    'test-user'
  )

  const result = await engine.execute()

  expect(result.status).toBe('completed')
  expect(result.stepResults.length).toBe(mockWorkflow.steps.length)
})

// Testing error handling
it('should save checkpoint when API call fails', async () => {
  vi.spyOn(WorkflowEngine.prototype as any, 'executeTool').mockRejectedValue(
    new Error('API call failed')
  )

  const engine = new WorkflowEngine(mockWorkflow, mockContext, 'id', 'user')

  try {
    await engine.execute()
  } catch (error) {
    // Expected to fail
  }

  expect(workflowPersistence.saveCheckpoint).toHaveBeenCalled()
})
```

## Error Testing

### Pattern

```typescript
describe('Error Recovery Integration Tests', () => {
  it('should save checkpoint when API call fails', async () => {
    // Mock tool execution to fail
    vi.spyOn(WorkflowEngine.prototype as any, 'executeTool').mockRejectedValue(
      new Error('API call failed')
    )

    const engine = new WorkflowEngine(mockWorkflow, mockContext, 'id', 'user')

    try {
      await engine.execute()
    } catch (error) {
      // Expected to fail
    }

    // Verify checkpoint was saved
    expect(workflowPersistence.saveCheckpoint).toHaveBeenCalled()
    expect(workflowPersistence.saveExecution).toHaveBeenCalled()
  })

  it('should provide actionable suggestions for common errors', async () => {
    const { getFallbackSuggestion } = await import('@/lib/errors/graceful-degradation')
    
    const rateLimitError = { message: 'Rate limit exceeded', statusCode: 429 }
    const suggestion = getFallbackSuggestion('dataforseo', rateLimitError)
    
    expect(suggestion).toBeTruthy()
    expect(suggestion).toContain('retry')
  })
})
```

## Test Types

### Unit Tests

**Scope:** Individual functions, classes, utilities

**Location:** `tests/unit/**/*.test.ts`

**Characteristics:**
- Fast execution (< 100ms per test)
- Heavy mocking of dependencies
- Focus on logic, not integration

```typescript
describe('AgentRouter', () => {
  describe('routeQuery', () => {
    it('should route to SEO for analytics queries', () => {
      const queries = [
        'analyze my website SEO performance',
        'what is the search volume for this keyword',
        'show me competitor backlinks',
      ]

      for (const query of queries) {
        const result = AgentRouter.routeQuery(query)
        expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
      }
    })
  })
})
```

### Integration Tests

**Scope:** Multiple components working together

**Location:** `tests/integration/**/*.test.ts`

**Characteristics:**
- Test component interactions
- Mock external APIs only
- Test error recovery, persistence

```typescript
describe('Error Recovery Integration Tests', () => {
  describe('API Failure Triggers Checkpoint Save', () => {
    it('should save checkpoint when API call fails', async () => {
      // ... test with real WorkflowEngine, mocked external APIs
    })
  })

  describe('Workflow Resume from Checkpoint', () => {
    it('should resume workflow from last successful checkpoint', async () => {
      // ... test resume functionality
    })
  })
})
```

### E2E Tests

**Status:** Not currently implemented

**Recommended tool:** Playwright (already in devDependencies)

## Coverage

### Requirements

**Target:** No explicit target configured; focus on critical paths

**View Coverage:**

```bash
npm run test:coverage
```

**Coverage reports generated:**
- `text` - Console output
- `json` - Machine-readable
- `html` - Visual report in `coverage/` directory

### Excluded from Coverage

**Config:** `tsconfig.json` excludes test files from type checking

```json
{
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.test.tsx",
    "test-*.ts",
    "scripts/test-*.ts"
  ]
}
```

## Testing Best Practices

### DO

```typescript
// DO use descriptive test names
describe('AgentRouter', () => {
  describe('routeQuery', () => {
    describe('Onboarding Agent Routing', () => {
      it('should route to onboarding when page context is "onboarding"', () => {
        // ...
      })
    })
  })
})

// DO reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
  dbMock.__resetDb()
})

// DO restore original implementations afterEach
afterEach(() => {
  vi.restoreAllMocks()
})

// DO use proper error assertions
await expect(
  withGracefulDegradation('dataforseo', 'test', apiCall, {})
).rejects.toThrow('API failed')

// DO test edge cases
describe('Edge Cases', () => {
  it('should handle empty message', () => {
    const result = AgentRouter.routeQuery('')
    expect(result.agent).toBe(AGENT_IDS.GENERAL)
  })

  it('should handle very long messages', () => {
    const longMessage = 'SEO '.repeat(100)
    const result = AgentRouter.routeQuery(longMessage)
    expect(result.agent).toBe(AGENT_IDS.SEO_AEO)
  })
})
```

### DON'T

```typescript
// DON'T use non-descriptive test names
it('works', () => { /* ... */ })  // ❌

// DON'T forget to mock external dependencies
// Tests will make real API calls ❌

// DON'T use setTimeout in tests
await new Promise(resolve => setTimeout(resolve, 1000))  // ❌

// DON'T leave .only or .skip in committed code
describe.only('Feature', () => { /* ... */ })  // ❌
it.skip('test', () => { /* ... */ })  // ❌

// DON'T use loose assertions
expect(result).toBeTruthy()  // Too vague ❌
expect(result.status).toBe('completed')  // Specific ✅
```

## Common Test Scenarios

### Testing Agent Routing

```typescript
describe('Content Agent Routing', () => {
  it('should route to content for explicit content creation requests', () => {
    const queries = [
      'write me a blog post about SEO',
      'create an article on digital marketing',
      'generate a blog about AI trends',
    ]

    for (const query of queries) {
      const result = AgentRouter.routeQuery(query)
      expect(result.agent).toBe(AGENT_IDS.CONTENT)
      expect(result.confidence).toBeGreaterThanOrEqual(0.9)
    }
  })

  it('should prioritize content over SEO when explicit content intent is present', () => {
    // "blog post" is content, but "SEO" is in the query too
    const result = AgentRouter.routeQuery('write a blog post about SEO best practices')
    
    expect(result.agent).toBe(AGENT_IDS.CONTENT)
  })
})
```

### Testing Workflow State

```typescript
describe('Property: Steps Execute in Dependency Order', () => {
  it('should execute steps in correct dependency order', async () => {
    const executionOrder: string[] = []

    // Mock executeStep to track order
    const originalExecuteStep = WorkflowEngine.prototype.executeStep
    WorkflowEngine.prototype.executeStep = vi.fn().mockImplementation(
      async function (step: WorkflowStep) {
        executionOrder.push(step.id)
        return originalExecuteStep.call(this, step)
      }
    )

    const engine = new WorkflowEngine(mockWorkflow, mockContext, 'conv', 'user')
    await engine.execute()

    // Property: Steps must execute in dependency order
    expect(executionOrder).toEqual(['step1', 'step2', 'step3'])

    // Restore original
    WorkflowEngine.prototype.executeStep = originalExecuteStep
  })
})
```

### Testing Error Recovery

```typescript
describe('Graceful Degradation Fallbacks', () => {
  it('should use cached result when API fails', async () => {
    const { cacheGet } = await import('@/lib/redis/client')
    
    // Mock cache hit
    vi.mocked(cacheGet).mockResolvedValue({ cached: 'result' })

    const result = await attemptGracefulDegradation(
      'dataforseo',
      'keyword_search',
      { keyword: 'test' },
      new Error('API failed')
    )

    expect(result.success).toBe(true)
    expect(result.cached).toBe(true)
    expect(result.fallbackUsed).toBe('cache')
  })
})
```

---

*Testing analysis: 2026-02-24*
