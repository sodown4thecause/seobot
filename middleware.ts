import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/studio(.*)',         // Sanity Studio (has its own auth)
  '/api/webhooks(.*)',
  '/api/audit(.*)',      // AEO audit API (free lead magnet)
  '/api/analytics/audit(.*)', // Audit analytics tracking
  '/audit(.*)',          // Audit page
  '/blog(.*)',
  '/docs(.*)',
  '/guides(.*)',
  '/case-studies(.*)',
  '/resources(.*)',
  '/prices(.*)',
  '/pricing(.*)',
  '/faq(.*)',
  '/contact(.*)',
  '/privacy(.*)',
  '/terms(.*)',
  '/login(.*)',
  '/signup(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  const url = request.nextUrl

  // DEV MODE: Skip all auth checks but still allow ClerkProvider to work
  if (isDev) {
    // Just handle basic redirects, no auth
    if (url.pathname === '/chat') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  const { userId } = await auth()

  // Redirect /chat to /dashboard (fix broken redirect)
  if (url.pathname === '/chat') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (userId && (url.pathname.startsWith('/sign-in') || url.pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
