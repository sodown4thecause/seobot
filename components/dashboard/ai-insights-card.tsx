'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react'

interface AIInsight {
  id: string
  type: 'opportunity' | 'warning' | 'tip' | 'trend'
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  confidence?: 'high' | 'medium' | 'low'
}

interface AIInsightsCardProps {
  insights: AIInsight[]
  maxDisplay?: number
}

export function AIInsightsCard({ insights, maxDisplay = 3 }: AIInsightsCardProps) {
  const displayedInsights = insights.slice(0, maxDisplay)

  const getIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case 'tip':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />
      case 'trend':
        return <TrendingUp className="w-5 h-5 text-blue-500" />
      default:
        return <Sparkles className="w-5 h-5" />
    }
  }

  const getBadgeVariant = (type: AIInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'default'
      case 'warning':
        return 'destructive'
      case 'tip':
        return 'secondary'
      case 'trend':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (displayedInsights.length === 0) {
    return null
  }

  return (
    <Card className="glass-card border-none bg-black/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-zinc-100">
          <Sparkles className="w-5 h-5 text-amber-400" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedInsights.map((insight) => (
          <div
            key={insight.id}
            className="p-4 rounded-lg border border-white/5 bg-black/20 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start gap-3">
              {getIcon(insight.type)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getBadgeVariant(insight.type)} className="text-[10px]">
                    {insight.type}
                  </Badge>
                  {insight.confidence && (
                    <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500">
                      {insight.confidence} confidence
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1 text-zinc-200">{insight.title}</h3>
                <p className="text-sm text-zinc-400 mb-3">
                  {insight.description}
                </p>
                {insight.action && (
                  <button
                    onClick={insight.action.onClick}
                    className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
                  >
                    {insight.action.label} →
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {insights.length > maxDisplay && (
          <button className="text-sm text-zinc-500 hover:text-zinc-300 w-full text-center py-2 transition-colors">
            View All {insights.length} Insights →
          </button>
        )}
      </CardContent>
    </Card>
  )
}

