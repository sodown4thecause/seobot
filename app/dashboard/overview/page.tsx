'use client'

import { useMemo } from 'react'
import { RefreshCw } from 'lucide-react'
import { ProgressWidgets } from '@/components/dashboard/progress-widgets'
import { PendingActions } from '@/components/dashboard/pending-actions'
import { AIInsightsCard, type AIInsight } from '@/components/dashboard/ai-insights-card'
import { LinkBuildingDashboard } from '@/components/dashboard/link-building-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardData } from '@/lib/cache/hooks/use-dashboard-data'
import type { ActionItem } from '@/types/actions'
import type { LinkCampaign } from '@/lib/link-building/types'

type OverviewSlice = {
  title: string
  description: string
  lastUpdated: string
}

type ProgressSlice = {
  campaignProgress: {
    active: number
    completed: number
    total: number
  }
  rankingProgress: {
    keywordsTracked: number
    averagePosition: number
    top10Count: number
  }
  learningProgress: {
    tutorialsCompleted: number
    totalTutorials: number
    currentTutorial?: string
  }
  lastUpdated: string
}

type ActionsSlice = {
  actions: ActionItem[]
  lastUpdated: string
}

type InsightsSlice = {
  insights: AIInsight[]
  lastUpdated: string
}

type LinkBuildingSlice = {
  campaigns: LinkCampaign[]
  lastUpdated: string
}

const FALLBACK_TIMESTAMP = new Date(Date.now() - 1000 * 60 * 90).toISOString()

const FALLBACK_OVERVIEW: OverviewSlice = {
  title: 'SEO Overview',
  description: 'Track freshness-aware SEO performance with partial data preserved during refresh.',
  lastUpdated: FALLBACK_TIMESTAMP,
}

const FALLBACK_PROGRESS: ProgressSlice = {
  campaignProgress: {
    active: 4,
    completed: 12,
    total: 18,
  },
  rankingProgress: {
    keywordsTracked: 126,
    averagePosition: 11.3,
    top10Count: 47,
  },
  learningProgress: {
    tutorialsCompleted: 9,
    totalTutorials: 14,
    currentTutorial: 'Structured Data Opportunities',
  },
  lastUpdated: FALLBACK_TIMESTAMP,
}

const FALLBACK_ACTIONS: ActionsSlice = {
  actions: [
    {
      id: 'overview-action-1',
      title: 'Update title tags on top landing pages',
      description: 'Refresh outdated title tags to improve CTR on high-impression queries.',
      category: 'content',
      priority: 'high',
      difficulty: 'beginner',
      impact: {
        description: 'Expected visibility lift for commercial pages.',
        metrics: {
          potentialTrafficGain: 300,
          rankingImprovement: '2-4 positions',
          timeToResults: '2-4 weeks',
        },
        confidence: 'high',
      },
      steps: [
        {
          id: 'overview-action-1-step-1',
          title: 'Prioritize pages',
          description: 'Select pages with high impressions and lower CTR.',
          instructions: ['Open rank data', 'Filter by high impressions', 'Sort by CTR ascending'],
          estimatedTime: '20 minutes',
        },
      ],
      estimatedTime: '45 minutes',
      timeToSeeResults: '2-4 weeks',
      automatable: true,
      automationTool: 'seo-agent',
      verification: {
        check: 'Track CTR trend over 14 days',
        expectedOutcome: 'CTR increases on edited pages',
        successMetrics: ['CTR +10%', 'Stable rankings'],
      },
      tags: ['ctr', 'metadata'],
      source: 'opportunity',
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending',
    },
  ],
  lastUpdated: FALLBACK_TIMESTAMP,
}

const FALLBACK_INSIGHTS: InsightsSlice = {
  insights: [
    {
      id: 'overview-insight-1',
      type: 'opportunity',
      title: 'Top-20 keywords are close to page-one',
      description: '23 keywords moved into positions 11-20 and can be pushed with on-page refreshes.',
      confidence: 'high',
    },
    {
      id: 'overview-insight-2',
      type: 'tip',
      title: 'Internal links can support declining pages',
      description: 'Add 2-3 contextual links from high-authority pages to recent decliners.',
      confidence: 'medium',
    },
  ],
  lastUpdated: FALLBACK_TIMESTAMP,
}

const FALLBACK_LINK_BUILDING: LinkBuildingSlice = {
  campaigns: [
    {
      id: 'overview-link-campaign-1',
      name: 'Q1 SaaS Authority Push',
      targetDomain: 'example.com',
      targetKeywords: ['seo dashboard', 'ai seo tools'],
      prospects: [
        {
          id: 'overview-prospect-1',
          domain: 'industryweekly.com',
          url: 'https://industryweekly.com/seo-tools-roundup',
          title: 'Best SEO Tools for Teams',
          domainAuthority: 71,
          relevanceScore: 87,
          topicMatch: ['seo', 'analytics'],
          opportunityType: 'resource_page',
          reason: 'Resource page frequently adds comparison tools.',
          contactEmail: 'editor@industryweekly.com',
          status: 'qualified',
          score: 84,
          discoveredAt: new Date(),
          lastUpdated: new Date(),
        },
      ],
      metrics: {
        totalProspects: 34,
        outreachSent: 11,
        responses: 5,
        linksEarned: 2,
        responseRate: 45.5,
        conversionRate: 18.2,
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  lastUpdated: FALLBACK_TIMESTAMP,
}

async function fetchDashboardSlice<T>(slice: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`/api/dashboard/${slice}`, {
      credentials: 'include',
      cache: 'no-store',
    })

    if (!response.ok) {
      return fallback
    }

    const payload = (await response.json()) as { data?: T }
    return payload.data ?? fallback
  } catch {
    return fallback
  }
}

function toDate(value: string | Date | undefined, fallback: Date): Date {
  if (!value) {
    return fallback
  }

  const parsed = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export default function OverviewPage() {
  const overviewQuery = useDashboardData<OverviewSlice>({
    queryKey: ['dashboard', 'overview'],
    dataType: 'overview',
    queryFn: () => fetchDashboardSlice('overview', FALLBACK_OVERVIEW),
    initialData: FALLBACK_OVERVIEW,
    refetchInterval: 1000 * 20,
  })

  const progressQuery = useDashboardData<ProgressSlice>({
    queryKey: ['dashboard', 'progress'],
    dataType: 'rankings',
    queryFn: () => fetchDashboardSlice('progress', FALLBACK_PROGRESS),
    initialData: FALLBACK_PROGRESS,
    refetchInterval: 1000 * 20,
  })

  const actionsQuery = useDashboardData<ActionsSlice>({
    queryKey: ['dashboard', 'actions'],
    dataType: 'audit',
    queryFn: () => fetchDashboardSlice('actions', FALLBACK_ACTIONS),
    initialData: FALLBACK_ACTIONS,
    refetchInterval: 1000 * 20,
  })

  const insightsQuery = useDashboardData<InsightsSlice>({
    queryKey: ['dashboard', 'insights'],
    dataType: 'competitor',
    queryFn: () => fetchDashboardSlice('insights', FALLBACK_INSIGHTS),
    initialData: FALLBACK_INSIGHTS,
    refetchInterval: 1000 * 20,
  })

  const linkBuildingQuery = useDashboardData<LinkBuildingSlice>({
    queryKey: ['dashboard', 'link-building'],
    dataType: 'backlinks',
    queryFn: () => fetchDashboardSlice('link-building', FALLBACK_LINK_BUILDING),
    initialData: FALLBACK_LINK_BUILDING,
    refetchInterval: 1000 * 20,
  })

  const isRefreshing =
    overviewQuery.isFetching ||
    progressQuery.isFetching ||
    actionsQuery.isFetching ||
    insightsQuery.isFetching ||
    linkBuildingQuery.isFetching

  const defaultDate = useMemo(() => new Date(FALLBACK_TIMESTAMP), [])

  const progressLastUpdated = toDate(progressQuery.data?.lastUpdated, defaultDate)
  const actionsLastUpdated = toDate(actionsQuery.data?.lastUpdated, defaultDate)
  const insightsLastUpdated = toDate(insightsQuery.data?.lastUpdated, defaultDate)
  const linkBuildingLastUpdated = toDate(linkBuildingQuery.data?.lastUpdated, defaultDate)

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none bg-black/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-zinc-100 text-2xl">{overviewQuery.data?.title ?? FALLBACK_OVERVIEW.title}</CardTitle>
          <CardDescription className="text-zinc-400">
            {overviewQuery.data?.description ?? FALLBACK_OVERVIEW.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
            {isRefreshing ? 'Refreshing dashboard data in background...' : 'Dashboard data is up to date.'}
          </div>
        </CardContent>
      </Card>

      <ProgressWidgets
        campaignProgress={progressQuery.data?.campaignProgress}
        rankingProgress={progressQuery.data?.rankingProgress}
        learningProgress={progressQuery.data?.learningProgress}
        lastUpdated={progressLastUpdated}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <PendingActions actions={actionsQuery.data?.actions ?? []} lastUpdated={actionsLastUpdated} />
        <AIInsightsCard insights={insightsQuery.data?.insights ?? []} lastUpdated={insightsLastUpdated} />
      </div>

      <LinkBuildingDashboard campaigns={linkBuildingQuery.data?.campaigns ?? []} lastUpdated={linkBuildingLastUpdated} />
    </div>
  )
}
