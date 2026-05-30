/**
 * Better Auth Configuration
 *
 * Replaces Clerk as the authentication provider.
 * Uses Drizzle adapter with Neon PostgreSQL.
 * Supports email/password auth with bcrypt (for Clerk migration compatibility),
 * social OAuth providers, and admin plugin.
 */

import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'
import { nextCookies } from 'better-auth/next-js'
import bcrypt from 'bcrypt'
import { db } from '@/lib/db'
import * as authSchema from '@/lib/auth-schema'

const configuredAuthURL = process.env.BETTER_AUTH_URL
const publicAppURL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL
const vercelURL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
const configuredAuthURLIsLocal =
  configuredAuthURL?.includes('localhost') || configuredAuthURL?.includes('127.0.0.1')
const authFallbackURL =
  process.env.NODE_ENV === 'production' && configuredAuthURLIsLocal
    ? publicAppURL || vercelURL || 'https://flowintent.com'
    : configuredAuthURL || publicAppURL || vercelURL || 'http://localhost:3000'

function hostnameFromURL(url: string | undefined) {
  if (!url) return undefined

  try {
    return new URL(url).hostname
  } catch {
    return undefined
  }
}

const allowedHosts = Array.from(
  new Set([
    'flowintent.com',
    'www.flowintent.com',
    '*.vercel.app',
    'localhost:*',
    '127.0.0.1:*',
    hostnameFromURL(publicAppURL),
    hostnameFromURL(vercelURL),
    !configuredAuthURLIsLocal ? hostnameFromURL(configuredAuthURL) : undefined,
  ].filter((host): host is string => Boolean(host))),
)

const authBaseURL = {
  allowedHosts,
  protocol: 'auto' as const,
  fallback: authFallbackURL,
}

const trustedOrigins = Array.from(
  new Set([
    authFallbackURL,
    publicAppURL || 'https://flowintent.com',
    vercelURL,
    'https://flowintent.com',
    'https://www.flowintent.com',
    'https://*.vercel.app',
    'http://localhost:*',
    'http://127.0.0.1:*',
  ].filter((origin): origin is string => Boolean(origin)),
))

export const auth = betterAuth({
  baseURL: authBaseURL,

  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),

  emailAndPassword: {
    enabled: true,
    password: {
      hash: async (password: string) => {
        return await bcrypt.hash(password, 10)
      },
      verify: async ({ hash, password }: { hash: string; password: string }) => {
        return await bcrypt.compare(password, hash)
      },
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  user: {
    modelName: 'user',
    additionalFields: {
      clerkId: {
        type: 'string',
        required: false,
        input: false,
      },
      subscriptionStatus: {
        type: 'string',
        required: false,
        defaultValue: 'inactive',
        input: false,
      },
    },
  },

  session: {
    modelName: 'session',
  },

  account: {
    modelName: 'account',
  },

  verification: {
    modelName: 'verification',
  },

  plugins: [
    admin(),
    nextCookies(),
  ],

  trustedOrigins,
})

export type Auth = typeof auth
