'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, BookOpen, HelpCircle, FileText, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HelpSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentContext?: string
}

export function HelpSidebar({ isOpen, onClose, currentContext }: HelpSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const helpTopics = [
    { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
    { id: 'workflows', title: 'Workflows', icon: FileText },
    { id: 'ranking-campaign', title: 'Ranking Campaign', icon: FileText },
    { id: 'link-building', title: 'Link Building', icon: FileText },
    { id: 'technical-audit', title: 'Technical Audit', icon: FileText },
    { id: 'troubleshooting', title: 'Troubleshooting', icon: HelpCircle },
  ]

  const filteredTopics = helpTopics.filter((topic) =>
    topic.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-full w-80 bg-zinc-900 border-l border-zinc-800 z-50 transition-transform duration-300',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">Help & Documentation</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-zinc-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contextual Help */}
        {currentContext && (
          <div className="p-4 bg-blue-950/20 border-b border-zinc-800">
            <p className="text-sm text-zinc-400 mb-2">Current Context:</p>
            <p className="text-sm font-medium text-zinc-200">{currentContext}</p>
          </div>
        )}

        {/* Topics List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {filteredTopics.map((topic) => {
              const Icon = topic.icon
              return (
                <button
                  key={topic.id}
                  className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-zinc-800 transition-colors text-left"
                  onClick={() => {
                    // Navigate to help topic
                    window.open(`/docs/guides/${topic.id}.md`, '_blank')
                  }}
                >
                  <Icon className="h-5 w-5 text-zinc-400" />
                  <span className="text-sm text-zinc-200">{topic.title}</span>
                </button>
              )
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">Need more help?</p>
          <Button variant="outline" size="sm" className="w-full">
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  )
}

