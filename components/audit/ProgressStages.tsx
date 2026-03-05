'use client'

import { CheckCircle2, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

type ProgressPhase = 'detecting' | 'running-checks' | 'scoring' | 'done'

interface ProgressStagesProps {
  phase: ProgressPhase
}

const STAGES: Array<{ id: ProgressPhase; label: string; description: string; progress: number }> = [
  {
    id: 'detecting',
    label: 'Detection Confirmed',
    description: 'Locking your confirmed brand context before expensive checks.',
    progress: 25,
  },
  {
    id: 'running-checks',
    label: 'Running 5 AI Checks',
    description: 'Querying Perplexity, Grok, and Gemini for buyer-intent results.',
    progress: 60,
  },
  {
    id: 'scoring',
    label: 'Scoring and Normalizing',
    description: 'Computing visibility rate, competitor pressure, and citations.',
    progress: 90,
  },
  {
    id: 'done',
    label: 'Audit Complete',
    description: 'Rendering your report and preparing your recap email.',
    progress: 100,
  },
]

function phaseIndex(phase: ProgressPhase): number {
  return STAGES.findIndex((stage) => stage.id === phase)
}

export function ProgressStages({ phase }: ProgressStagesProps) {
  const currentIndex = phaseIndex(phase)
  const currentStage = STAGES[Math.max(0, currentIndex)]

  return (
    <Card className="border-white/10 bg-zinc-950 text-white">
      <CardHeader>
        <CardTitle className="text-lg uppercase tracking-wide">Audit In Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={currentStage.progress} />
        <div className="space-y-2">
          {STAGES.map((stage, index) => {
            const isComplete = index < currentIndex || (phase === 'done' && index === currentIndex)
            const isActive = phase !== 'done' && index === currentIndex

            return (
              <div key={stage.id} className="flex items-start gap-3 rounded-md border border-white/10 bg-zinc-900/60 p-3">
                {isComplete ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                ) : isActive ? (
                  <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-emerald-400" />
                ) : (
                  <div className="mt-1 h-3 w-3 rounded-full bg-zinc-700" />
                )}
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{stage.label}</p>
                  <p className="text-xs text-zinc-400">{stage.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
