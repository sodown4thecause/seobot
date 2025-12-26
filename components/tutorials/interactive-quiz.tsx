'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InteractiveQuizProps {
  question: string
  options: string[]
  correct?: string | number
  explanation?: string
  onComplete: (score: number) => void
  isCompleted?: boolean
}

export function InteractiveQuiz({
  question,
  options,
  correct,
  explanation,
  onComplete,
  isCompleted = false
}: InteractiveQuizProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSelect = (index: number) => {
    if (isCompleted || showResult) return
    setSelected(index)
  }

  const handleSubmit = () => {
    if (selected === null) return

    const correctIndex = typeof correct === 'number' 
      ? correct 
      : options.findIndex(opt => opt === correct)
    
    const correctAnswer = correctIndex === selected
    setIsCorrect(correctAnswer)
    setShowResult(true)

    // Calculate score (100 for correct, 0 for incorrect)
    const score = correctAnswer ? 100 : 0
    onComplete(score)
  }

  const correctIndex = typeof correct === 'number' 
    ? correct 
    : options.findIndex(opt => opt === correct)

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-4">{question}</h3>
          <div className="space-y-2">
            {options.map((option, index) => {
              const isSelected = selected === index
              const isCorrectOption = index === correctIndex
              const showCorrect = showResult && isCorrectOption
              const showIncorrect = showResult && isSelected && !isCorrectOption

              return (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  disabled={isCompleted || showResult}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition-all",
                    isSelected && !showResult && "border-primary bg-primary/10",
                    showCorrect && "border-green-500 bg-green-500/10",
                    showIncorrect && "border-red-500 bg-red-500/10",
                    !isSelected && !showResult && "border-border hover:border-primary/50",
                    (isCompleted || showResult) && "cursor-default"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-500" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {showResult && (
          <div className={cn(
            "p-4 rounded-lg",
            isCorrect ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"
          )}>
            <div className="flex items-start gap-2">
              {isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                {explanation && (
                  <p className="text-sm text-muted-foreground mt-1">{explanation}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {!isCompleted && !showResult && selected !== null && (
          <Button onClick={handleSubmit} className="w-full">
            Submit Answer
          </Button>
        )}

        {isCompleted && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Quiz completed</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

