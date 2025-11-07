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
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'content':
        return 'bg-green-500/20 text-green-300 border-green-500/30'
      case 'research':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'analysis':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30'
      default:
        return 'bg-white/10 text-white/70 border-white/20'
    }
  }

  return (
    <Card className={cn('glass hover:shadow-purple transition-all cursor-pointer group border-white/10', className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{workflow.icon}</div>
            <div>
              <CardTitle className="text-lg text-white group-hover:text-purple-300 transition-colors">
                {workflow.name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={cn('text-xs', getCategoryColor(workflow.category))}>
                  {workflow.category.toUpperCase()}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-white/60">
                  <Clock className="w-3 h-3" />
                  <span>{workflow.estimatedTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-sm text-white/70 mb-4">
          {workflow.description}
        </CardDescription>

        {/* Tags */}
        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {workflow.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs bg-white/5 text-white/60 border-white/20">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Steps Preview */}
        <div className="mb-4">
          <div className="text-xs font-medium text-white/80 mb-2">Workflow Steps:</div>
          <div className="space-y-1">
            {workflow.steps.slice(0, 3).map((step, index) => (
              <div key={step.id} className="flex items-center gap-2 text-xs text-white/70">
                <span className="flex-shrink-0 w-5 h-5 bg-purple-500/30 text-purple-300 rounded-full flex items-center justify-center font-semibold border border-purple-500/40">
                  {index + 1}
                </span>
                <span>{step.name}</span>
              </div>
            ))}
            {workflow.steps.length > 3 && (
              <div className="text-xs text-white/50 ml-7">
                +{workflow.steps.length - 3} more steps
              </div>
            )}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={() => onStart(workflow.id)}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white transition-all"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start Workflow
        </Button>
      </CardContent>
    </Card>
  )
}

