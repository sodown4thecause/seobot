#!/usr/bin/env tsx

import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

export type EnvValidationMode = 'local' | 'production'

export interface EnvValidationResult {
  errors: string[]
  warnings: string[]
}

const requiredProductionVariables = [
  'DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL', 'NEXT_PUBLIC_SITE_URL',
  'CRON_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'POLAR_ACCESS_TOKEN', 'POLAR_PRODUCT_ID', 'POLAR_WEBHOOK_SECRET',
  'DATAFORSEO_USERNAME', 'DATAFORSEO_PASSWORD',
] as const

const modelVariables = [
  'AI_GATEWAY_API_KEY', 'OPENAI_API_KEY', 'GOOGLE_API_KEY', 'ANTHROPIC_API_KEY',
  'DEEPSEEK_API_KEY', 'XAI_API_KEY', 'PERPLEXITY_API_KEY',
] as const

const urlVariables = [
  'DATABASE_URL', 'DATABASE_AUTHENTICATED_URL', 'BETTER_AUTH_URL',
  'NEXT_PUBLIC_BETTER_AUTH_URL', 'NEXT_PUBLIC_SITE_URL', 'AI_GATEWAY_BASE_URL',
  'DATAFORSEO_MCP_URL', 'AISA_BASE_URL', 'N8N_BACKLINKS_WEBHOOK_URL',
  'LANGFUSE_BASEURL', 'LANGFUSE_BASE_URL', 'LANGFUSE_ALERT_WEBHOOK_URL',
  'LANGWATCH_BASE_URL', 'WINSTON_MCP_URL', 'FIRECRAWL_MCP_URL', 'JINA_MCP_URL',
  'DEEPWIKI_MCP_URL', 'UPSTASH_REDIS_REST_URL', 'ELMO_API_URL', 'GEO_API_URL',
  'NEXT_PUBLIC_POSTHOG_HOST', 'POLAR_SUCCESS_URL', 'POLAR_RETURN_URL',
] as const

const nonEmptyVariables = [...requiredProductionVariables, ...modelVariables] as const

const placeholderHostnamePattern = /(?:^|[.-])(?:example|test|xxx|placeholder|your)(?:$|[.-])/i

const isPresent = (value: string | undefined): value is string =>
  typeof value === 'string' && value.trim().length > 0

const isPlaceholderUrl = (value: string): boolean => {
  try {
    const hostname = new URL(value).hostname.toLowerCase()
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' ||
      placeholderHostnamePattern.test(hostname) || hostname.includes('replaceme')
  } catch {
    return false
  }
}

const validateUrl = (name: string, value: string, mode: EnvValidationMode, errors: string[]) => {
  try {
    new URL(value)
  } catch {
    errors.push(`Invalid variable ${name}: must be a valid URL`)
    return
  }
  if (mode === 'production' && isPlaceholderUrl(value)) {
    errors.push(`Invalid variable ${name}: placeholder URLs are not allowed in production`)
  }
}

export function validateEnvironment(
  env: NodeJS.ProcessEnv,
  mode: EnvValidationMode,
): EnvValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (mode === 'production') {
    for (const name of requiredProductionVariables) {
      if (!isPresent(env[name])) errors.push(`Missing required variable: ${name}`)
    }
    if (!modelVariables.some((name) => isPresent(env[name]))) {
      errors.push(`Missing required variable: one of ${modelVariables.join('/')}`)
    }
  }

  if (mode === 'local') {
    for (const name of nonEmptyVariables) {
      if (Object.prototype.hasOwnProperty.call(env, name) && !isPresent(env[name])) {
        errors.push(`Invalid variable ${name}: must not be empty`)
      }
    }
  }

  for (const name of urlVariables) {
    const value = env[name]
    if (isPresent(value)) validateUrl(name, value, mode, errors)
  }

  return { errors, warnings }
}

function parseMode(argv: string[]): EnvValidationMode {
  const modeIndex = argv.indexOf('--mode')
  if (modeIndex === -1) return 'production'
  const mode = argv[modeIndex + 1]
  if (mode === 'local' || mode === 'production') return mode
  throw new Error('Usage: tsx scripts/validate-env.ts [--mode local|production]')
}

function runCli(): number {
  config({ path: resolve(process.cwd(), '.env.local') })
  config({ path: resolve(process.cwd(), '.env') })

  let mode: EnvValidationMode
  try {
    mode = parseMode(process.argv.slice(2))
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Invalid validation mode')
    return 1
  }

  const result = validateEnvironment(process.env, mode)
  if (result.errors.length > 0) {
    console.error(`Environment validation failed (${mode}):`)
    for (const error of result.errors) console.error(`- ${error}`)
    return 1
  }
  console.log(`Environment validation passed (${mode})`)
  return 0
}

const entrypoint = process.argv[1]
if (entrypoint && resolve(entrypoint) === resolve(fileURLToPath(import.meta.url))) {
  process.exitCode = runCli()
}
