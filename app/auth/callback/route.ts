import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const nextPath = searchParams.get('next') || '/onboarding'

  const redirectUrl = new URL(nextPath, req.url)
  const res = NextResponse.redirect(redirectUrl)

  if (!code) {
    // No code provided, just go to login
    return NextResponse.redirect(new URL('/login', req.url))
  }

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // Redirect to login with error message
    const errUrl = new URL('/login', req.url)
    errUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(errUrl)
  }

  return res
}
