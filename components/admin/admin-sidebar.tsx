'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Database,
  BarChart3,
  Upload,
  Settings,
  Home,
  FileText,
  Brain,
  Target,
  Search,
  Users,
  DollarSign,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/admin', icon: Home },
  { name: 'Usage Analytics', href: '/admin/usage', icon: DollarSign },
  { name: 'API Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Knowledge Base', href: '/admin/knowledge', icon: Database },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

const agents = [
  { name: 'SEO/AEO Manager', href: '/admin/knowledge/seo-aeo', icon: Target },
  { name: 'Content Strategist', href: '/admin/knowledge/content-strategist', icon: FileText },
  { name: 'Keyword Researcher', href: '/admin/knowledge/keyword-researcher', icon: Search },
  { name: 'Competitor Analyst', href: '/admin/knowledge/competitor-analyst', icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex w-64 flex-col bg-[#0f0f0f] border-r border-white/10">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <Brain className="h-6 w-6 text-white" />
        <span className="text-lg font-bold text-white">Admin Panel</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Agent Knowledge Bases */}
        <div className="pt-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Agent Knowledge Bases
            </h3>
          </div>
          <div className="space-y-1">
            {agents.map((agent) => {
              const isActive = pathname === agent.href
              return (
                <Link
                  key={agent.name}
                  href={agent.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <agent.icon className="h-4 w-4" />
                  {agent.name}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Back to Dashboard */}
      <div className="border-t border-white/10 p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <Home className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}

