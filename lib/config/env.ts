import { z } from 'zod'

// Server-side environment schema
const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  
  // AI Providers
  GOOGLE_API_KEY: z.string().min(1),
  XAI_API_KEY: z.string().min(1).optional(), // Optional, kept for backward compatibility
  OPENAI_API_KEY: z.string().min(1), // Required for chat interface

  // External APIs
  DATAFORSEO_LOGIN: z.string().email(),
  DATAFORSEO_PASSWORD: z.string().min(1),
  DATAFORSEO_MCP_URL: z.string().url().optional(), // MCP server URL (defaults to http://localhost:3000/mcp)
  DATAFORSEO_BASIC_AUTH: z.string().optional(), // Pre-encoded Basic Auth header
  PERPLEXITY_API_KEY: z.string().min(1),
  JINA_API_KEY: z.string().min(1),
  APIFY_API_KEY: z.string().min(1).optional(),
  FIRECRAWL_API_KEY: z.string().min(1).optional(),

  // Content Quality & Generation APIs
  WINSTON_AI_API_KEY: z.string().min(1),
  RYTR_API_KEY: z.string().min(1),

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
})

// Client-side environment schema (only public variables)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

// Parse and validate server environment
function getServerEnv() {
  try {
    return serverEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
      XAI_API_KEY: process.env.XAI_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      DATAFORSEO_LOGIN: process.env.DATAFORSEO_LOGIN,
      DATAFORSEO_PASSWORD: process.env.DATAFORSEO_PASSWORD,
      DATAFORSEO_MCP_URL: process.env.DATAFORSEO_MCP_URL,
      DATAFORSEO_BASIC_AUTH: process.env.DATAFORSEO_BASIC_AUTH,
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
      JINA_API_KEY: process.env.JINA_API_KEY,
      APIFY_API_KEY: process.env.APIFY_API_KEY,
      FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY,
      WINSTON_AI_API_KEY: process.env.WINSTON_AI_API_KEY,
      RYTR_API_KEY: process.env.RYTR_API_KEY,
      // Feature flags / experimental toggles
      ENABLE_CODEMODE_PRIMARY: process.env.ENABLE_CODEMODE_PRIMARY,
      WINSTON_MCP_URL: process.env.WINSTON_MCP_URL,
      FIRECRAWL_MCP_URL: process.env.FIRECRAWL_MCP_URL,
      JINA_MCP_URL: process.env.JINA_MCP_URL,
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ')
      console.error('Environment validation errors:', error.errors)
      throw new Error(
        `Missing or invalid environment variables: ${missingVars}\n\n` +
        'Please check your .env.local file and ensure all required variables are set.\n' +
        'See .env.example for required variables.'
      )
    }
    throw error
  }
}

// Parse and validate client environment
function getClientEnv() {
  try {
    return clientEnvSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(e => e.path.join('.')).join(', ')
      throw new Error(`Missing public environment variables: ${missingVars}`)
    }
    throw error
  }
}

// Export typed environment objects
export const serverEnv = getServerEnv()
export const clientEnv = getClientEnv()

// Type exports
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
