'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, Target, BookOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { FreshnessIndicator } from '@/components/dashboard/freshness-indicator'

interface ProgressWidgetsProps {
  campaignProgress?: {
    active: number
    completed: number
    total: number
  }
  rankingProgress?: {
    keywordsTracked: number
    averagePosition: number
    top10Count: number
  }
  learningProgress?: {
    tutorialsCompleted: number
    totalTutorials: number
    currentTutorial?: string
  }
  lastUpdated?: Date | string
}

export function ProgressWidgets({
  campaignProgress,
  rankingProgress,
  learningProgress,
  lastUpdated,
}: ProgressWidgetsProps) {
  const freshnessDate = React.useMemo(() => {
    if (!lastUpdated) {
      return undefined
    }

    const parsed = typeof lastUpdated === 'string' ? new Date(lastUpdated) : lastUpdated
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }, [lastUpdated])

  const campaignCompletion = React.useMemo(() => {
    if (!campaignProgress || campaignProgress.total <= 0) return null
    return (campaignProgress.completed / campaignProgress.total) * 100
  }, [campaignProgress])

  const learningCompletion = React.useMemo(() => {
    if (!learningProgress || learningProgress.totalTutorials <= 0) return null
    return (learningProgress.tutorialsCompleted / learningProgress.totalTutorials) * 100
  }, [learningProgress])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Active Campaigns */}
      {campaignProgress && (
        <Card className="glass-card border-none bg-black/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                <Target className="w-4 h-4 text-zinc-400" />
                Active Campaigns
              </CardTitle>
              {freshnessDate ? <FreshnessIndicator lastUpdated={freshnessDate} /> : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-zinc-100">{campaignProgress.active}</span>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700">Active</Badge>
              </div>
              <div className="text-sm text-zinc-500">
                {campaignProgress.completed} completed
              </div>
              {campaignCompletion !== null && (
                <Progress
                  value={campaignCompletion}
                  className="h-1.5 bg-zinc-800"
                  indicatorClassName="bg-zinc-400"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking Progress */}
      {rankingProgress && (
        <Card className="glass-card border-none bg-black/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                <TrendingUp className="w-4 h-4 text-zinc-400" />
                Ranking Progress
              </CardTitle>
              {freshnessDate ? <FreshnessIndicator lastUpdated={freshnessDate} /> : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-zinc-100">{rankingProgress.keywordsTracked}</span>
                <span className="text-sm text-zinc-500">keywords</span>
              </div>
              <div className="text-sm text-zinc-500">
                Avg position: <span className="font-semibold text-zinc-300">{rankingProgress.averagePosition.toFixed(1)}</span>
              </div>
              <div className="text-sm text-emerald-400/80">
                {rankingProgress.top10Count} in top 10
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Progress */}
      {learningProgress && (
        <Card className="glass-card border-none bg-black/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-zinc-200">
                <BookOpen className="w-4 h-4 text-zinc-400" />
                Learning Progress
              </CardTitle>
              {freshnessDate ? <FreshnessIndicator lastUpdated={freshnessDate} /> : null}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-zinc-100">{learningProgress.tutorialsCompleted}</span>
                <span className="text-sm text-zinc-500">
                  / {learningProgress.totalTutorials}
                </span>
              </div>
              {learningProgress.currentTutorial && (
                <div className="text-sm text-zinc-400">
                  Current: {learningProgress.currentTutorial}
                </div>
              )}
              {learningCompletion !== null && (
                <Progress
                  value={learningCompletion}
                  className="h-1.5 bg-zinc-800"
                  indicatorClassName="bg-zinc-400"
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
