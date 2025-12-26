'use server'

/**
 * Auth Actions - Clerk Authentication Implementation
 * 
 * Server actions for authentication
 * Most auth is handled by Clerk components directly
 */

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/clerk'
import { auth } from '@clerk/nextjs/server'

type AuthState = {
  error?: string
  success?: string | boolean
  fields?: {
    email?: string
  }
}

/**
 * @deprecated Use Clerk SignUp component directly
 * Kept for backwards compatibility - redirects to signup page
 */
export async function signUp(_prevState: AuthState, _formData: FormData): Promise<AuthState> {
  redirect('/signup')
}

/**
 * @deprecated Use Clerk SignIn component directly
 * Kept for backwards compatibility - redirects to login page
 */
export async function signIn(_prevState: AuthState, _formData: FormData): Promise<AuthState> {
  redirect('/login')
}

/**
 * Sign out the current user
 * Note: For full sign out, use useClerk().signOut() on the client side
 * This server action just redirects to login
 */
export async function signOut() {
  redirect('/login')
}

/**
 * Get the current session
 */
export async function getSession() {
  const user = await getCurrentUser()
  return user ? { user } : null
}

/**
 * Get the current authenticated user
 */
export { getCurrentUser }

/**
 * Require authentication - redirects to login if not authenticated
 */
export async function requireAuth() {
  const { userId } = await auth()
  if (!userId) {
    redirect('/login')
  }
  return userId
}
