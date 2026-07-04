import { z } from 'zod'

const configSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEON_DATABASE_URL: z.string().url(),
  DATAFORSEO_LOGIN: z.string().min(1),
  DATAFORSEO_PASSWORD: z.string().min(1),
  TRACKED_BRAND: z.string().min(1),
  TRACKED_DOMAIN: z.string().min(1),
  TRACKED_KEYWORDS: z.string().default(''),
  SUGGESTIONS_MODEL: z.string().default('openai/gpt-4o-mini'),
  AI_GATEWAY_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  READ_API_PORT: z.coerce.number().int().positive().default(8787),
  ELMO_DATABASE_SCHEMA: z.string().default('public'),
  JOB_TIMEZONE: z.string().default('UTC'),
})

export type CompanionConfig = z.infer<typeof configSchema>

export function loadConfig(env: NodeJS.ProcessEnv = process.env): CompanionConfig {
  return configSchema.parse({
    DATABASE_URL: env.DATABASE_URL,
    NEON_DATABASE_URL: env.NEON_DATABASE_URL,
    DATAFORSEO_LOGIN: env.DATAFORSEO_LOGIN ?? env.DATAFORSEO_USERNAME,
    DATAFORSEO_PASSWORD: env.DATAFORSEO_PASSWORD,
    TRACKED_BRAND: env.TRACKED_BRAND,
    TRACKED_DOMAIN: env.TRACKED_DOMAIN,
    TRACKED_KEYWORDS: env.TRACKED_KEYWORDS,
    SUGGESTIONS_MODEL: env.SUGGESTIONS_MODEL,
    AI_GATEWAY_API_KEY: env.AI_GATEWAY_API_KEY,
    OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
    READ_API_PORT: env.READ_API_PORT,
    ELMO_DATABASE_SCHEMA: env.ELMO_DATABASE_SCHEMA,
    JOB_TIMEZONE: env.JOB_TIMEZONE,
  })
}

export function parseTrackedKeywords(raw: string, domain: string): Array<{ keyword: string, domain: string }> {
  return raw
    .split(',')
    .map(keyword => keyword.trim())
    .filter(Boolean)
    .map(keyword => ({ keyword, domain }))
}
