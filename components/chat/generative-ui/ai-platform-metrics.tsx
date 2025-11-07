'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Sparkles, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AIPlatformData {
  keyword: string
  platforms: {
    chatgpt?: number
    claude?: number
    perplexity?: number
    gemini?: number
  }
  googleVolume?: number
  aiVsGoogleRatio?: number
  trend?: 'growing' | 'stable' | 'declining'
  opportunity?: 'high' | 'medium' | 'low'
}

export interface AIPlatformMetricsProps {
  data: AIPlatformData
  className?: string
}

export function AIPlatformMetrics({ data, className }: AIPlatformMetricsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const totalAIVolume = Object.values(data.platforms).reduce((sum, val) => sum + (val || 0), 0)

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'high':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Search Platform Metrics
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">"{data.keyword}"</p>
          </div>
          {data.opportunity && (
            <Badge className={cn('text-xs font-semibold', getOpportunityColor(data.opportunity))}>
              {data.opportunity.toUpperCase()} OPPORTUNITY
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* AI Platform Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {data.platforms.chatgpt !== undefined && (
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-xs font-medium text-green-700 mb-1">ChatGPT</div>
              <div className="text-2xl font-bold text-green-900">{formatNumber(data.platforms.chatgpt)}</div>
              <div className="text-xs text-green-600 mt-1">searches/mo</div>
            </div>
          )}

          {data.platforms.claude !== undefined && (
            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="text-xs font-medium text-orange-700 mb-1">Claude</div>
              <div className="text-2xl font-bold text-orange-900">{formatNumber(data.platforms.claude)}</div>
              <div className="text-xs text-orange-600 mt-1">searches/mo</div>
            </div>
          )}

          {data.platforms.perplexity !== undefined && (
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-xs font-medium text-blue-700 mb-1">Perplexity</div>
              <div className="text-2xl font-bold text-blue-900">{formatNumber(data.platforms.perplexity)}</div>
              <div className="text-xs text-blue-600 mt-1">searches/mo</div>
            </div>
          )}

          {data.platforms.gemini !== undefined && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="text-xs font-medium text-purple-700 mb-1">Gemini</div>
              <div className="text-2xl font-bold text-purple-900">{formatNumber(data.platforms.gemini)}</div>
              <div className="text-xs text-purple-600 mt-1">searches/mo</div>
            </div>
          )}
        </div>

        {/* Comparison with Google */}
        {data.googleVolume !== undefined && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">AI vs Traditional Search</span>
              </div>
              {data.trend && (
                <Badge variant="outline" className="text-xs">
                  {data.trend === 'growing' && <TrendingUp className="w-3 h-3 mr-1 text-green-600" />}
                  {data.trend === 'declining' && <TrendingDown className="w-3 h-3 mr-1 text-red-600" />}
                  {data.trend}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-600 mb-1">Total AI Search Volume</div>
                <div className="text-xl font-bold text-purple-900">{formatNumber(totalAIVolume)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-600 mb-1">Google Search Volume</div>
                <div className="text-xl font-bold text-gray-900">{formatNumber(data.googleVolume)}</div>
              </div>
            </div>

            {data.aiVsGoogleRatio !== undefined && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="text-xs text-gray-600 mb-1">AI Search Penetration</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(data.aiVsGoogleRatio * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-purple-900">
                    {(data.aiVsGoogleRatio * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Key Insights</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            {totalAIVolume > (data.googleVolume || 0) * 0.3 && (
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Strong AI search presence - {((totalAIVolume / (data.googleVolume || 1)) * 100).toFixed(0)}% of Google volume</span>
              </li>
            )}
            {data.platforms.chatgpt && data.platforms.chatgpt > totalAIVolume * 0.5 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>ChatGPT dominates with {((data.platforms.chatgpt / totalAIVolume) * 100).toFixed(0)}% of AI search volume</span>
              </li>
            )}
            {data.opportunity === 'high' && (
              <li className="flex items-start gap-2">
                <span className="text-purple-600 mt-0.5">★</span>
                <span>High opportunity for AI search optimization - growing market with good volume</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

