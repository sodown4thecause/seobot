'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Search, DollarSign, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface KeywordMetric {
  keyword: string
  searchVolume: number
  cpc?: number
  competition?: string | number
  difficulty?: number
  trend?: 'up' | 'down' | 'stable'
  intent?: string
}

export interface KeywordMetricsProps {
  keywords: KeywordMetric[]
  title?: string
  className?: string
}

export function KeywordMetrics({ keywords, title = 'Keyword Analysis', className }: KeywordMetricsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getCompetitionColor = (competition: string | number) => {
    if (typeof competition === 'number') {
      if (competition >= 0.7) return 'text-red-600 bg-red-50'
      if (competition >= 0.4) return 'text-yellow-600 bg-yellow-50'
      return 'text-green-600 bg-green-50'
    }
    const comp = competition.toLowerCase()
    if (comp === 'high') return 'text-red-600 bg-red-50'
    if (comp === 'medium') return 'text-yellow-600 bg-yellow-50'
    return 'text-green-600 bg-green-50'
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty >= 70) return 'text-red-600'
    if (difficulty >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Keyword</th>
                <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Search Volume</th>
                {keywords.some(k => k.cpc !== undefined) && (
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">CPC</th>
                )}
                {keywords.some(k => k.competition !== undefined) && (
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Competition</th>
                )}
                {keywords.some(k => k.difficulty !== undefined) && (
                  <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Difficulty</th>
                )}
                {keywords.some(k => k.intent) && (
                  <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Intent</th>
                )}
              </tr>
            </thead>
            <tbody>
              {keywords.map((keyword, index) => (
                <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{keyword.keyword}</span>
                      {keyword.trend && (
                        <span className="text-xs">
                          {keyword.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
                          {keyword.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="font-semibold text-gray-900">{formatNumber(keyword.searchVolume)}</span>
                    <span className="text-xs text-gray-500 ml-1">/mo</span>
                  </td>
                  {keywords.some(k => k.cpc !== undefined) && (
                    <td className="py-3 px-4 text-right">
                      {keyword.cpc !== undefined ? (
                        <span className="flex items-center justify-end gap-1 text-gray-900">
                          <DollarSign className="w-3 h-3" />
                          {keyword.cpc.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {keywords.some(k => k.competition !== undefined) && (
                    <td className="py-3 px-4 text-center">
                      {keyword.competition !== undefined ? (
                        <Badge variant="secondary" className={cn('text-xs', getCompetitionColor(keyword.competition))}>
                          {typeof keyword.competition === 'number' 
                            ? (keyword.competition * 100).toFixed(0) + '%'
                            : keyword.competition}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {keywords.some(k => k.difficulty !== undefined) && (
                    <td className="py-3 px-4 text-right">
                      {keyword.difficulty !== undefined ? (
                        <span className={cn('font-semibold', getDifficultyColor(keyword.difficulty))}>
                          {keyword.difficulty}/100
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                  {keywords.some(k => k.intent) && (
                    <td className="py-3 px-4 text-center">
                      {keyword.intent ? (
                        <Badge variant="outline" className="text-xs">
                          <Target className="w-3 h-3 mr-1" />
                          {keyword.intent}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{keywords.length}</div>
            <div className="text-sm text-gray-600">Keywords</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(keywords.reduce((sum, k) => sum + k.searchVolume, 0))}
            </div>
            <div className="text-sm text-gray-600">Total Volume</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {keywords.some(k => k.cpc !== undefined)
                ? `$${(keywords.reduce((sum, k) => sum + (k.cpc || 0), 0) / keywords.filter(k => k.cpc).length).toFixed(2)}`
                : '-'}
            </div>
            <div className="text-sm text-gray-600">Avg CPC</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


















