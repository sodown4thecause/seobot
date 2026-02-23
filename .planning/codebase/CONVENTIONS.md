# Coding Conventions

**Analysis Date:** 2026-02-24

## Overview

This codebase follows strict TypeScript patterns with comprehensive error handling, standardized naming conventions, and a well-defined import organization system. The project uses Next.js 16 with React 19, Vercel AI SDK, and multiple MCP integrations.

## Naming Conventions

### Files

| Pattern | Location | Example |
|---------|----------|---------|
| `kebab-case.ts` | All directories | `agent-router.ts`, `workflow-state.test.ts` |
| `index.ts` | Barrel exports | `lib/agents/index.ts` |
| `types.ts` | Type definitions | `lib/workflows/types.ts` |
| `*.test.ts` | Test files | `tests/unit/agent-router.test.ts` |
| `route.ts` | API routes | `app/api/content/stream/route.ts` |
| `page.tsx` | Next.js pages | `app/dashboard/page.tsx` |
| `layout.tsx` | Next.js layouts | `app/layout.tsx` |

### Functions

**Pattern:** camelCase for all functions

```typescript
// lib/agents/agent-router.ts
static routeQuery(message: string, context?: { page?: string }): AgentRoutingResult

// lib/agents/registry.ts
public getAgent(id: string): AgentConfig | null
public validateToolAccess(agentId: string, toolName: string): boolean
```

**Private/Internal methods:** Leading underscore is NOT used; use `private` keyword instead

```typescript
private calculateConfidence(matchCount: number, baseConfidence: number, maxConfidence: number): number
private matchKeywords(message: string, keywords: string[]): string[]
```

### Variables

**Pattern:** camelCase for variables, PascalCase for types/interfaces

```typescript
// Constants: UPPER_SNAKE_CASE
const AGENT_IDS = {
  ONBOARDING: 'onboarding',
  SEO_AEO: 'seo-aeo',
  CONTENT: 'content',
  GENERAL: 'general',
  IMAGE: 'image',
} as const

// Regular variables: camelCase
const matched: string[] = []
let executionOrder: string[] = []
const messageLower = message.toLowerCase()

// Type aliases: PascalCase
type AgentId = (typeof AGENT_IDS)[keyof typeof AGENT_IDS]
export interface AgentRoutingResult {
  agent: AgentType
  confidence: number
  reasoning: string
  tools: string[]
  matchedKeywords?: string[]
}
```

### Classes

**Pattern:** PascalCase for classes

```typescript
export class AgentRouter {
  static routeQuery(message: string, context?: any): AgentRoutingResult
}

export class AgentRegistry implements AgentRegistry {
  public agents: Map<string, AgentConfig>
  constructor()
  private initializeAgents()
}

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
}
```

### Constants

**Pattern:** UPPER_SNAKE_CASE for true constants, camelCase for constant objects

```typescript
// Single value constants
const MAX_CONFIDENCE = 0.98
const BASE_CONFIDENCE = 0.85

// Constant objects with 'as const'
const AGENT_IDS = {
  ONBOARDING: 'onboarding',
  SEO_AEO: 'seo-aeo',
} as const

// Tool arrays with 'as const'
const ONBOARDING_TOOLS = ['client_ui', 'onboarding_progress'] as const
```

## Code Style

### Formatting

**Tool:** No explicit Prettier config detected; relies on Next.js defaults

**Key characteristics observed:**
- 2-space indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in multi-line objects/arrays
- 120+ character line length (no strict limit enforced)

### Linting

**Config:** `eslint.config.mjs` using Next.js ESLint config

```typescript
// eslint.config.mjs
import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "dist/**",
      "next-env.d.ts",
      ".worktrees/**",
      "mcps/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
]);
```

**Rules observed:**
- `@typescript-eslint/no-explicit-any` warnings present but explicitly disabled in some places
- Strict TypeScript enabled (`strict: true` in tsconfig.json)
- No unused variables allowed

### ESLint Disable Comments

**Allowed patterns:**
```typescript
// Explicit disable for valid use cases
// eslint-disable-next-line @typescript-eslint/no-explicit-any
context?: { page?: string; onboarding?: any }
```

**Anti-pattern (NEVER do this):**
```typescript
// NEVER use file-level disables
/* eslint-disable @typescript-eslint/no-explicit-any */
```

## TypeScript Patterns

### Strictness

**Config:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "moduleResolution": "bundler"
  }
}
```

### Type Exports

**Pattern:** Explicit type exports using `type` keyword

```typescript
// lib/agents/agent-router.ts
export type AgentType = AgentId
export interface AgentRoutingResult {
  agent: AgentType
  confidence: number
  reasoning: string
  tools: string[]
  matchedKeywords?: string[]
}
```

### Const Assertions

**Pattern:** Use `as const` for immutable configurations

```typescript
const AGENT_IDS = {
  ONBOARDING: 'onboarding',
  SEO_AEO: 'seo-aeo',
  CONTENT: 'content',
} as const

export type AgentId = (typeof AGENT_IDS)[keyof typeof AGENT_IDS]
```

### Utility Types

**Pattern:** Complex types defined in dedicated files

```typescript
// lib/agents/registry.ts
export interface AgentConfig {
  id: string
  name: string
  description: string
  personality: AgentPersonality
  capabilities: AgentCapabilities
  tools: AgentToolConfig[]
  ragConfig: AgentRAGConfig
  systemPrompt: string
  fallbackAgent?: string
  createdAt: Date
  updatedAt: Date
}
```

## Import Organization

### Order

**Pattern observed in files:**
1. React/Next.js imports
2. Third-party libraries (alphabetical by package name)
3. Internal path aliases (`@/*`)
4. Type-only imports (marked with `type`)
5. Relative imports (discouraged, prefer path aliases)

```typescript
// Example from lib/agents/agent-router.ts
import { AGENT_IDS, type AgentId } from './constants'

// Example from tests
import { describe, it, expect, beforeEach } from 'vitest'
import { AgentRouter } from '@/lib/agents/agent-router'
import { AGENT_IDS } from '@/lib/agents/constants'
```

### Path Aliases

**Config:** `tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Usage:** Always use `@/*` for imports

```typescript
// GOOD
import { AgentRouter } from '@/lib/agents/agent-router'
import { Button } from '@/components/ui/button'

// BAD - never use relative imports for cross-module imports
import { AgentRouter } from '../../../lib/agents/agent-router'
```

### Test Mock Aliases

**Config:** `vitest.config.ts`

```typescript
resolve: {
  alias: [
    { find: '@', replacement: resolve(__dirname, './') },
    { find: /^server-only$/, replacement: resolve(__dirname, './tests/mocks/server-only.ts') },
  ],
}
```

## Error Handling

### Error Types

**Location:** `lib/errors/types.ts`

Use the custom error hierarchy for all errors:

```typescript
import { AppError, RateLimitError, ProviderError, ValidationError } from '@/lib/errors'

// Base error
throw new AppError(
  'Failed to process request',
  'PROCESSING_ERROR',
  500,
  { agent: 'seo-aeo', provider: 'dataforseo' }
)

// Rate limit
throw new RateLimitError('Rate limit exceeded', {
  reset: Date.now() + 60000,
  remaining: 0,
  provider: 'dataforseo'
})

// Provider error
throw new ProviderError('API call failed', 'dataforseo', {
  statusCode: 502,
  retryable: true,
})
```

### Error Patterns

**Pattern 1:** Always include context

```typescript
// lib/errors/types.ts
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, unknown>
  public readonly requestId?: string
  public readonly agent?: string
  public readonly provider?: string
}
```

**Pattern 2:** Use error utilities

```typescript
import { isRetryable, isAbortError, getErrorMetadata } from '@/lib/errors'

// Check if error can be retried
if (isRetryable(error)) {
  await retryWithBackoff(operation)
}

// Check if operation was aborted
if (isAbortError(error)) {
  return { cancelled: true }
}

// Get metadata for logging
const metadata = getErrorMetadata(error)
logger.error('Operation failed', metadata)
```

**Pattern 3:** Never use `as any` or `@ts-ignore` for error handling

```typescript
// BAD
try {
  await operation()
} catch (e) {
  const error = e as any  // NEVER DO THIS
}

// GOOD
import { AppError } from '@/lib/errors'

try {
  await operation()
} catch (e) {
  if (e instanceof AppError) {
    // Handle known error
  } else if (e instanceof Error) {
    // Handle generic error
  }
}
```

## Logging

**Framework:** Custom logger in `lib/errors/logger.ts`

**Pattern:** Structured logging with context

```typescript
import { logger } from '@/lib/errors/logger'

// Log with context
logger.info('Workflow started', {
  workflowId: 'competitor-analysis',
  userId: 'user-123',
  stepCount: 5,
})

logger.error('Tool execution failed', {
  tool: 'dataforseo_keyword_research',
  error: getErrorMetadata(error),
  duration: 1500,
})
```

**Log Levels:**
- `error` - Fatal errors requiring investigation
- `warn` - Non-fatal issues, recoverable errors
- `info` - Important state changes, workflow progress
- `debug` - Detailed debugging info (development only)

## Component Patterns

### shadcn/ui Components

**Location:** `components/ui/`

**Pattern:** Extend Radix UI primitives with class-variance-authority

```typescript
// components/ui/button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground...",
        outline: "border border-input bg-background hover:bg-accent...",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
Button.displayName = "Button"
export { Button, buttonVariants }
```

### Utility Function

**Location:** `lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

## Anti-Patterns (NEVER)

### Type Safety

```typescript
// NEVER use as any
const data = response as any  // ❌

// NEVER use @ts-ignore
// @ts-ignore  // ❌
const value = someFunction()

// NEVER import from mcps/ directly
import { tools } from 'mcps/dataforseo'  // ❌

// GOOD: Use lib/mcp/ wrappers
import { executeTool } from '@/lib/mcp/dataforseo'
```

### API Keys

```typescript
// NEVER hardcode API keys
const apiKey = 'sk-1234567890abcdef'  // ❌

// GOOD: Use environment variables
import { getServerEnv } from '@/lib/config/env'
const apiKey = getServerEnv().OPENAI_API_KEY
```

### Auth Checks

```typescript
// NEVER skip auth in API routes
export async function POST(request: Request) {
  // Missing auth check ❌
  const data = await request.json()
}

// GOOD: Always verify auth
import { auth } from '@clerk/nextjs/server'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }
  // ... proceed
}
```

## Comments

### When to Comment

**Required:**
- JSDoc for all exported functions, classes, interfaces
- File-level documentation explaining purpose
- Complex algorithm explanations
- TODO/FIXME for known issues

```typescript
/**
 * Agent Router - Determines which specialized agent should handle the query
 * Routes to: OnboardingAgent, SEOAEOAgent, or ContentAgent based on user intent
 * Enhanced with comprehensive keyword detection and word boundary matching
 */

/**
 * Route user query to appropriate specialized agent
 * Uses word boundary matching for precise keyword detection
 * Boosts confidence based on number of matched keywords
 */
static routeQuery(message: string, context?: any): AgentRoutingResult
```

**TODO Format:**

```typescript
// TODO: Implement with Drizzle when table is added
// TODO: Migrate to Drizzle ORM once migration is complete
// TODO: Add retry logic with exponential backoff
```

## Module Design

### Exports

**Pattern:** Named exports preferred, selective default exports

```typescript
// lib/agents/index.ts
export { AgentRouter } from './agent-router'
export { agentRegistry, AgentRegistry } from './registry'
export { AGENT_IDS, type AgentId, normalizeAgentId } from './constants'

// lib/agents/registry.ts
export class AgentRegistry { ... }
export const agentRegistry = new AgentRegistry()
export { seoManagerConfig, marketingManagerConfig }  // Individual configs
```

### Registry Pattern

**Pattern:** Use registry pattern for extensible systems

```typescript
// lib/agents/registry.ts
export class AgentRegistry implements AgentRegistry {
  public agents: Map<string, AgentConfig>
  
  constructor() {
    this.agents = new Map()
    this.initializeAgents()
  }
  
  private initializeAgents() {
    this.agents.set(seoManagerConfig.id, seoManagerConfig)
    this.agents.set(marketingManagerConfig.id, marketingManagerConfig)
    // ...
  }
  
  public getAgent(id: string): AgentConfig | null
  public getAgentsByCategory(category: string): AgentConfig[]
}

// Singleton export
export const agentRegistry = new AgentRegistry()
```

## Zod Schema Validation

**Pattern:** All external data validated with Zod

```typescript
import { z } from 'zod'

const AgentRoutingSchema = z.object({
  agent: z.enum(['onboarding', 'seo-aeo', 'content', 'general']),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  tools: z.array(z.string()),
  matchedKeywords: z.array(z.string()).optional(),
})

type AgentRoutingResult = z.infer<typeof AgentRoutingSchema>
```

---

*Convention analysis: 2026-02-24*
