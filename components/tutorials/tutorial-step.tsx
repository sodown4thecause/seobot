'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InteractiveQuiz } from './interactive-quiz'
import { LiveDemo } from './live-demo'
import type { TutorialStep as TutorialStepType } from '@/lib/tutorials/types'

interface TutorialStepProps {
  step: TutorialStepType
  stepNumber: number
  isCompleted: boolean
  onComplete?: (result?: { quizScore?: number; demoExecuted?: boolean }) => void
}

export function TutorialStep({ step, stepNumber, isCompleted, onComplete }: TutorialStepProps) {
  const renderStepContent = () => {
    switch (step.action) {
      case 'QUIZ':
        if (step.interactive) {
          return (
            <InteractiveQuiz
              question={step.interactive.question || ''}
              options={step.interactive.options || []}
              correct={step.interactive.correct}
              explanation={step.interactive.explanation}
              onComplete={(score) => onComplete?.({ quizScore: score })}
              isCompleted={isCompleted}
            />
          )
        }
        break

      case 'TOOL_DEMO':
        return (
          <LiveDemo
            tool={step.tool}
            highlightParams={step.highlightParams}
            liveDemo={step.liveDemo}
            onComplete={() => onComplete?.({ demoExecuted: true })}
            isCompleted={isCompleted}
          />
        )

      case 'EXPLAIN':
      case 'PRACTICE':
      case 'REVIEW':
      default:
        return (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="whitespace-pre-wrap">{step.content}</div>
            {step.interactive && (
              <div className="mt-4">
                <InteractiveQuiz
                  question={step.interactive.question || ''}
                  options={step.interactive.options || []}
                  correct={step.interactive.correct}
                  explanation={step.interactive.explanation}
                  onComplete={(score) => onComplete?.({ quizScore: score })}
                  isCompleted={isCompleted}
                />
              </div>
            )}
            {!isCompleted && (
              <div className="mt-6">
                <button
                  onClick={() => onComplete?.()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Mark as Complete
                </button>
              </div>
            )}
          </div>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {stepNumber}. {step.title}
        </CardTitle>
        {step.estimatedTime && (
          <p className="text-sm text-muted-foreground">
            Estimated time: {step.estimatedTime}
          </p>
        )}
      </CardHeader>
      <CardContent>
        {renderStepContent()}
      </CardContent>
    </Card>
  )
}

