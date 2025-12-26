'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Clock, CheckCircle2, Play, Lock } from 'lucide-react'
import { TutorialContainer } from '@/components/tutorials/tutorial-container'
import { TUTORIAL_REGISTRY, getAvailableTutorials } from '@/lib/tutorials'
import type { Tutorial, TutorialProgress } from '@/lib/tutorials/types'

export default function TutorialsPage() {
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null)
  const [progressMap, setProgressMap] = useState<Map<string, TutorialProgress>>(new Map())
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [])

  const loadProgress = async () => {
    try {
      const response = await fetch('/api/tutorials/progress')
      if (!response.ok) {
        throw new Error('Failed to fetch progress')
      }
      
      const data = await response.json()
      
      // Deserialize dates from ISO strings
      const allProgress: TutorialProgress[] = data.progress.map((p: Record<string, unknown>) => ({
        ...p,
        startedAt: p.startedAt ? new Date(p.startedAt as string) : new Date(),
        completedAt: p.completedAt ? new Date(p.completedAt as string) : undefined,
        lastAccessedAt: p.lastAccessedAt ? new Date(p.lastAccessedAt as string) : new Date()
      }))
      
      const progress = new Map<string, TutorialProgress>()
      allProgress.forEach(p => progress.set(p.tutorialId, p))
      
      setProgressMap(progress)
      setCompletedIds(data.completedIds || [])
    } catch (error) {
      console.error('Failed to load tutorial progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const availableTutorials = getAvailableTutorials(completedIds)

  const getTutorialProgress = (tutorialId: string): TutorialProgress | undefined => {
    return progressMap.get(tutorialId)
  }

  const getProgressPercentage = (tutorial: Tutorial): number => {
    const progress = getTutorialProgress(tutorial.id)
    if (!progress) return 0
    return (progress.completedSteps.length / tutorial.steps.length) * 100
  }

  const isLocked = (tutorial: Tutorial): boolean => {
    return tutorial.prerequisites.some(prereq => !completedIds.includes(prereq))
  }

  const handleTutorialComplete = async () => {
    await loadProgress()
    setSelectedTutorial(null)
  }

  if (selectedTutorial) {
    return (
      <div className="container mx-auto py-6">
        <TutorialContainer
          tutorial={selectedTutorial}
          onComplete={handleTutorialComplete}
          onExit={() => setSelectedTutorial(null)}
        />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">Loading tutorials...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Tutorials</h1>
        <p className="text-muted-foreground">
          Learn SEO and AEO step-by-step with interactive tutorials
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {TUTORIAL_REGISTRY.map((tutorial) => {
          const progress = getTutorialProgress(tutorial.id)
          const progressPercentage = getProgressPercentage(tutorial)
          const locked = isLocked(tutorial)
          const completed = completedIds.includes(tutorial.id)

          return (
            <Card key={tutorial.id} className={locked ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      {tutorial.title}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {tutorial.description}
                    </CardDescription>
                  </div>
                  {locked && <Lock className="w-5 h-5 text-muted-foreground" />}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Badge variant="outline">{tutorial.difficulty}</Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {tutorial.estimatedTime}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {progress && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{progress.completedSteps.length} / {tutorial.steps.length}</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                )}

                {completed && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Completed</span>
                  </div>
                )}

                <Button
                  onClick={() => setSelectedTutorial(tutorial)}
                  disabled={locked}
                  className="w-full"
                  variant={progress ? 'default' : 'outline'}
                >
                  {completed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Review Tutorial
                    </>
                  ) : progress ? (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Continue
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Tutorial
                    </>
                  )}
                </Button>

                {locked && (
                  <p className="text-xs text-muted-foreground">
                    Complete prerequisites first
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

