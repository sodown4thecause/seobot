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
import { users } from '@/lib/db/schema'
import { eq, or } from 'drizzle-orm'

async function ensureApplicationUser(authUser: {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
}) {
  const email = authUser.email?.trim()
  if (!email) {
    console.warn('[Better Auth] Skipping app user sync because auth user has no email', { userId: authUser.id })
    return
  }

  const [firstName, ...lastNameParts] = (authUser.name || '').trim().split(/\s+/).filter(Boolean)
  const now = new Date()

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.betterAuthId, authUser.id), eq(users.email, email)))
    .limit(1)

  const userValues = {
    betterAuthId: authUser.id,
    email,
    firstName: firstName || null,
    lastName: lastNameParts.join(' ') || null,
    imageUrl: authUser.image || null,
    updatedAt: now,
    deletedAt: null,
  }

  if (existingUser) {
    await db.update(users).set(userValues).where(eq(users.id, existingUser.id))
    return
  }

  await db.insert(users).values(userValues)
}

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

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await ensureApplicationUser(user)
          } catch (error) {
            console.error('[Better Auth] Failed to sync app user row after signup', error)
          }
        },
      },
    },
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
