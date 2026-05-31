#!/usr/bin/env tsx
/**
 * Environment Variable Validation Script
 *
 * Validates environment variables against the Zod schema in lib/config/env.ts
 * This script is designed to be run in CI/CD pipelines to catch missing or invalid
 * environment variables before deployment.
 *
 * Usage:
 *   tsx scripts/validate-env.ts
 *   npm run validate:env
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { z } from 'zod'

// Load environment variables from .env.local and .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

// Import schemas directly to avoid server-only check in validation script
// These match the schemas in lib/config/env.ts
const serverEnvSchema = z.object({
  // Database (Neon)
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }).optional(),

  // Authentication (Better Auth)
  BETTER_AUTH_SECRET: z.string().min(1).optional(),
  BETTER_AUTH_URL: z.string().url().optional(),

  // DataForSEO
  DATAFORSEO_USERNAME: z.string().min(1).optional(),
  DATAFORSEO_PASSWORD: z.string().min(1).optional(),
}).passthrough()

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
}).passthrough()

// Parse process.env directly (same as env.ts does)
function validateEnv() {
  console.log('🔍 Validating environment variables...\n')

  const errors: string[] = []
  const warnings: string[] = []

  // Validate server environment
  try {
    const serverResult = serverEnvSchema.safeParse(process.env)

    if (!serverResult.success) {
      console.error('❌ Server environment validation failed:\n')
      serverResult.error.errors.forEach((error: z.ZodIssue) => {
        const path = error.path.join('.')
        const message = error.message
        const code = error.code

        // Missing required fields show up as 'too_small' with min: 1
        if (code === 'too_small' && error.minimum === 1) {
          errors.push(`Missing required variable: ${path}`)
          console.error(`  ✗ Missing: ${path}`)
        } else {
          errors.push(`Invalid variable ${path}: ${message}`)
          console.error(`  ✗ Invalid: ${path} - ${message}`)
        }
      })
    } else {
      console.log('✅ Server environment variables validated successfully')
    }
  } catch (error) {
    errors.push(`Server validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error('❌ Server validation threw an error:', error)
  }

  // Validate client environment
  try {
    const clientResult = clientEnvSchema.safeParse(process.env)

    if (!clientResult.success) {
      console.error('\n❌ Client environment validation failed:\n')
      clientResult.error.errors.forEach((error: z.ZodIssue) => {
        const path = error.path.join('.')
        const message = error.message

        // Missing required fields show up as 'too_small' with min: 1
        if (error.code === 'too_small' && error.minimum === 1) {
          errors.push(`Missing required public variable: ${path}`)
          console.error(`  ✗ Missing: ${path}`)
        } else {
          errors.push(`Invalid public variable ${path}: ${message}`)
          console.error(`  ✗ Invalid: ${path} - ${message}`)
        }
      })
    } else {
      console.log('✅ Client environment variables validated successfully')
    }
  } catch (error) {
    errors.push(`Client validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    console.error('❌ Client validation threw an error:', error)
  }

  // Check for common issues
  const publicVars = Object.keys(process.env).filter(key => key.startsWith('NEXT_PUBLIC_'))
  const serverOnlyVars = Object.keys(process.env).filter(key =>
    !key.startsWith('NEXT_PUBLIC_') &&
    (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD'))
  )

  // Warn about potential security issues
  if (serverOnlyVars.some(key => process.env[key] && process.env[key]!.length < 8)) {
    warnings.push('Some API keys or secrets appear to be too short (less than 8 characters)')
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  if (errors.length > 0) {
    console.error(`\n❌ Validation failed with ${errors.length} error(s)`)
    console.error('\nErrors:')
    errors.forEach((error, index) => {
      console.error(`  ${index + 1}. ${error}`)
    })

    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:')
      warnings.forEach((warning, index) => {
        console.warn(`  ${index + 1}. ${warning}`)
      })
    }

    console.error('\n💡 Tip: Check your .env.local file and ensure all required variables are set.')
    console.error('   See .env.example for a list of required variables.\n')
    process.exit(1)
  } else {
    console.log(`\n✅ All environment variables validated successfully!`)

    if (warnings.length > 0) {
      console.warn('\n⚠️  Warnings:')
      warnings.forEach((warning, index) => {
        console.warn(`  ${index + 1}. ${warning}`)
      })
    }

    console.log(`\n📊 Summary:`)
    console.log(`   - Public variables: ${publicVars.length}`)
    console.log(`   - Server-only variables: ${serverOnlyVars.length}`)
    console.log(`   - Total validated: ${publicVars.length + serverOnlyVars.length}\n`)
    process.exit(0)
  }
}

// Run validation
validateEnv()

