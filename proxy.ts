import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const publicRoutes = [
  '/',
  '/robots.txt',
  '/sitemap.xml',
  '/.well-known(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/studio(.*)',
  '/api/webhooks(.*)',
  '/api/audit(.*)',
  '/api/analytics/audit(.*)',
  '/api/auth(.*)',
  '/api/cron(.*)',
  '/api/inngest(.*)',
  '/api/rag/ingest(.*)',
  '/api/reddit-gap(.*)',
  '/audit(.*)',
  '/aeo-auditor(.*)',
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
  '/reddit-gap(.*)',
]

function isPublicRoute(pathname: string) {
  return publicRoutes.some((route) => {
    if (route.endsWith('(.*)')) {
      return pathname.startsWith(route.replace('(.*)', ''))
    }
    return pathname === route
  })
}

export default async function proxy(request: NextRequest) {
  const url = request.nextUrl

  if (url.pathname === '/chat') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // This is only a lightweight route gate. Protected handlers and pages must
  // still validate the database-backed Better Auth session themselves.
  const sessionCookie = getSessionCookie(request)

  if (
    sessionCookie &&
    (url.pathname.startsWith('/sign-in') ||
      url.pathname.startsWith('/sign-up') ||
      url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/signup'))
  ) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  if (!sessionCookie && !isPublicRoute(url.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
