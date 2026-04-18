'use client'

import { Check, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SubredditDiscovery as SubredditDiscoveryType } from '@/lib/reddit-gap/types'

interface SubredditDiscoveryProps {
  subreddits: SubredditDiscoveryType[]
  selected: string[]
  onSelectionChange: (selected: string[]) => void
  onAnalyze: () => void
  topic: string
}

export function SubredditDiscovery({
  subreddits,
  selected,
  onSelectionChange,
  onAnalyze,
  topic,
}: SubredditDiscoveryProps) {
  const toggleSubreddit = (name: string) => {
    if (selected.includes(name)) {
      onSelectionChange(selected.filter((s) => s !== name))
    } else {
      onSelectionChange([...selected, name])
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {subreddits.map((sub) => {
          const isSelected = selected.includes(sub.name)
          return (
            <button
              key={sub.name}
              onClick={() => toggleSubreddit(sub.name)}
              className={`text-left p-4 border transition-all ${
                isSelected
                  ? 'border-white bg-white/[0.06]'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white">r/{sub.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2 mb-2">{sub.description}</p>
                  <div className="flex gap-3 text-xs font-mono text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {sub.subscribers.toLocaleString()}
                    </span>
                    <span>Relevance: {sub.relevanceScore}%</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="text-center">
        <p className="text-xs font-mono text-zinc-500 mb-4">
          {selected.length} of {subreddits.length} subreddits selected
        </p>
        <Button
          size="lg"
          disabled={selected.length === 0}
          onClick={onAnalyze}
          className="h-14 px-10 bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider text-base disabled:opacity-50"
        >
          Analyze {topic}
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}