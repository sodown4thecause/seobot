import 'server-only'
import { z } from 'zod'

/**
 * Server-side environment schema with validation
 * This module should only be imported in server-side code (API routes, server components, etc.)
 * The 'server-only' import ensures this module cannot be bundled in client-side code
 */

// Server-side environment schema
const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    .refine(
      (val) => val.startsWith('ey') || val.startsWith('sb-'),
      {
        message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY should start with "ey" or "sb-"',
      }
    ),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required')
    .refine(
      (val) => val.startsWith('ey') || val.startsWith('sb-'),
      {
        message: 'SUPABASE_SERVICE_ROLE_KEY should start with "ey" or "sb-"',
      }
    ),
  // Supabase Connection Pooling (optional - defaults to direct connection)
  // Use transaction mode pooler URL (port 6543) for connection pooling
  // Format: https://<project-ref>.supabase.co (pooler automatically uses port 6543)
  SUPABASE_POOLER_URL: z.string().url().optional(),
  
  // AI Provider Keys (Optional if using Gateway)
  OPENAI_API_KEY: z.string().min(1).optional(),
  GOOGLE_API_KEY: z.string().min(1).optional(),
  GOOGLE_GENERATIVE_AI_API_KEY: z.string().min(1).optional(),
  GOOGLE_CLOUD_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  XAI_API_KEY: z.string().min(1).optional(),
  
  // Vercel AI Gateway
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  AI_GATEWAY_BASE_URL: z.string().url().optional(),

  // External APIs
  DATAFORSEO_LOGIN: z.string().email({
    message: 'DATAFORSEO_LOGIN must be a valid email',
  }),
  DATAFORSEO_PASSWORD: z.string().min(1, 'DATAFORSEO_PASSWORD is required'),
  DATAFORSEO_MCP_URL: z.string().url().optional(),
  DATAFORSEO_BASIC_AUTH: z.string().optional(),
  PERPLEXITY_API_KEY: z.string().min(1, 'PERPLEXITY_API_KEY is required'),
  JINA_API_KEY: z.string().min(1, 'JINA_API_KEY is required'),
  APIFY_API_KEY: z.string().min(1).optional(),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),

  // Content Quality & Generation APIs
  WINSTON_AI_API_KEY: z.string().min(1, 'WINSTON_AI_API_KEY is required'),
  RYTR_API_KEY: z.string().min(1, 'RYTR_API_KEY is required'),

  // LangWatch / Langfuse (optional monitoring)
  LANGFUSE_ENABLED: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().min(1).optional(),
  LANGFUSE_PUBLIC_KEY: z.string().min(1).optional(),
  // Support both LANGFUSE_BASEURL and LANGFUSE_BASE_URL for compatibility
  LANGFUSE_BASEURL: z.string().url().optional(),
  LANGFUSE_BASE_URL: z.string().url().optional(),
  LANGFUSE_DEBUG: z.string().optional(),
  // LangWatch API key (can use Langfuse keys if LangWatch is not available)
  LANGWATCH_API_KEY: z.string().min(1).optional(),
  LANGWATCH_BASE_URL: z.string().url().optional(),

  // Feature flags / experimental toggles
  ENABLE_CODEMODE_PRIMARY: z.string().optional(),

  // MCP Server URLs
  WINSTON_MCP_URL: z.string().url().optional(),
  FIRECRAWL_MCP_URL: z.string().url().optional(),
  JINA_MCP_URL: z.string().url().optional(),
  
  // Redis (optional for caching)
  UPSTASH_REDIS_REST_URL: z.preprocess(
    (val) => (!val || val === 'your_redis_url') ? undefined : val,
    z.string().url().optional()
  ),
  UPSTASH_REDIS_REST_TOKEN: z.preprocess(
    (val) => (!val || val === 'your_redis_token') ? undefined : val,
    z.string().optional()
  ),

  // Cron & Security
  CRON_SECRET: z.string().min(1).optional(),

  // Site Configuration
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // Quality Thresholds (optional, with defaults)
  MIN_DATAFORSEO_SCORE: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(0).max(100).optional()
  ),
  MIN_EEAT_SCORE: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(0).max(100).optional()
  ),
  MIN_DEPTH_SCORE: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(0).max(100).optional()
  ),
  MIN_FACTUAL_SCORE: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(0).max(100).optional()
  ),
  MIN_OVERALL_SCORE: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(0).max(100).optional()
  ),
  MAX_REVISION_ROUNDS: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().int().min(1).max(10).optional()
  ),
}).passthrough() // Allow additional env vars not in schema

// Client-side environment schema (only public variables)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL',
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    .refine(
      (val) => val.startsWith('ey') || val.startsWith('sb-'),
      {
        message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY should start with "ey" or "sb-"',
      }
    ),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
})

/**
 * Parse and validate server environment variables
 * Parses process.env directly into the schema
 */
function getServerEnv() {
  try {
    return serverEnvSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .filter((e) => e.code === 'invalid_type' && e.received === 'undefined')
        .map((e) => e.path.join('.'))
        .join(', ')
      const invalidVars = error.errors
        .filter((e) => !(e.code === 'invalid_type' && e.received === 'undefined'))
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('\n  ')

      const errorMessage = [
        '❌ Environment variable validation failed',
        missingVars && `Missing required variables: ${missingVars}`,
        invalidVars && `Invalid variables:\n  ${invalidVars}`,
        '',
        'Please check your .env.local file and ensure all required variables are set.',
        'See .env.example for required variables.',
      ]
        .filter(Boolean)
        .join('\n')

      console.error('Environment validation errors:', error.errors)
      throw new Error(errorMessage)
    }
    throw error
  }
}

/**
 * Parse and validate client environment variables
 * Only includes NEXT_PUBLIC_* variables safe for client-side use
 */
function getClientEnv() {
  try {
    return clientEnvSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ')
      throw new Error(
        `Missing or invalid public environment variables: ${missingVars}\n` +
        'These variables are required for client-side functionality.'
      )
    }
    throw error
  }
}

// Parse environment variables at module load time
// This ensures validation happens immediately when the module is imported
export const serverEnv = getServerEnv()
export const clientEnv = getClientEnv()

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>

// Export schemas for validation scripts
export { serverEnvSchema, clientEnvSchema }
