'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Workflow } from '@/lib/workflows/types'

export interface WorkflowCardProps {
  workflow: Workflow
  onStart: (workflowId: string) => void
  className?: string
}

export function WorkflowCard({ workflow, onStart, className }: WorkflowCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'seo':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'content':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'research':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'analysis':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <Card className={cn('hover:shadow-lg transition-shadow cursor-pointer group', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{workflow.icon}</div>
            <div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {workflow.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-xs', getCategoryColor(workflow.category))}>
                  {workflow.category.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" />
                  <span>{workflow.estimatedTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-gray-700 mb-4">
          {workflow.description}
        </CardDescription>

        {/* Tags */}
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {workflow.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Steps Preview */}
        <div className="mb-4">
          <div className="text-xs font-medium text-gray-700 mb-2">Workflow Steps:</div>
          <div className="space-y-1">
            {workflow.steps.slice(0, 3).map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 text-xs text-gray-600">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                  {index + 1}
                </span>
                <span>{step.name}</span>
              </div>
            ))}
            {workflow.steps.length > 3 && (
              <div className="text-xs text-gray-500 ml-7">
                +{workflow.steps.length - 3} more steps
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={() => onStart(workflow.id)}
          className="w-full group-hover:bg-blue-600 transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start Workflow
        </Button>
      </CardContent>
    </Card>
  )
}

