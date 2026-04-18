'use client'

interface ProgressStagesProps {
  phase: 'idle' | 'searching-reddit' | 'scraping-threads' | 'analyzing-gaps' | 'scoring' | 'done'
}

const STAGES = [
  { key: 'searching-reddit', label: 'Scanning Reddit for pain points...' },
  { key: 'scraping-threads', label: 'Reading thread discussions...' },
  { key: 'analyzing-gaps', label: 'Analyzing content gaps...' },
  { key: 'scoring', label: 'Scoring opportunities...' },
] as const

export function ProgressStages({ phase }: ProgressStagesProps) {
  if (phase === 'idle' || phase === 'done') return null

  const currentStageIndex = STAGES.findIndex((s) => s.key === phase)

  return (
    <div className="space-y-3 max-w-md mx-auto">
      {STAGES.map((stage, index) => {
        const isActive = stage.key === phase
        const isCompleted = currentStageIndex > index
        return (
          <div
            key={stage.key}
            className={`flex items-center gap-3 text-sm font-mono transition-all duration-300 ${
              isActive ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isActive ? 'bg-emerald-400 scale-125' : isCompleted ? 'bg-zinc-400' : 'bg-zinc-700'
              }`}
            />
            <span>{stage.label}</span>
            {isActive && <span className="animate-pulse text-emerald-400">●</span>}
            {isCompleted && <span className="text-emerald-500">✓</span>}
          </div>
        )
      })}
    </div>
  )
}