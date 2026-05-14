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

export const auth = betterAuth({
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

  trustedOrigins: [
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    process.env.NEXT_PUBLIC_APP_URL || 'https://flowintent.com',
  ],
})

export type Auth = typeof auth