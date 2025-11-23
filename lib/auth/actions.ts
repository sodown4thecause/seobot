'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

type AuthState = {
  error?: string
  success?: string | boolean
  fields?: {
    email?: string
  }
}

const credentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export async function signUp(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const parsed = credentialsSchema.safeParse({ email, password })
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid input'
    return { error: firstError, fields: { email } }
  }

  const supabase = await createClient()

  const hdrs = await headers()
  const origin = hdrs.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? ''
  const emailRedirectTo = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo
    }
  })

  if (error) {
    return { error: error.message, fields: { email } }
  }

  // If you have email-confirmation disabled, you may get a session immediately.
  if (data.session) {
    redirect('/dashboard')
  }

  // Otherwise prompt the user to check their email.
  return {
    success: 'Check your email to confirm your account. After confirmation, you will be redirected automatically.',
    fields: { email }
  }
}

export async function signIn(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')

  const parsed = credentialsSchema.safeParse({ email, password })
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? 'Invalid credentials'
    return { error: firstError, fields: { email } }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  })

  if (error) {
    return { error: error.message, fields: { email } }
  }

  redirect('/onboarding')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
