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
import { eq } from 'drizzle-orm'

function toOrigin(url: string): string | null {
  try {
    return new URL(url).origin
  } catch {
    return null
  }
}

function getLoopbackAliases(origin: string): string[] {
  try {
    const url = new URL(origin)
    const port = url.port ? `:${url.port}` : ''
    const aliases = [origin]

    if (url.hostname === 'localhost') {
      aliases.push(`${url.protocol}//127.0.0.1${port}`)
    } else if (url.hostname === '127.0.0.1') {
      aliases.push(`${url.protocol}//localhost${port}`)
    }

    return aliases
  } catch {
    return [origin]
  }
}

function getTrustedOrigins() {
  const origins = new Set<string>()
  const candidates = [
    process.env.BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined,
    process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3000' : undefined,
  ]

  for (const candidate of candidates) {
    if (!candidate) continue

    const origin = toOrigin(candidate) ?? candidate
    for (const alias of getLoopbackAliases(origin)) {
      origins.add(alias)
    }
  }

  return Array.from(origins)
}

function getSocialProviders() {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return {}
  }

  return {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  }
}

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

  const [existingByAuthId] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.betterAuthId, authUser.id))
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

  if (existingByAuthId) {
    await db.update(users).set(userValues).where(eq(users.id, existingByAuthId.id))
    return
  }

  const existingByEmail = await db
    .select({ id: users.id, betterAuthId: users.betterAuthId })
    .from(users)
    .where(eq(users.email, email))
    .limit(2)

  if (existingByEmail.length > 1) {
    throw new Error(`Cannot link Better Auth user ${authUser.id}: multiple app users found for ${email}`)
  }

  if (existingByEmail[0]) {
    if (existingByEmail[0].betterAuthId && existingByEmail[0].betterAuthId !== authUser.id) {
      throw new Error(`Cannot link Better Auth user ${authUser.id}: ${email} is already linked to another auth user`)
    }

    await db.update(users).set(userValues).where(eq(users.id, existingByEmail[0].id))
    return
  }

  await db.insert(users).values(userValues)
}

async function ensureApplicationUserByAuthId(authUserId: string) {
  const [authUser] = await db
    .select({
      id: authSchema.user.id,
      email: authSchema.user.email,
      name: authSchema.user.name,
      image: authSchema.user.image,
    })
    .from(authSchema.user)
    .where(eq(authSchema.user.id, authUserId))
    .limit(1)

  if (!authUser) {
    throw new Error(`Cannot sync app user row: auth user ${authUserId} was not found`)
  }

  await ensureApplicationUser(authUser)
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

  socialProviders: getSocialProviders(),

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
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      // Link Google only to local accounts whose email ownership has already been verified.
      requireLocalEmailVerified: true,
    },
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
            throw error
          }
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          try {
            await ensureApplicationUserByAuthId(session.userId)
          } catch (error) {
            console.error('[Better Auth] Failed to repair app user row after sign-in', error)
            throw error
          }
        },
      },
    },
  },

  plugins: [
    admin(),
    nextCookies(),
  ],

  trustedOrigins: getTrustedOrigins(),
})

export type Auth = typeof auth
