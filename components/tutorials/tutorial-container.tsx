'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Check, BookOpen, Clock } from 'lucide-react'
import { TutorialStep } from './tutorial-step'
import type { Tutorial, TutorialProgress } from '@/lib/tutorials/types'

interface TutorialContainerProps {
  tutorial: Tutorial
  onComplete?: () => void
  onExit?: () => void
}

export function TutorialContainer({ tutorial, onComplete, onExit }: TutorialContainerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<TutorialProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProgress = useCallback(async () => {
    try {
      // Get existing progress
      const response = await fetch(`/api/tutorials/progress?tutorialId=${tutorial.id}`)
      if (!response.ok) throw new Error('Failed to fetch progress')
      
      const data = await response.json()
      
      if (data.progress) {
        const existingProgress: TutorialProgress = {
          ...data.progress,
          startedAt: new Date(data.progress.startedAt),
          completedAt: data.progress.completedAt ? new Date(data.progress.completedAt) : undefined,
          lastAccessedAt: new Date(data.progress.lastAccessedAt)
        }
        setCurrentStepIndex(existingProgress.currentStepIndex)
        setCompletedSteps(new Set(existingProgress.completedSteps))
        setProgress(existingProgress)
      } else {
        // Start tutorial
        const startResponse = await fetch('/api/tutorials/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', tutorialId: tutorial.id })
        })
        if (!startResponse.ok) throw new Error('Failed to start tutorial')
        
        const startData = await startResponse.json()
        const newProgress: TutorialProgress = {
          ...startData.progress,
          startedAt: new Date(startData.progress.startedAt),
          completedAt: startData.progress.completedAt ? new Date(startData.progress.completedAt) : undefined,
          lastAccessedAt: new Date(startData.progress.lastAccessedAt)
        }
        setProgress(newProgress)
      }
    } catch (error) {
      console.error('Failed to load tutorial progress:', error)
    } finally {
      setIsLoading(false)
    }
  }, [tutorial.id])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const currentStep = tutorial.steps[currentStepIndex]
  const progressPercentage = tutorial.steps.length > 0
    ? ((completedSteps.size + (completedSteps.has(currentStep.id) ? 0 : 1)) / tutorial.steps.length) * 100
    : 0

  const handleStepComplete = async (stepId: string, result?: { quizScore?: number; demoExecuted?: boolean }) => {
    const newCompleted = new Set(completedSteps)
    newCompleted.add(stepId)
    setCompletedSteps(newCompleted)

    try {
      await fetch('/api/tutorials/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'completeStep',
          tutorialId: tutorial.id,
          stepId,
          stepIndex: currentStepIndex,
          options: {
            quizScore: result?.quizScore,
            demoExecuted: result?.demoExecuted,
            metadata: {}
          }
        })
      })
    } catch (error) {
      console.error('Failed to save step completion:', error)
    }

    // Move to next step or complete tutorial
    if (currentStepIndex < tutorial.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    } else {
      // Tutorial complete
      if (onComplete) {
        onComplete()
      }
    }
  }

  const handleNext = () => {
    if (currentStepIndex < tutorial.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">Loading tutorial...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto glass-card border-none bg-black/40">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-zinc-100">
              <BookOpen className="w-5 h-5 text-zinc-400" />
              {tutorial.title}
            </CardTitle>
            <CardDescription className="mt-2 text-zinc-400">
              {tutorial.description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{tutorial.difficulty}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {tutorial.estimatedTime}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>Progress</span>
            <span>{completedSteps.size} / {tutorial.steps.length} steps</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Step {currentStepIndex + 1} of {tutorial.steps.length}</span>
          {completedSteps.has(currentStep.id) && (
            <Badge variant="secondary" className="gap-1">
              <Check className="w-3 h-3" />
              Completed
            </Badge>
          )}
        </div>

        {/* Current Step */}
        <TutorialStep
          step={currentStep}
          stepNumber={currentStepIndex + 1}
          isCompleted={completedSteps.has(currentStep.id)}
          onComplete={(result) => handleStepComplete(currentStep.id, result)}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          {onExit && (
            <Button variant="ghost" onClick={onExit}>
              Exit Tutorial
            </Button>
          )}

          {currentStepIndex < tutorial.steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!completedSteps.has(currentStep.id)}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => handleStepComplete(currentStep.id)}
              disabled={!completedSteps.has(currentStep.id)}
            >
              Complete Tutorial
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

