/**
 * Better Auth Client
 *
 * React client for Better Auth. Provides hooks like useSession()
 * and methods for sign in, sign up, sign out, etc.
 */

import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'

const publicAuthBaseURL = process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL

export const authClient = createAuthClient({
  ...(publicAuthBaseURL ? { baseURL: publicAuthBaseURL } : {}),
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
