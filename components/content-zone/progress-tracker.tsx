'use client'

import React from 'react'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

export interface ProgressEvent {
  phase: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  message: string
  details?: string
}

interface ProgressTrackerProps {
  progress: ProgressEvent[]
  isGenerating: boolean
  onCancel?: () => void
}

const PHASE_ORDER = [
  { id: 'research', label: 'Research', description: 'Analyzing topic and competitors' },
  { id: 'frase-brief', label: 'Content Brief', description: 'Creating SEO content outline' },
  { id: 'writing', label: 'Writing', description: 'Generating content draft' },
  { id: 'syntax', label: 'SEO Optimization', description: 'Optimizing headings and structure' },
  { id: 'scoring', label: 'Quality Review', description: 'Evaluating content quality' },
  { id: 'complete', label: 'Complete', description: 'Content ready' },
]

export function ProgressTracker({ progress, isGenerating, onCancel }: ProgressTrackerProps) {
  // Get the latest status for each phase
  const phaseStatus = React.useMemo(() => {
    const status: Record<string, ProgressEvent['status']> = {}
    
    progress.forEach(event => {
      status[event.phase] = event.status
    })
    
    return status
  }, [progress])

  // Calculate overall progress
  const progressPercent = React.useMemo(() => {
    const completedPhases = Object.values(phaseStatus).filter(s => s === 'completed').length
    const inProgressPhases = Object.values(phaseStatus).filter(s => s === 'in_progress').length
    
    // Each completed phase = 15%, in_progress = 7%
    return Math.min(100, (completedPhases * 15) + (inProgressPhases * 7))
  }, [phaseStatus])

  // Get current phase
  const currentPhase = React.useMemo(() => {
    for (const phase of PHASE_ORDER) {
      const status = phaseStatus[phase.id]
      if (status === 'in_progress') {
        return phase
      }
      if (status === 'error') {
        return { ...phase, isError: true }
      }
    }
    
    // Find last completed phase
    for (let i = PHASE_ORDER.length - 1; i >= 0; i--) {
      if (phaseStatus[PHASE_ORDER[i].id] === 'completed') {
        return PHASE_ORDER[Math.min(i + 1, PHASE_ORDER.length - 1)]
      }
    }
    
    return PHASE_ORDER[0]
  }, [phaseStatus])

  // Get latest message for current phase
  const currentMessage = React.useMemo(() => {
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i].phase === currentPhase?.id) {
        return progress[i]
      }
    }
    return null
  }, [progress, currentPhase])

  if (!isGenerating && progress.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">
            {isGenerating ? 'Generating Content...' : 'Generation Complete'}
          </h3>
          {currentMessage && (
            <p className="text-sm text-zinc-400 mt-1">
              {currentMessage.message}
              {currentMessage.details && (
                <span className="text-zinc-500"> — {currentMessage.details}</span>
              )}
            </p>
          )}
        </div>
        {isGenerating && onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-xs text-zinc-500">
          <span>{Math.round(progressPercent)}% complete</span>
          <span>{Object.values(phaseStatus).filter(s => s === 'completed').length} of {PHASE_ORDER.length} phases</span>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="space-y-3">
        {PHASE_ORDER.map((phase, index) => {
          const status = phaseStatus[phase.id] || 'pending'
          const isActive = status === 'in_progress'
          const isCompleted = status === 'completed'
          const isError = status === 'error'
          
          return (
            <div
              key={phase.id}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg transition-all',
                isActive && 'bg-blue-500/10 border border-blue-500/20',
                isCompleted && 'bg-green-500/5',
                isError && 'bg-red-500/10 border border-red-500/20',
                !isActive && !isCompleted && !isError && 'opacity-50'
              )}
            >
              {/* Status Icon */}
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                isCompleted && 'bg-green-500/20',
                isActive && 'bg-blue-500/20',
                isError && 'bg-red-500/20',
                status === 'pending' && 'bg-zinc-800'
              )}>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                {isActive && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
                {isError && <XCircle className="w-4 h-4 text-red-400" />}
                {status === 'pending' && <Clock className="w-4 h-4 text-zinc-500" />}
              </div>

              {/* Phase Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'font-medium',
                    isActive && 'text-blue-400',
                    isCompleted && 'text-green-400',
                    isError && 'text-red-400',
                    status === 'pending' && 'text-zinc-500'
                  )}>
                    {index + 1}. {phase.label}
                  </span>
                  {isActive && (
                    <span className="text-xs text-blue-400/70">In progress...</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{phase.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Recent Events */}
      {progress.length > 0 && (
        <div className="pt-4 border-t border-zinc-800">
          <p className="text-xs text-zinc-500 mb-2">Activity log:</p>
          <div className="space-y-1 max-h-32 overflow-y-auto text-xs">
            {progress.slice(-8).map((event, idx) => (
              <div key={idx} className="flex items-start gap-2 text-zinc-400">
                <span className={cn(
                  'w-2 h-2 rounded-full mt-1 shrink-0',
                  event.status === 'completed' && 'bg-green-500',
                  event.status === 'in_progress' && 'bg-blue-500',
                  event.status === 'error' && 'bg-red-500',
                  event.status === 'pending' && 'bg-zinc-600'
                )} />
                <span className="text-zinc-500">[{event.phase}]</span>
                <span>{event.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
