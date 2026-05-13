import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface DashboardBreadcrumbsProps {
  currentPage: string
}

export function DashboardBreadcrumbs({ currentPage }: DashboardBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm text-zinc-400">
      <Link href="/dashboard" className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-zinc-100">
        <Home className="h-3.5 w-3.5" />
        <span>Flow Intent</span>
      </Link>
      {currentPage && currentPage !== 'Dashboard' && (
        <>
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
          <span className="font-medium text-zinc-300">{currentPage}</span>
        </>
      )}
    </nav>
  )
}
