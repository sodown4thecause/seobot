"use client"

import * as React from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Link as LinkIcon,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  FileText,
} from 'lucide-react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

export interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  currentPath: string
}

const DASHBOARD_LINKS = [
  { name: 'Website Audit', href: '/dashboard/website-audit', icon: Search },
  { name: 'Rank Tracker', href: '/dashboard/rank-tracker', icon: TrendingUp },
  { name: 'Competitor Monitor', href: '/dashboard/competitor-monitor', icon: Users },
  { name: 'Keyword Opportunities', href: '/dashboard/keyword-opportunities', icon: KeyRound },
  { name: 'Backlink Profile', href: '/dashboard/backlink-profile', icon: LinkIcon },
  { name: 'Content Performance', href: '/dashboard/content-performance', icon: FileText },
  { name: 'AEO Insights', href: '/dashboard/aeo-insights', icon: Sparkles },
] as const

export function Sidebar({ collapsed, onToggle, currentPath }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const resolvedPath = pathname ?? currentPath

  const renderLinks = (compact = false) => (
    <nav className="space-y-1">
      {DASHBOARD_LINKS.map((item) => {
        const Icon = item.icon
        const isActive = resolvedPath === item.href || resolvedPath.startsWith(`${item.href}/`)

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white',
              compact && 'justify-center px-2'
            )}
            aria-current={isActive ? 'page' : undefined}
            title={compact ? item.name : undefined}
          >
            <Icon className={cn('h-4 w-4 shrink-0', !compact && 'mr-2')} />
            {!compact && <span>{item.name}</span>}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <>
      <Collapsible open={mobileOpen} onOpenChange={setMobileOpen} className="md:hidden">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed left-4 top-4 z-50 border-zinc-700 bg-zinc-900 text-zinc-100"
            aria-label="Toggle dashboard navigation"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="fixed inset-0 z-40 bg-zinc-950/95 p-4 pt-16 backdrop-blur-sm">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3">
            {renderLinks(false)}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <aside
        role="navigation"
        aria-label="Dashboard navigation"
        className={cn(
          'sticky top-0 z-30 hidden h-screen shrink-0 border-r border-zinc-800 bg-zinc-950/95 md:flex md:flex-col',
          collapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-4">
          {!collapsed && <p className="text-sm font-semibold text-zinc-100">Dashboards</p>}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="h-8 w-8 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <ScrollArea className="flex-1 px-2 py-3">{renderLinks(collapsed)}</ScrollArea>
      </aside>
    </>
  )
}
