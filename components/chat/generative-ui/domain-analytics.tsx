'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Globe, Search, Link2, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DomainAnalyticsData {
  domain: string
  metrics: {
    organicTraffic?: number
    organicKeywords?: number
    backlinks?: number
    domainAuthority?: number
    visibility?: number
    trafficTrend?: 'up' | 'down' | 'stable'
    trafficChange?: number
  }
  topKeywords?: Array<{
    keyword: string
    position: number
    searchVolume: number
  }>
  topPages?: Array<{
    url: string
    traffic: number
    keywords: number
  }>
}

export interface DomainAnalyticsProps {
  data: DomainAnalyticsData
  className?: string
}

export function DomainAnalytics({ data, className }: DomainAnalyticsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const getAuthorityColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Domain Analytics
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">{data.domain}</p>
          </div>
          {data.metrics.trafficTrend && (
            <Badge variant={data.metrics.trafficTrend === 'up' ? 'default' : 'secondary'} className="flex items-center gap-1">
              {data.metrics.trafficTrend === 'up' ? (
                <TrendingUp className="w-3 h-3" />
              ) : data.metrics.trafficTrend === 'down' ? (
                <TrendingDown className="w-3 h-3" />
              ) : null}
              {data.metrics.trafficChange !== undefined && `${data.metrics.trafficChange > 0 ? '+' : ''}${data.metrics.trafficChange}%`}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {data.metrics.organicTraffic !== undefined && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Organic Traffic</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(data.metrics.organicTraffic)}</div>
              <div className="text-xs text-gray-600 mt-1">monthly visits</div>
            </div>
          )}

          {data.metrics.organicKeywords !== undefined && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Organic Keywords</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(data.metrics.organicKeywords)}</div>
              <div className="text-xs text-gray-600 mt-1">ranking keywords</div>
            </div>
          )}

          {data.metrics.backlinks !== undefined && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Backlinks</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(data.metrics.backlinks)}</div>
              <div className="text-xs text-gray-600 mt-1">total links</div>
            </div>
          )}

          {data.metrics.domainAuthority !== undefined && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-gray-700">Domain Authority</span>
              </div>
              <div className={cn('text-2xl font-bold', getAuthorityColor(data.metrics.domainAuthority))}>
                {data.metrics.domainAuthority}/100
              </div>
              <div className="text-xs text-gray-600 mt-1">authority score</div>
            </div>
          )}

          {data.metrics.visibility !== undefined && (
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-gray-700">Visibility</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{data.metrics.visibility.toFixed(1)}%</div>
              <div className="text-xs text-gray-600 mt-1">search visibility</div>
            </div>
          )}
        </div>

        {/* Top Keywords */}
        {data.topKeywords && data.topKeywords.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Ranking Keywords</h4>
            <div className="space-y-2">
              {data.topKeywords.slice(0, 5).map((keyword, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant="outline" className="flex-shrink-0">#{keyword.position}</Badge>
                    <span className="font-medium text-gray-900 truncate">{keyword.keyword}</span>
                  </div>
                  <span className="text-sm text-gray-600 flex-shrink-0 ml-2">
                    {formatNumber(keyword.searchVolume)} vol
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Pages */}
        {data.topPages && data.topPages.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Pages</h4>
            <div className="space-y-2">
              {data.topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{page.url}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatNumber(page.traffic)} visits • {page.keywords} keywords
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

