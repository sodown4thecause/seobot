import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { clientEnv } from '@/lib/config/env'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options)
          })
        }
      }
    }
  )

  // Use getUser() to validate the session and get user info
  // This is the recommended approach for middleware per Supabase docs
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError && authError.status !== 401) {
    console.warn('[Auth middleware] Failed to fetch Supabase user', authError.message)
  }

  const isAuthenticated = Boolean(user)
  const url = req.nextUrl
  const pathname = url.pathname

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')

  // Unauthenticated: block protected routes
  if (!isAuthenticated && isProtected) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }


  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
    '/auth/callback'
  ]
}
