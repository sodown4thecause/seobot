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
    label: 'Preview Ready',
    description: 'Locking your confirmed brand context before the live model checks run.',
    progress: 25,
  },
  {
    id: 'running-checks',
    label: 'Running AI Checks',
    description: 'Querying Perplexity, Grok, and Gemini for buyer-intent results and source patterns.',
    progress: 60,
  },
  {
    id: 'scoring',
    label: 'Scoring Momentum',
    description: 'Translating raw signals into strengths, opportunity areas, and the roadmap.',
    progress: 90,
  },
  {
    id: 'done',
    label: 'Scorecard Ready',
    description: 'Rendering your scorecard, share modules, and saved report link.',
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
    <Card className="glass-card rounded-[1.75rem] border-white/8 bg-white/[0.03]">
      <CardHeader>
        <CardTitle className="text-lg text-white">Building your scorecard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={currentStage.progress} className="bg-white/5" indicatorClassName="bg-gradient-to-r from-emerald-400 to-cyan-300" />
        <div className="space-y-2">
          {STAGES.map((stage, index) => {
            const isComplete = index < currentIndex || (phase === 'done' && index === currentIndex)
            const isActive = phase !== 'done' && index === currentIndex

            return (
              <div key={stage.id} className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                {isComplete ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                ) : isActive ? (
                  <Loader2 className="mt-0.5 h-4 w-4 animate-spin text-cyan-200" />
                ) : (
                  <div className="mt-1 h-3 w-3 rounded-full bg-white/15" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{stage.label}</p>
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
