'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Target, Lightbulb, FileText, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ContentStrategyData {
  keyword: string
  opportunity: {
    level: 'high' | 'medium' | 'low'
    reason: string
  }
  contentGaps: string[]
  eeatStrategy: {
    expertise: string[]
    experience: string[]
    authoritativeness: string[]
    trustworthiness: string[]
  }
  contentStructure: {
    format: string
    sections: string[]
    depth: string
    multimedia: string[]
  }
  optimizationChecklist: Array<{
    category: string
    items: string[]
  }>
  quickWins: string[]
}

export interface ContentStrategyProps {
  data: ContentStrategyData
  className?: string
}

export function ContentStrategy({ data, className }: ContentStrategyProps) {
  const getOpportunityColor = (level: string) => {
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

  return (
    <Card className={cn('w-full glass border-white/10', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-5 h-5 text-blue-400" />
              AI Search Ranking Strategy
            </CardTitle>
            <p className="text-sm text-white/70 mt-1">"{data.keyword}"</p>
          </div>
          <Badge className={cn('text-xs font-semibold', getOpportunityColor(data.opportunity.level))}>
            {data.opportunity.level.toUpperCase()} OPPORTUNITY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Opportunity Analysis */}
        <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-500/30 backdrop-blur-sm">
          <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Why This Opportunity Matters
          </h4>
          <p className="text-sm text-blue-200">{data.opportunity.reason}</p>
        </div>

        {/* Quick Wins */}
        {data.quickWins && data.quickWins.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Quick Wins (Implement First)
            </h4>
            <div className="space-y-2">
              {data.quickWins.map((win, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-500/20 rounded-lg border border-green-500/30 backdrop-blur-sm">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-green-200">{win}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Gaps */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Content Gaps to Fill</h4>
          <ul className="space-y-2">
            {data.contentGaps.map((gap, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-white/80">
                <span className="text-orange-400 mt-0.5">→</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* EEAT Strategy */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-400" />
            EEAT Implementation Strategy
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expertise */}
            <div className="p-3 bg-purple-500/20 rounded-lg border border-purple-500/30 backdrop-blur-sm">
              <div className="text-xs font-semibold text-purple-300 mb-2">Expertise Signals</div>
              <ul className="space-y-1">
                {data.eeatStrategy.expertise.map((item, index) => (
                  <li key={index} className="text-xs text-purple-200 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Experience */}
            <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30 backdrop-blur-sm">
              <div className="text-xs font-semibold text-blue-300 mb-2">Experience Indicators</div>
              <ul className="space-y-1">
                {data.eeatStrategy.experience.map((item, index) => (
                  <li key={index} className="text-xs text-blue-200 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Authoritativeness */}
            <div className="p-3 bg-green-500/20 rounded-lg border border-green-500/30 backdrop-blur-sm">
              <div className="text-xs font-semibold text-green-300 mb-2">Authoritativeness</div>
              <ul className="space-y-1">
                {data.eeatStrategy.authoritativeness.map((item, index) => (
                  <li key={index} className="text-xs text-green-200 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trustworthiness */}
            <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30 backdrop-blur-sm">
              <div className="text-xs font-semibold text-yellow-300 mb-2">Trust Signals</div>
              <ul className="space-y-1">
                {data.eeatStrategy.trustworthiness.map((item, index) => (
                  <li key={index} className="text-xs text-yellow-200 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Content Structure */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            Recommended Content Structure
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-white/60">Format:</span>
                <span className="ml-2 font-medium text-white">{data.contentStructure.format}</span>
              </div>
              <div>
                <span className="text-white/60">Depth:</span>
                <span className="ml-2 font-medium text-white">{data.contentStructure.depth}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-white/80 mb-2">Key Sections to Include:</div>
              <div className="flex flex-wrap gap-2">
                {data.contentStructure.sections.map((section, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-white/5 text-white/70 border-white/20">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>

            {data.contentStructure.multimedia.length > 0 && (
              <div>
                <div className="text-xs font-medium text-white/80 mb-2">Multimedia Elements:</div>
                <div className="flex flex-wrap gap-2">
                  {data.contentStructure.multimedia.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-white/10 text-white/80 border-white/20">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Optimization Checklist */}
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Optimization Checklist</h4>
          <div className="space-y-3">
            {data.optimizationChecklist.map((category, catIndex) => (
              <div key={catIndex} className="border border-white/20 rounded-lg p-3 bg-white/5 backdrop-blur-sm">
                <div className="text-xs font-semibold text-white mb-2">{category.category}</div>
                <ul className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-xs text-white/80">
                      <input type="checkbox" className="mt-0.5 accent-purple-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

