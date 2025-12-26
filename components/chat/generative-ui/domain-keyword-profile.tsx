'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Search, 
  TrendingUp, 
  BarChart3, 
  Target, 
  AlertCircle,
  CheckCircle2,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DomainKeywordProfile, KeywordGap } from '@/lib/ai/domain-keyword-profiler'

export interface DomainKeywordProfileProps {
  profile: DomainKeywordProfile
  className?: string
}

export function DomainKeywordProfile({ profile, className }: DomainKeywordProfileProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getPositionColor = (position: number) => {
    if (position <= 3) return 'text-green-600 bg-green-50'
    if (position <= 10) return 'text-blue-600 bg-blue-50'
    if (position <= 20) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'transactional':
        return 'bg-purple-100 text-purple-700'
      case 'commercial':
        return 'bg-blue-100 text-blue-700'
      case 'navigational':
        return 'bg-green-100 text-green-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            Keyword Profile: {profile.domain}
          </CardTitle>
          <CardDescription>
            Comprehensive keyword analysis with {profile.totalKeywords} keywords tracked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{profile.totalKeywords}</div>
              <div className="text-sm text-gray-600 mt-1">Total Keywords</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{profile.positionDistribution.top10}</div>
              <div className="text-sm text-gray-600 mt-1">Top 10 Rankings</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(profile.trafficEstimation.total)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Est. Monthly Traffic</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(profile.trafficEstimation.top10)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Top 10 Traffic</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Position Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { label: 'Top 3', count: profile.positionDistribution.top3, color: 'bg-green-500' },
              { label: 'Top 10', count: profile.positionDistribution.top10, color: 'bg-blue-500' },
              { label: 'Top 20', count: profile.positionDistribution.top20, color: 'bg-yellow-500' },
              { label: 'Top 50', count: profile.positionDistribution.top50, color: 'bg-orange-500' },
              { label: 'Top 100', count: profile.positionDistribution.top100, color: 'bg-gray-500' },
            ].map(({ label, count, color }) => {
              const percentage = profile.totalKeywords > 0 
                ? (count / profile.totalKeywords) * 100 
                : 0
              return (
                <div key={label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">{label}</span>
                    <span className="text-gray-600">{count} keywords ({percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Keywords */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top Performing Keywords
          </CardTitle>
          <CardDescription>
            Keywords with highest estimated traffic potential
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Keyword</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Position</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Search Volume</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Est. Traffic</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Intent</th>
                </tr>
              </thead>
              <tbody>
                {profile.topKeywords.map((keyword, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{keyword.keyword}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs', getPositionColor(keyword.position))}
                      >
                        #{keyword.position}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {formatNumber(keyword.searchVolume)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">/mo</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-blue-600">
                        {formatNumber(keyword.estimatedTraffic || 0)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">/mo</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {keyword.intent && (
                        <Badge variant="outline" className={cn('text-xs', getIntentColor(keyword.intent))}>
                          <Target className="w-3 h-3 mr-1" />
                          {keyword.intent}
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Gaps */}
      {profile.keywordGaps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Keyword Gaps
            </CardTitle>
            <CardDescription>
              Keywords competitors rank for that you don't (or rank lower)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile.keywordGaps.slice(0, 10).map((gap, index) => (
                <div 
                  key={index} 
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900">{gap.keyword}</span>
                        <Badge 
                          variant="secondary"
                          className={cn(
                            'text-xs',
                            gap.opportunity === 'high' ? 'bg-red-100 text-red-700' :
                            gap.opportunity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          )}
                        >
                          {gap.opportunity} opportunity
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{gap.reason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Competitor: #{gap.competitorRanking}</span>
                        {gap.yourRanking && <span>You: #{gap.yourRanking}</span>}
                        <span>Volume: {formatNumber(gap.searchVolume)}/mo</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Intent Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(profile.categoryBreakdown).map(([intent, count]) => (
              <div 
                key={intent} 
                className="text-center p-4 rounded-lg border"
              >
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className={cn('text-sm mt-1 capitalize', getIntentColor(intent))}>
                  {intent}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
