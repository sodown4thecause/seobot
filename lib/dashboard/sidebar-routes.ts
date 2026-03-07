function matchesDashboardRoute(pathname: string | null, route: string): boolean {
  return pathname === route || pathname?.startsWith(`${route}/`) === true
}

export function isContentDashboardRoute(pathname: string | null): boolean {
  return (
    matchesDashboardRoute(pathname, '/dashboard/content') ||
    matchesDashboardRoute(pathname, '/dashboard/content-zone')
  )
}

export function isImageDashboardRoute(pathname: string | null): boolean {
  return (
    matchesDashboardRoute(pathname, '/dashboard/image') ||
    matchesDashboardRoute(pathname, '/dashboard/images')
  )
}
