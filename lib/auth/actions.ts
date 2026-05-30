'use server'

/**
 * Auth Actions - Better Auth Implementation
 *
 * Server actions for authentication.
 * Most auth is handled by Better Auth client directly.
 */

import { redirect } from 'next/navigation'
import { getCurrentUser, getSession } from './index'
import { auth } from '@/lib/auth-config'
import { headers } from 'next/headers'

type AuthState = {
  error?: string
  success?: string | boolean
  fields?: {
    email?: string
  }
}

export async function signUp(_prevState: AuthState, _formData: FormData): Promise<AuthState> {
  redirect('/signup')
}

export async function signIn(_prevState: AuthState, _formData: FormData): Promise<AuthState> {
  redirect('/login')
}

export async function signOut() {
  await auth.api.signOut({
    headers: await headers(),
  })
  redirect('/login')
}

export { getCurrentUser, getSession }