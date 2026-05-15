/**
 * Better Auth Client
 *
 * React client for Better Auth. Provides hooks like useSession()
 * and methods for sign in, sign up, sign out, etc.
 */

import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  plugins: [
    adminClient(),
  ],
})

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient