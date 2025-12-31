'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Circle, Loader2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowExecution, WorkflowStepResult } from '@/lib/workflows/types'

export interface WorkflowProgressProps {
  execution: WorkflowExecution
  className?: string
}

export function WorkflowProgress({ execution, className }: WorkflowProgressProps) {
  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Circle className="w-5 h-5 text-zinc-600" />
      case 'skipped':
        return <Circle className="w-5 h-5 text-zinc-700" />
      default:
        return <Circle className="w-5 h-5 text-zinc-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/30 text-green-400 border-green-800'
      case 'running':
        return 'bg-blue-900/30 text-blue-400 border-blue-800'
      case 'failed':
        return 'bg-red-900/30 text-red-400 border-red-800'
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700'
    }
  }

  const completedSteps = execution.stepResults.filter((s) => s.status === 'completed').length
  const totalSteps = execution.stepResults.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <Card className={cn('w-full bg-zinc-900 border-zinc-800', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-zinc-100">Workflow Progress</CardTitle>
          <Badge className={cn('text-xs font-semibold border', getStatusColor(execution.status))}>
            {execution.status.toUpperCase()}
          </Badge>
        </div>
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-zinc-500 mb-2">
            <span>
              {completedSteps} of {totalSteps} steps completed
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Step List */}
        <div className="space-y-3">
          {execution.stepResults.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-md border transition-all',
                step.status === 'running' && 'bg-blue-950/20 border-blue-900/50',
                step.status === 'completed' && 'bg-green-950/20 border-green-900/50',
                step.status === 'failed' && 'bg-red-950/20 border-red-900/50',
                step.status === 'pending' && 'bg-zinc-900 border-zinc-800'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-medium",
                    step.status === 'pending' ? 'text-zinc-500' : 'text-zinc-200'
                  )}>
                    Step {index + 1}: {step.id}
                  </span>
                  {step.duration && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>{(step.duration / 1000).toFixed(1)}s</span>
                    </div>
                  )}
                </div>

                {/* Tool Results */}
                {step.toolResults && Object.keys(step.toolResults).length > 0 && (
                  <div className="text-xs text-zinc-500 mt-1 font-mono">
                    Tools: {Object.keys(step.toolResults).join(', ')}
                  </div>
                )}

                {/* Error Message */}
                {step.error && (
                  <div className="text-xs text-red-400 mt-1 p-2 bg-red-950/30 border border-red-900/50 rounded font-mono">
                    Error: {step.error}
                  </div>
                )}

                {/* Running Indicator */}
                {step.status === 'running' && (
                  <div className="text-xs text-blue-400 mt-1 animate-pulse">Executing...</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Execution Time */}
        {execution.endTime && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>Total Execution Time</span>
              <span className="font-semibold text-zinc-300">
                {((execution.endTime - execution.startTime) / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
