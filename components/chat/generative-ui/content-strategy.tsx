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
              <Target className="w-5 h-5 text-blue-600" />
              AI Search Ranking Strategy
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">"{data.keyword}"</p>
          </div>
          <Badge className={cn('text-xs font-semibold', getOpportunityColor(data.opportunity.level))}>
            {data.opportunity.level.toUpperCase()} OPPORTUNITY
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Opportunity Analysis */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Why This Opportunity Matters
          </h4>
          <p className="text-sm text-blue-800">{data.opportunity.reason}</p>
        </div>

        {/* Quick Wins */}
        {data.quickWins && data.quickWins.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Quick Wins (Implement First)
            </h4>
            <div className="space-y-2">
              {data.quickWins.map((win, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <span className="text-sm text-green-900">{win}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Gaps */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Content Gaps to Fill</h4>
          <ul className="space-y-2">
            {data.contentGaps.map((gap, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-orange-600 mt-0.5">→</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* EEAT Strategy */}
        <div>
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-purple-600" />
            EEAT Implementation Strategy
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expertise */}
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-xs font-semibold text-purple-900 mb-2">Expertise Signals</div>
              <ul className="space-y-1">
                {data.eeatStrategy.expertise.map((item, index) => (
                  <li key={index} className="text-xs text-purple-800 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Experience */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs font-semibold text-blue-900 mb-2">Experience Indicators</div>
              <ul className="space-y-1">
                {data.eeatStrategy.experience.map((item, index) => (
                  <li key={index} className="text-xs text-blue-800 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Authoritativeness */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs font-semibold text-green-900 mb-2">Authoritativeness</div>
              <ul className="space-y-1">
                {data.eeatStrategy.authoritativeness.map((item, index) => (
                  <li key={index} className="text-xs text-green-800 flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Trustworthiness */}
            <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xs font-semibold text-yellow-900 mb-2">Trust Signals</div>
              <ul className="space-y-1">
                {data.eeatStrategy.trustworthiness.map((item, index) => (
                  <li key={index} className="text-xs text-yellow-800 flex items-start gap-1">
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
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Recommended Content Structure
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Format:</span>
                <span className="ml-2 font-medium text-gray-900">{data.contentStructure.format}</span>
              </div>
              <div>
                <span className="text-gray-600">Depth:</span>
                <span className="ml-2 font-medium text-gray-900">{data.contentStructure.depth}</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-700 mb-2">Key Sections to Include:</div>
              <div className="flex flex-wrap gap-2">
                {data.contentStructure.sections.map((section, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {section}
                  </Badge>
                ))}
              </div>
            </div>

            {data.contentStructure.multimedia.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Multimedia Elements:</div>
                <div className="flex flex-wrap gap-2">
                  {data.contentStructure.multimedia.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
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
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Optimization Checklist</h4>
          <div className="space-y-3">
            {data.optimizationChecklist.map((category, catIndex) => (
              <div key={catIndex} className="border border-gray-200 rounded-lg p-3">
                <div className="text-xs font-semibold text-gray-900 mb-2">{category.category}</div>
                <ul className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2 text-xs text-gray-700">
                      <input type="checkbox" className="mt-0.5" />
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

