'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Loader2, XCircle, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { WorkflowExecution, WorkflowStepResult } from '@/lib/workflows/types'
import { analytics } from '@/lib/workflows/analytics'

export interface WorkflowProgressProps {
  execution: WorkflowExecution
  className?: string
  onCancel?: () => Promise<void>
  showETA?: boolean
}

export function WorkflowProgress({
  execution,
  className,
  onCancel,
  showETA = true,
}: WorkflowProgressProps) {
  const [eta, setEta] = useState<number | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Calculate ETA based on historical analytics
  useEffect(() => {
    if (!showETA || execution.status !== 'running') {
      setEta(null)
      return
    }

    const calculateETA = async () => {
      const workflowMetrics = await analytics.getWorkflowMetrics(execution.workflowId)
      if (!workflowMetrics || workflowMetrics.averageDuration === 0) {
        return null
      }

      const completedSteps = execution.stepResults.filter((s) => s.status === 'completed').length
      const totalSteps = execution.stepResults.length
      const remainingSteps = totalSteps - completedSteps

      if (remainingSteps <= 0) return null

      // Estimate based on average step duration
      const avgStepDuration = workflowMetrics.averageDuration / totalSteps
      const estimatedRemaining = avgStepDuration * remainingSteps

      return estimatedRemaining
    }

    const updateETA = async () => {
      const calculated = await calculateETA()
      setEta(calculated)
    }

    updateETA()
    const interval = setInterval(updateETA, 1000) // Update every second

    return () => clearInterval(interval)
  }, [execution, showETA])

  const handleCancel = async () => {
    if (!onCancel) return
    setIsCancelling(true)
    try {
      await onCancel()
    } finally {
      setIsCancelling(false)
    }
  }

  const formatETA = (seconds: number): string => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  }
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
          <div className="flex-1">
            <CardTitle className="text-lg text-zinc-100">Workflow Progress</CardTitle>
            {showETA && eta !== null && execution.status === 'running' && (
              <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                <Clock className="h-3 w-3" />
                <span>Estimated time remaining: {formatETA(eta)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn('text-xs font-semibold border', getStatusColor(execution.status))}>
              {execution.status.toUpperCase()}
            </Badge>
            {onCancel && execution.status === 'running' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
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
              key={step.stepId}
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
                    Step {index + 1}: {step.stepId}
                  </span>
                  {step.status === 'running' && (
                    <div className="flex items-center gap-1 text-xs text-zinc-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Running...</span>
                    </div>
                  )}
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
