'use client'

import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, RefreshCw, Play, X, CheckCircle2 } from 'lucide-react'
import type { WorkflowExecution, WorkflowStepResult } from '@/lib/workflows/types'

interface WorkflowErrorRecoveryProps {
  execution: WorkflowExecution
  onResume?: (executionId: string) => Promise<void>
  onRetry?: (executionId: string, modifiedParams?: Record<string, any>) => Promise<void>
  onCancel?: (executionId: string) => Promise<void>
}

export function WorkflowErrorRecovery({
  execution,
  onResume,
  onRetry,
  onCancel,
}: WorkflowErrorRecoveryProps) {
  const [isResuming, setIsResuming] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  // Find the failed step
  const failedStep = execution.stepResults.find((r) => r.status === 'failed')
  const lastSuccessfulStep = execution.stepResults
    .filter((r) => r.status === 'completed')
    .slice(-1)[0]

  // Determine error type and suggested actions
  const errorAnalysis = analyzeError(execution, failedStep)

  const handleResume = async () => {
    if (!onResume || !execution.id) return
    setIsResuming(true)
    try {
      await onResume(execution.id)
    } finally {
      setIsResuming(false)
    }
  }

  const handleRetry = async () => {
    if (!onRetry || !execution.id) return
    setIsRetrying(true)
    try {
      await onRetry(execution.id, errorAnalysis.suggestedParams)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleCancel = async () => {
    if (!onCancel || !execution.id) return
    setIsCancelling(true)
    try {
      await onCancel(execution.id)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <Card className="border-destructive">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle>Workflow Error</CardTitle>
        </div>
        <CardDescription>
          The workflow encountered an error and stopped. You can resume from the last checkpoint or
          retry the failed step.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Details */}
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {failedStep && (
                <div>
                  <strong>Failed Step:</strong> {failedStep.stepId}
                </div>
              )}
              {execution.errorMessage && (
                <div>
                  <strong>Error Message:</strong> {execution.errorMessage}
                </div>
              )}
              {failedStep?.error && (
                <div>
                  <strong>Step Error:</strong> {failedStep.error}
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>

        {/* Progress Summary */}
        {lastSuccessfulStep && (
          <div className="rounded-lg bg-muted p-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>
                Last successful step: <strong>{lastSuccessfulStep.stepId}</strong>
              </span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {execution.stepResults.filter((r) => r.status === 'completed').length} of{' '}
              {execution.stepResults.length} steps completed
            </div>
          </div>
        )}

        {/* Suggested Actions */}
        {errorAnalysis.suggestedActions.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold">Suggested Actions:</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {errorAnalysis.suggestedActions.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {onResume && lastSuccessfulStep && (
            <Button onClick={handleResume} disabled={isResuming || isRetrying || isCancelling}>
              <Play className="mr-2 h-4 w-4" />
              {isResuming ? 'Resuming...' : 'Resume from Checkpoint'}
            </Button>
          )}
          {onRetry && (
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={isResuming || isRetrying || isCancelling}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Retry Failed Step'}
            </Button>
          )}
          {onCancel && (
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isResuming || isRetrying || isCancelling}
            >
              <X className="mr-2 h-4 w-4" />
              {isCancelling ? 'Cancelling...' : 'Cancel Workflow'}
            </Button>
          )}
        </div>

        {/* Recovery Info */}
        {execution.checkpointData && (
          <div className="rounded-lg border p-3 text-xs text-muted-foreground">
            <strong>Recovery Available:</strong> Checkpoint data saved at{' '}
            {new Date(execution.startTime).toLocaleString()}. You can resume from this point.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Analyze error and provide recovery suggestions
 */
function analyzeError(
  execution: WorkflowExecution,
  failedStep?: WorkflowStepResult
): {
  suggestedActions: string[]
  suggestedParams?: Record<string, any>
} {
  const suggestions: string[] = []
  const suggestedParams: Record<string, any> = {}

  if (!failedStep) {
    return { suggestedActions: ['Review workflow configuration'] }
  }

  const errorMessage = (failedStep.error || execution.errorMessage || '').toLowerCase()

  // API-related errors
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('429') ||
    errorMessage.includes('quota')
  ) {
    suggestions.push('Rate limit exceeded - wait a few minutes and retry')
    suggestions.push('Consider using cached results if available')
    suggestedParams.waitBeforeRetry = 60000 // 1 minute
  }

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection')
  ) {
    suggestions.push('Network connectivity issue - check your connection')
    suggestions.push('Retry the operation')
    suggestedParams.retryCount = 3
  }

  // Authentication errors
  if (
    errorMessage.includes('auth') ||
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('401') ||
    errorMessage.includes('403')
  ) {
    suggestions.push('Authentication issue - verify API credentials')
    suggestions.push('Check if API keys are valid and have required permissions')
  }

  // Data validation errors
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('missing')
  ) {
    suggestions.push('Invalid input parameters - review step configuration')
    suggestions.push('Check if all required parameters are provided')
  }

  // Provider-specific errors
  if (errorMessage.includes('dataforseo')) {
    suggestions.push('DataForSEO API error - check service status')
    suggestions.push('Verify API quota and account limits')
  }

  if (errorMessage.includes('firecrawl')) {
    suggestions.push('Firecrawl API error - check service status')
    suggestions.push('Verify API credentials and rate limits')
  }

  if (errorMessage.includes('perplexity')) {
    suggestions.push('Perplexity API error - check service status')
    suggestions.push('Verify API key and usage limits')
  }

  // Generic fallback
  if (suggestions.length === 0) {
    suggestions.push('Review the error message above for details')
    suggestions.push('Try resuming from the last successful checkpoint')
    suggestions.push('If the issue persists, contact support with the error details')
  }

  return {
    suggestedActions: suggestions,
    suggestedParams: Object.keys(suggestedParams).length > 0 ? suggestedParams : undefined,
  }
}

