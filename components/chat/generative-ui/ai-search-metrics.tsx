'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Sparkles, 
  TrendingUp, 
  BarChart3, 
  Target,
  Brain,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AISearchAnalysis, AISearchVolume } from '@/lib/ai/ai-search-optimizer'

export interface AISearchMetricsProps {
  analysis: AISearchAnalysis
  className?: string
}

export function AISearchMetrics({ analysis, className }: AISearchMetricsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getOpportunityColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-700 border-green-300'
    if (score >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    return 'bg-gray-100 text-gray-700 border-gray-300'
  }

  const getOpportunityLabel = (score: number) => {
    if (score >= 70) return 'High'
    if (score >= 50) return 'Medium'
    return 'Low'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            AI Search Volume Analysis
          </CardTitle>
          <CardDescription>
            ChatGPT and Perplexity search volume compared to traditional search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(analysis.summary.totalAIVolume)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total AI Volume</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(analysis.summary.totalTraditionalVolume)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Traditional Volume</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysis.summary.avgOpportunityScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Opportunity</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analysis.summary.highOpportunityCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">High Opportunity</div>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">
                {analysis.summary.aiVsTraditionalRatio.toFixed(2)}x
              </div>
              <div className="text-sm text-gray-600 mt-1">AI/Traditional</div>
            </div>
          </div>

          {/* Ratio Visualization */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">AI vs Traditional Search Ratio</span>
              <span className="text-sm text-gray-600">
                {analysis.summary.aiVsTraditionalRatio > 1 ? 'AI Dominant' : 'Traditional Dominant'}
              </span>
            </div>
            <div className="flex gap-2 h-4 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500"
                style={{ 
                  width: `${Math.min((analysis.summary.totalAIVolume / (analysis.summary.totalAIVolume + analysis.summary.totalTraditionalVolume)) * 100, 100)}%` 
                }}
              />
              <div 
                className="bg-blue-500"
                style={{ 
                  width: `${Math.min((analysis.summary.totalTraditionalVolume / (analysis.summary.totalAIVolume + analysis.summary.totalTraditionalVolume)) * 100, 100)}%` 
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <span>AI: {formatNumber(analysis.summary.totalAIVolume)}</span>
              <span>Traditional: {formatNumber(analysis.summary.totalTraditionalVolume)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Top AI Search Opportunities
          </CardTitle>
          <CardDescription>
            Keywords with highest AI opportunity scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Keyword</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">ChatGPT</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Perplexity</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Total AI</th>
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Traditional</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Ratio</th>
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {analysis.topOpportunities.map((keyword, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{keyword.keyword}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Sparkles className="w-3 h-3 text-purple-500" />
                        <span className="font-semibold text-gray-900">
                          {formatNumber(keyword.chatgptVolume)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-blue-500" />
                        <span className="font-semibold text-gray-900">
                          {formatNumber(keyword.perplexityVolume)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-purple-600">
                        {formatNumber(keyword.aiTotalVolume)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-semibold text-gray-900">
                        {keyword.traditionalVolume > 0 ? formatNumber(keyword.traditionalVolume) : '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {keyword.traditionalVolume > 0 ? (
                        <Badge variant="outline" className="text-xs">
                          {keyword.aiVsTraditionalRatio.toFixed(2)}x
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                          AI Only
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Badge 
                          variant="secondary"
                          className={cn('text-xs', getOpportunityColor(keyword.aiOpportunityScore))}
                        >
                          {getOpportunityLabel(keyword.aiOpportunityScore)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {keyword.aiOpportunityScore}/100
                        </span>
                      </div>
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
              AI Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{recommendation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Individual Keyword Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            All Keywords Analysis
          </CardTitle>
          <CardDescription>
            Detailed AI search volume for all analyzed keywords
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {analysis.keywords.map((keyword, index) => (
              <div 
                key={index} 
                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{keyword.keyword}</h4>
                    <p className="text-sm text-gray-600 mt-1">{keyword.recommendation}</p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={cn('ml-2', getOpportunityColor(keyword.aiOpportunityScore))}
                  >
                    {getOpportunityLabel(keyword.aiOpportunityScore)}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">ChatGPT:</span>
                    <span className="ml-2 font-semibold text-purple-600">
                      {formatNumber(keyword.chatgptVolume)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Perplexity:</span>
                    <span className="ml-2 font-semibold text-blue-600">
                      {formatNumber(keyword.perplexityVolume)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Traditional:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {keyword.traditionalVolume > 0 ? formatNumber(keyword.traditionalVolume) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Score:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      {keyword.aiOpportunityScore}/100
                    </span>
                  </div>
                </div>
                {keyword.aiOpportunityScore >= 50 && (
                  <div className="mt-3">
                    <Progress value={keyword.aiOpportunityScore} className="h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
