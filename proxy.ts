import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

  const {
    data: { session }
  } = await supabase.auth.getSession()

  const url = req.nextUrl
  const pathname = url.pathname

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isProtected =
    pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')

  // Unauthenticated: block protected routes
  if (!session && isProtected) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (session && isAuthPage) {
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
