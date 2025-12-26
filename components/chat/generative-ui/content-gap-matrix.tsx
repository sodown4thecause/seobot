'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  AlertTriangle, 
  TrendingUp, 
  Target, 
  BarChart3,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ContentGapAnalysis, TopicCluster, ContentGap } from '@/lib/ai/content-gap-analyzer'

export interface ContentGapMatrixProps {
  analysis: ContentGapAnalysis
  className?: string
}

export function ContentGapMatrix({ analysis, className }: ContentGapMatrixProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getOpportunityColor = (opportunity: ContentGap['opportunity']) => {
    switch (opportunity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getContentTypeIcon = (type: ContentGap['contentType']) => {
    switch (type) {
      case 'blog':
        return '📝'
      case 'guide':
        return '📚'
      case 'product':
        return '🛍️'
      case 'landing':
        return '🎯'
      default:
        return '📄'
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Content Gap Analysis
          </CardTitle>
          <CardDescription>
            Comparing {analysis.yourDomain} with {analysis.competitorDomains.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{analysis.totalGaps}</div>
              <div className="text-sm text-gray-600 mt-1">Total Gaps</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analysis.highValueGaps}</div>
              <div className="text-sm text-gray-600 mt-1">High Value</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.quickWins}</div>
              <div className="text-sm text-gray-600 mt-1">Quick Wins</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(analysis.topOpportunities.reduce((sum, g) => sum + g.searchVolume, 0))}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Volume</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topic Clusters */}
      {analysis.clusters.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Topic Clusters
            </CardTitle>
            <CardDescription>
              Content gaps grouped by topic for strategic content planning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysis.clusters.slice(0, 5).map((cluster, index) => (
                <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 capitalize">{cluster.topic}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {cluster.keywords.length} keywords • {formatNumber(cluster.totalVolume)} total volume
                      </p>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={cn(
                        cluster.opportunityScore > 50 ? 'bg-green-100 text-green-700' :
                        cluster.opportunityScore > 30 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      )}
                    >
                      Score: {Math.round(cluster.opportunityScore)}
                    </Badge>
                  </div>
                  
                  <div className="mb-3">
                    <Progress 
                      value={Math.min(cluster.opportunityScore, 100)} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Content Suggestions:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      {cluster.contentSuggestions.slice(0, 3).map((suggestion, i) => (
                        <li key={i}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top Opportunities
          </CardTitle>
          <CardDescription>
            Highest-value keywords to target for content creation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Keyword</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Type</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Search Volume</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Competitor Rank</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Est. Traffic</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {analysis.topOpportunities.map((gap, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{gap.keyword}</span>
                        <span className="text-xs">{getContentTypeIcon(gap.contentType)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">{gap.topic}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className="text-xs capitalize">
                        {gap.contentType}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {gap.searchVolume > 0 ? formatNumber(gap.searchVolume) : 'N/A'}
                      </span>
                      {gap.searchVolume > 0 && (
                        <span className="text-xs text-gray-500 ml-1">/mo</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="font-semibold text-gray-900">#{gap.competitorRanking}</span>
                      </div>
                      {gap.yourRanking && (
                        <div className="text-xs text-gray-500 mt-1">
                          You: #{gap.yourRanking}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-blue-600">
                        {formatNumber(gap.estimatedTraffic)}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">/mo</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant="secondary"
                        className={cn('text-xs', getOpportunityColor(gap.opportunity))}
                      >
                        {gap.opportunity}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
