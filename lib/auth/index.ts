/**
 * Better Auth Server Utilities
 *
 * Shared Better Auth helpers for server routes and components.
 * Provides server-side auth helpers for API routes and server components.
 */

import { auth } from '@/lib/auth-config'
import { headers } from 'next/headers'

export type Session = typeof auth.$Infer.Session

export async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session?.user ?? null
}

export async function requireUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  return session.user
}

export async function getUserId(): Promise<string | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session?.user?.id ?? null
}

export async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user?.id) {
    throw new Error('Authentication required')
  }
  return session.user.id
}

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  })
}

export { auth } from '@/lib/auth-config'
