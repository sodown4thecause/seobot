'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BarChart3,
  Link2,
  FileText,
  Settings,
  Sparkles,
  Menu,
  X,
  Search,
  HelpCircle,
  Heart,
  BookOpen,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { AIChatInterface } from '@/components/chat/ai-chat-interface'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'

const menuItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Search', href: '/dashboard/search', icon: Search },
  { name: 'About Platform', href: '/dashboard/about', icon: Sparkles },
]

const projectItems = [
  { name: 'Create new project', href: '/dashboard/content/create', icon: Plus },
  { name: 'Favorites', href: '/dashboard/favorites', icon: Heart },
  { name: 'Library', href: '/dashboard/articles', icon: BookOpen },
]

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Keyword Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Link Building Strategies', href: '/dashboard/link-building', icon: Link2 },
  { name: 'Articles', href: '/dashboard/articles', icon: FileText },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // If we're on a page that should show chat as main content, render differently
  const isChatPage = pathname === '/dashboard' || pathname === '/dashboard/chat'
  const currentNav = navigation.find(item => item.href === pathname) || navigation[0]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%', width: sidebarCollapsed ? '80px' : '256px' }}
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-card/80 backdrop-blur-xl border-r border-border/50",
          "lg:translate-x-0 lg:static lg:z-0",
          "transition-all duration-300 flex flex-col shadow-xl"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-border/50">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-foreground">SEO Platform</span>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-muted/50 rounded"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Menu Section */}
        <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Menu
              </h3>
            )}
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      "backdrop-blur-sm",
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Projects Section */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Projects
              </h3>
            )}
            <nav className="space-y-1">
              {projectItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      "backdrop-blur-sm",
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Main Navigation - Dashboard, Analytics, Link Building, Articles */}
          <div>
            {!sidebarCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                Navigation
              </h3>
            )}
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                      "backdrop-blur-sm",
                      isActive
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                    title={sidebarCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Settings & Help */}
          <div className="pt-4 border-t border-border/50">
            <nav className="space-y-1">
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors backdrop-blur-sm",
                  pathname === '/dashboard/settings'
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={sidebarCollapsed ? 'Settings' : undefined}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
              </Link>
              <Link
                href="/dashboard/help"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors backdrop-blur-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                title={sidebarCollapsed ? 'Help center' : undefined}
              >
                <HelpCircle className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">Help center</span>}
              </Link>
            </nav>
          </div>
        </div>

        {/* User Profile Section at Bottom */}
        <div className="px-4 py-4 border-t border-border/50">
          <Card className="p-3 bg-muted/30 backdrop-blur-sm border-border/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">U</span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">User Account</p>
                  <p className="text-xs text-muted-foreground truncate">user@example.com</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </motion.aside>

      {/* Main Content Area - Chat Front and Center */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top Bar - Only show if not on main chat page */}
        {!isChatPage && (
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
            <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-muted/50 rounded-lg"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
              <div className="flex-1 lg:flex-none">
                <h1 className="text-xl font-bold text-foreground">
                  {currentNav.name}
                </h1>
              </div>
            </div>
          </header>
        )}

        {/* Main Content - Chat Interface */}
        {isChatPage ? (
          <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-950/20 via-background to-background pointer-events-none" />
            
            {/* Chat Interface - Full Screen */}
            <div className="relative flex-1 flex flex-col min-h-0">
              <AIChatInterface
                context={{ page: pathname }}
                placeholder="Describe what needs to be created..."
                className="flex-1"
              />
            </div>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto bg-background/50 backdrop-blur-sm">
            {children}
          </main>
        )}
      </div>
    </div>
  )
}
