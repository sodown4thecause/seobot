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
        return 'bg-blue-900/30 text-blue-300 border-blue-800'
      case 'content':
        return 'bg-green-900/30 text-green-300 border-green-800'
      case 'research':
        return 'bg-purple-900/30 text-purple-300 border-purple-800'
      case 'analysis':
        return 'bg-orange-900/30 text-orange-300 border-orange-800'
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }
  }

  return (
    <Card className={cn('bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all cursor-pointer group', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {workflow.icon && (
              <div className="text-3xl grayscale group-hover:grayscale-0 transition-all duration-300">{workflow.icon}</div>
            )}
            <div>
              <CardTitle className="text-lg text-zinc-100 group-hover:text-white transition-colors">
                {workflow.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {workflow.category && (
                  <Badge className={cn('text-xs border', getCategoryColor(workflow.category))}>
                    {workflow.category.toUpperCase()}
                  </Badge>
                )}
                {workflow.estimatedTime && (
                  <div className="flex items-center gap-1 text-xs text-zinc-500">
                    <Clock className="w-3 h-3" />
                    <span>{workflow.estimatedTime}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-zinc-400 mb-4">
          {workflow.description}
        </CardDescription>

        {/* Tags */}
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {workflow.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs bg-zinc-800/50 text-zinc-400 border-zinc-700">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Steps Preview */}
        <div className="mb-4">
          <div className="text-xs font-medium text-zinc-500 mb-2">Workflow Steps:</div>
          <div className="space-y-1">
            {workflow.steps.slice(0, 3).map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="flex-shrink-0 w-5 h-5 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center font-semibold border border-zinc-700 text-[10px]">
                  {index + 1}
                </span>
                <span>{step.name}</span>
              </div>
            ))}
            {workflow.steps.length > 3 && (
              <div className="text-xs text-zinc-600 ml-7">
                +{workflow.steps.length - 3} more steps
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={() => onStart(workflow.id)}
          className="w-full bg-zinc-100 text-zinc-900 hover:bg-white hover:text-black transition-all font-medium"
        >
          <Sparkles className="w-4 h-4 mr-2 text-zinc-500" />
          Start Workflow
        </Button>
      </CardContent>
    </Card>
  )
}
