import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { checkSubscription } from './lib/billing/subscription-guard'

const isDev = process.env.NODE_ENV === 'development'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/.well-known(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/studio(.*)',         // Sanity Studio (has its own auth)
  '/api/webhooks(.*)',
  '/api/audit(.*)',      // AEO audit API (free lead magnet)
  '/api/analytics/audit(.*)', // Audit analytics tracking
  '/audit(.*)',          // Audit page
  '/aeo-auditor(.*)',    // AEO auditor page (linked from guides)
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

// Routes that require subscription (in addition to auth)
const isDashboardRoute = createRouteMatcher([
  '/dashboard(.*)',
])

// Routes exempt from subscription checks (even if authenticated)
const isSubscriptionExemptRoute = createRouteMatcher([
  '/api/webhooks(.*)',
  '/billing(.*)',
  '/prices(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
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
  if (userId && (
    url.pathname.startsWith('/sign-in') || 
    url.pathname.startsWith('/sign-up') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/signup')
  )) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request)) {
    await auth.protect()
  }

  // Subscription check for dashboard routes
  // Note: Full subscription verification happens in page/API layer for DB access
  // This middleware layer ensures we redirect early for UX purposes
  if (userId && isDashboardRoute(request) && !isSubscriptionExemptRoute(request)) {
    const subscription = await checkSubscription(userId)
    if (!subscription.hasSubscription) {
      console.log(`[Middleware] Redirecting user to prices (status: ${subscription.status})`)
      return NextResponse.redirect(new URL('/prices?requires_subscription=1', request.url))
    }
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
