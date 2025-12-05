import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { clientEnv } from '@/lib/config/env'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const res = NextResponse.redirect(`${origin}${next}`)

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

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const errUrl = new URL(`${origin}/login`)
    errUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(errUrl)
  }

  return res
}
