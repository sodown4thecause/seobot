'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Search,
  FileText,
  Wrench,
  Users,
  Link2,
  Bot,
  ArrowRight
} from 'lucide-react'

interface QuickStartAction {
  title: string
  description: string
  workflow: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const QUICK_START_ACTIONS: QuickStartAction[] = [
  {
    title: 'SEO Tools',
    description: 'Keyword analysis, content gaps & AI search volume',
    workflow: 'seo-tools',
    icon: Search,
    color: 'text-blue-400'
  },
  {
    title: 'Create Ranking Content',
    description: 'Generate SEO-optimized content with images',
    workflow: 'complete-ranking-campaign',
    icon: FileText,
    color: 'text-green-400'
  },
  {
    title: 'Audit My Website',
    description: 'Find and fix SEO issues',
    workflow: 'technical-seo-audit',
    icon: Wrench,
    color: 'text-orange-400'
  },
  {
    title: 'Analyze Competitors',
    description: 'See what your competitors are doing',
    workflow: 'competitor-analysis',
    icon: Users,
    color: 'text-purple-400'
  },
  {
    title: 'Build Links',
    description: 'Find link opportunities and outreach',
    workflow: 'link-building-campaign',
    icon: Link2,
    color: 'text-pink-400'
  },
  {
    title: 'Rank on ChatGPT',
    description: 'Optimize for AI search engines',
    workflow: 'rank-on-chatgpt',
    icon: Bot,
    color: 'text-cyan-400'
  }
]

interface QuickStartGridProps {
  onWorkflowSelect?: (workflowId: string) => void
}

export function QuickStartGrid({ onWorkflowSelect }: QuickStartGridProps) {
  const [activeWorkflow, setActiveWorkflow] = React.useState<string | null>(null)

  const handleWorkflowClick = (workflowId: string) => {
    setActiveWorkflow(workflowId)
    if (onWorkflowSelect) {
      onWorkflowSelect(workflowId)
    }
    // Clear active state after animation
    setTimeout(() => setActiveWorkflow(null), 2000)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 text-zinc-100">Quick Start</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {QUICK_START_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <Card
              key={action.workflow}
              className={`glass-card hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group border-none ${activeWorkflow === action.workflow
                  ? 'bg-white/10 border-white/30 ring-2 ring-white/20'
                  : 'bg-zinc-800/50'
                }`}
              onClick={() => handleWorkflowClick(action.workflow)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-black/40 border border-white/5 ${action.color.replace('text-', 'text-opacity-80 text-')}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1 text-zinc-200 group-hover:text-white transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-zinc-500 mb-3 ml-0">
                      {action.description}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 group-hover:text-zinc-200 p-0 h-auto hover:bg-transparent"
                    >
                      {activeWorkflow === action.workflow ? (
                        <>
                          Loading...
                          <div className="w-4 h-4 ml-2 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        </>
                      ) : (
                        <>
                          Start
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

