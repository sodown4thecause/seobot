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
]

function isPublicRoute(pathname: string): boolean {
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

  // Better Auth session validation depends on the Node runtime and database-backed auth config.
  // Keep middleware as a lightweight route gate; protected handlers/pages must validate the
  // session with getUserId(), requireUserId(), or auth.api.getSession() before returning data.
  const sessionCookie = getSessionCookie(request)

  if (sessionCookie && (
    url.pathname.startsWith('/sign-in') ||
    url.pathname.startsWith('/sign-up') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/signup')
  )) {
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
