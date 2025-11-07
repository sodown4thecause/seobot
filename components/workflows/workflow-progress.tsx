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
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'running':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Circle className="w-5 h-5 text-gray-400" />
      case 'skipped':
        return <Circle className="w-5 h-5 text-gray-300" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'running':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const completedSteps = execution.stepResults.filter((s) => s.status === 'completed').length
  const totalSteps = execution.stepResults.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Workflow Progress</CardTitle>
          <Badge className={cn('text-xs font-semibold', getStatusColor(execution.status))}>
            {execution.status.toUpperCase()}
          </Badge>
        </div>
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>
              {completedSteps} of {totalSteps} steps completed
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
              key={step.stepId}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-all',
                step.status === 'running' && 'bg-blue-50 border-blue-200',
                step.status === 'completed' && 'bg-green-50 border-green-200',
                step.status === 'failed' && 'bg-red-50 border-red-200',
                step.status === 'pending' && 'bg-gray-50 border-gray-200'
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">{getStepIcon(step.status)}</div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    Step {index + 1}: {step.stepId}
                  </span>
                  {step.duration && (
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span>{(step.duration / 1000).toFixed(1)}s</span>
                    </div>
                  )}
                </div>

                {/* Tool Results */}
                {step.toolResults && Object.keys(step.toolResults).length > 0 && (
                  <div className="text-xs text-gray-600 mt-1">
                    Tools: {Object.keys(step.toolResults).join(', ')}
                  </div>
                )}

                {/* Error Message */}
                {step.error && (
                  <div className="text-xs text-red-700 mt-1 p-2 bg-red-100 rounded">
                    Error: {step.error}
                  </div>
                )}

                {/* Running Indicator */}
                {step.status === 'running' && (
                  <div className="text-xs text-blue-700 mt-1">Executing...</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Execution Time */}
        {execution.endTime && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Total Execution Time</span>
              <span className="font-semibold">
                {((execution.endTime - execution.startTime) / 1000).toFixed(1)}s
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

