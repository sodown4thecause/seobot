'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, BookOpen, Award, Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export interface Citation {
  id: string
  source: string
  url: string
  authorityLevel: 'high' | 'medium' | 'low'
  type: 'academic' | 'industry' | 'government' | 'news' | 'expert'
  dataPoint: string
  placement: string
  eeatBenefit: string
  snippet?: string
}

export interface CitationRecommendationsData {
  keyword: string
  citations: Citation[]
  citationStrategy: string
  integrationTips: string[]
}

export interface CitationRecommendationsProps {
  data: CitationRecommendationsData
  className?: string
}

export function CitationRecommendations({ data, className }: CitationRecommendationsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const getAuthorityColor = (level: string) => {
    switch (level) {
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'academic':
        return '🎓'
      case 'industry':
        return '🏢'
      case 'government':
        return '🏛️'
      case 'news':
        return '📰'
      case 'expert':
        return '👤'
      default:
        return '📄'
    }
  }

  const handleCopy = (citation: Citation) => {
    const text = `${citation.dataPoint}\nSource: ${citation.source}\n${citation.url}`
    navigator.clipboard.writeText(text)
    setCopiedId(citation.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <Card className={cn('w-full glass border-white/10', className)}>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2 text-white">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Citation Recommendations
          </CardTitle>
          <p className="text-sm text-white/70 mt-1">Authoritative sources to strengthen EEAT</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Citation Strategy */}
        <div className="p-4 bg-indigo-500/20 rounded-lg border border-indigo-500/30 backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Citation Strategy
          </h4>
          <p className="text-sm text-indigo-200">{data.citationStrategy}</p>
        </div>

        {/* Citations List */}
        <div className="space-y-4">
          {data.citations.map((citation, index) => (
            <div
              key={citation.id}
              className="border border-white/20 rounded-lg p-4 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getTypeIcon(citation.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-semibold text-white text-sm">{citation.source}</h5>
                      <Badge className={cn('text-xs', getAuthorityColor(citation.authorityLevel))}>
                        {citation.authorityLevel} authority
                      </Badge>
                    </div>
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{citation.url}</span>
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopy(citation)}
                  className="flex-shrink-0 text-white/70 hover:text-white hover:bg-white/10"
                >
                  {copiedId === citation.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Data Point */}
              <div className="mb-3 p-3 bg-white/5 rounded border-l-4 border-indigo-500">
                <div className="text-xs font-medium text-white/80 mb-1">Data Point to Use:</div>
                <p className="text-sm text-white italic">"{citation.dataPoint}"</p>
              </div>

              {/* Snippet if available */}
              {citation.snippet && (
                <div className="mb-3 p-3 bg-blue-500/20 rounded text-xs text-blue-200 border border-blue-500/30">
                  <div className="font-medium mb-1">Context:</div>
                  <p>{citation.snippet}</p>
                </div>
              )}

              {/* Placement & EEAT Benefit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-white/80">Where to Place:</span>
                  <p className="text-white/60 mt-1">{citation.placement}</p>
                </div>
                <div>
                  <span className="font-medium text-white/80">EEAT Benefit:</span>
                  <p className="text-white/60 mt-1">{citation.eeatBenefit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration Tips */}
        {data.integrationTips && data.integrationTips.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Integration Tips</h4>
            <ul className="space-y-2">
              {data.integrationTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                  <span className="text-indigo-400 mt-0.5">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{data.citations.length}</div>
              <div className="text-xs text-white/60">Total Citations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-300">
                {data.citations.filter((c) => c.authorityLevel === 'high').length}
              </div>
              <div className="text-xs text-white/60">High Authority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-300">
                {new Set(data.citations.map((c) => c.type)).size}
              </div>
              <div className="text-xs text-white/60">Source Types</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

