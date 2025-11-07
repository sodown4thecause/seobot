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
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
      case 'low':
        return 'bg-white/10 text-white/60 border-white/20'
      default:
        return 'bg-white/10 text-white/60 border-white/20'
    }
  }

  return (
    <Card className={cn('w-full glass border-white/10', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="w-5 h-5 text-purple-400" />
              AI Search Platform Metrics
            </CardTitle>
            <p className="text-sm text-white/70 mt-1">"{data.keyword}"</p>
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
            <div className="p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg border border-green-500/30 backdrop-blur-sm">
              <div className="text-xs font-medium text-green-300 mb-1">ChatGPT</div>
              <div className="text-2xl font-bold text-green-200">{formatNumber(data.platforms.chatgpt)}</div>
              <div className="text-xs text-green-400/80 mt-1">searches/mo</div>
            </div>
          )}

          {data.platforms.claude !== undefined && (
            <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg border border-orange-500/30 backdrop-blur-sm">
              <div className="text-xs font-medium text-orange-300 mb-1">Claude</div>
              <div className="text-2xl font-bold text-orange-200">{formatNumber(data.platforms.claude)}</div>
              <div className="text-xs text-orange-400/80 mt-1">searches/mo</div>
            </div>
          )}

          {data.platforms.perplexity !== undefined && (
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-500/30 backdrop-blur-sm">
              <div className="text-xs font-medium text-blue-300 mb-1">Perplexity</div>
              <div className="text-2xl font-bold text-blue-200">{formatNumber(data.platforms.perplexity)}</div>
              <div className="text-xs text-blue-400/80 mt-1">searches/mo</div>
            </div>
          )}

          {data.platforms.gemini !== undefined && (
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-500/30 backdrop-blur-sm">
              <div className="text-xs font-medium text-purple-300 mb-1">Gemini</div>
              <div className="text-2xl font-bold text-purple-200">{formatNumber(data.platforms.gemini)}</div>
              <div className="text-xs text-purple-400/80 mt-1">searches/mo</div>
            </div>
          )}
        </div>

        {/* Comparison with Google */}
        {data.googleVolume !== undefined && (
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-white/70" />
                <span className="text-sm font-medium text-white/90">AI vs Traditional Search</span>
              </div>
              {data.trend && (
                <Badge variant="outline" className="text-xs bg-white/5 text-white/70 border-white/20">
                  {data.trend === 'growing' && <TrendingUp className="w-3 h-3 mr-1 text-green-400" />}
                  {data.trend === 'declining' && <TrendingDown className="w-3 h-3 mr-1 text-red-400" />}
                  {data.trend}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-white/60 mb-1">Total AI Search Volume</div>
                <div className="text-xl font-bold text-purple-300">{formatNumber(totalAIVolume)}</div>
              </div>
              <div>
                <div className="text-xs text-white/60 mb-1">Google Search Volume</div>
                <div className="text-xl font-bold text-white">{formatNumber(data.googleVolume)}</div>
              </div>
            </div>

            {data.aiVsGoogleRatio !== undefined && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-xs text-white/60 mb-1">AI Search Penetration</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(data.aiVsGoogleRatio * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-purple-300">
                    {(data.aiVsGoogleRatio * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-white">Key Insights</h4>
          <ul className="space-y-2 text-sm text-white/80">
            {totalAIVolume > (data.googleVolume || 0) * 0.3 && (
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span>Strong AI search presence - {((totalAIVolume / (data.googleVolume || 1)) * 100).toFixed(0)}% of Google volume</span>
              </li>
            )}
            {data.platforms.chatgpt && data.platforms.chatgpt > totalAIVolume * 0.5 && (
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">→</span>
                <span>ChatGPT dominates with {((data.platforms.chatgpt / totalAIVolume) * 100).toFixed(0)}% of AI search volume</span>
              </li>
            )}
            {data.opportunity === 'high' && (
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">★</span>
                <span>High opportunity for AI search optimization - growing market with good volume</span>
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

