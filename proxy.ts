import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
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
