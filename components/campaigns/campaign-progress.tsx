'use client'

import * as React from 'react'
import { CheckCircle2, Circle, Loader2, XCircle, Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface CampaignStep {
  id: string
  name: string
}

export type StepStatus = 'pending' | 'running' | 'completed' | 'failed'

interface CampaignProgressProps {
  steps: CampaignStep[]
  currentStep?: string
  completedSteps: string[]
  failedSteps?: string[]
  startTime: number
  estimatedTime?: string
  className?: string
}

export function CampaignProgress({
  steps,
  currentStep,
  completedSteps,
  failedSteps = [],
  startTime,
  estimatedTime,
  className,
}: CampaignProgressProps) {
  const [elapsed, setElapsed] = React.useState(0)

  // Update elapsed time every second
  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime])

  const getStepStatus = (stepId: string): StepStatus => {
    if (failedSteps.includes(stepId)) return 'failed'
    if (completedSteps.includes(stepId)) return 'completed'
    if (currentStep === stepId) return 'running'
    return 'pending'
  }

  const progress = steps.length > 0 
    ? (completedSteps.length / steps.length) * 100 
    : 0

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progress</span>
          <span className="text-muted-foreground">
            {completedSteps.length}/{steps.length} steps
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Time Display */}
      <div className="flex items-center justify-between text-sm border rounded-lg p-3 bg-muted/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>Elapsed: {formatTime(elapsed)}</span>
        </div>
        {estimatedTime && (
          <span className="text-muted-foreground">
            Est: {estimatedTime}
          </span>
        )}
      </div>

      {/* Step List */}
      <div className="space-y-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id)
          
          return (
            <div
              key={step.id}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                status === 'running' && 'border-primary bg-primary/5',
                status === 'completed' && 'border-green-500/30 bg-green-500/5',
                status === 'failed' && 'border-destructive/30 bg-destructive/5',
                status === 'pending' && 'opacity-60'
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                {status === 'completed' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {status === 'running' && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {status === 'failed' && (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                {status === 'pending' && (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Step Info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium text-sm',
                  status === 'pending' && 'text-muted-foreground'
                )}>
                  {step.name}
                </p>
              </div>

              {/* Step Number */}
              <span className="text-xs text-muted-foreground">
                {index + 1}/{steps.length}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
