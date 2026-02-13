'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface QuickStartAction {
  title: string
  description: string
  workflow: string
  isInstant?: boolean
}

// Instant campaigns - featured at the top
const INSTANT_CAMPAIGNS: QuickStartAction[] = [
  {
    title: 'Rank for a Keyword',
    description: 'Publish-ready content optimized for your target keyword',
    workflow: 'instant-rank-keyword',
    isInstant: true
  },
  {
    title: 'Beat a Competitor',
    description: 'Analyze and outrank competitor URLs',
    workflow: 'instant-beat-competitor',
    isInstant: true
  },
  {
    title: 'Answer a Question',
    description: 'Get cited by AI search engines',
    workflow: 'instant-answer-question',
    isInstant: true
  }
]

const QUICK_START_ACTIONS: QuickStartAction[] = [
  {
    title: 'SEO Tools',
    description: 'Keyword analysis, content gaps & search volume',
    workflow: 'seo-tools',
  },
  {
    title: 'Create Ranking Content',
    description: 'Generate SEO-optimized content',
    workflow: 'complete-ranking-campaign',
  },
  {
    title: 'Audit My Website',
    description: 'Find and fix technical SEO issues',
    workflow: 'technical-seo-audit',
  },
  {
    title: 'Analyze Competitors',
    description: 'Competitive analysis and gap identification',
    workflow: 'competitor-analysis',
  },
  {
    title: 'Build Links',
    description: 'Link building opportunities and outreach',
    workflow: 'link-building-campaign',
  },
  {
    title: 'Rank on ChatGPT',
    description: 'Optimize for AI search engines',
    workflow: 'rank-on-chatgpt',
  }
]

interface QuickStartGridProps {
  onWorkflowSelect?: (workflowId: string) => void
}

export function QuickStartGrid({ onWorkflowSelect }: QuickStartGridProps) {
  const [activeWorkflow, setActiveWorkflow] = React.useState<string | null>(null)
  const resetTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current)
      }
    }
  }, [])

  const handleWorkflowClick = (workflowId: string) => {
    setActiveWorkflow(workflowId)
    if (onWorkflowSelect) {
      onWorkflowSelect(workflowId)
    }
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current)
    }
    resetTimerRef.current = setTimeout(() => setActiveWorkflow(null), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Instant Campaigns */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-2">Instant Campaigns</h2>
          <p className="text-sm text-zinc-400">Get started in minutes with pre-configured workflows</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INSTANT_CAMPAIGNS.map((action) => (
            <Card
              key={action.workflow}
              className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
              onClick={() => handleWorkflowClick(action.workflow)}
            >
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">{action.title}</CardTitle>
                <CardDescription className="text-zinc-400">{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                  disabled={activeWorkflow === action.workflow}
                >
                  {activeWorkflow === action.workflow ? 'Loading...' : 'Start Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Standard Workflows */}
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-zinc-100 mb-2">All Workflows</h2>
          <p className="text-sm text-zinc-400">Comprehensive SEO and content workflows</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_START_ACTIONS.map((action) => (
            <Card
              key={action.workflow}
              className="bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer"
              onClick={() => handleWorkflowClick(action.workflow)}
            >
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">{action.title}</CardTitle>
                <CardDescription className="text-zinc-400">{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                  disabled={activeWorkflow === action.workflow}
                >
                  {activeWorkflow === action.workflow ? 'Loading...' : 'Start'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}


