'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GeoEngine } from '@/lib/geo/types'
import { getChatModeAccentClasses } from '@/lib/chat/modes'

const ENGINE_LABELS: Record<GeoEngine, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
  google_ai_overview: 'Google AI Overviews',
}

const DEFAULT_SCAN_ENGINES: GeoEngine[] = [
  'chatgpt',
  'claude',
  'gemini',
  'perplexity',
  'google_ai_overview',
]

interface GeoScanProgressProps {
  engines?: string[]
  defaultEngines?: string[]
  className?: string
}

export function GeoScanProgress({ engines, defaultEngines, className }: GeoScanProgressProps) {
  const accent = getChatModeAccentClasses('geo')
  const fallbackEngines = defaultEngines?.length ? defaultEngines : DEFAULT_SCAN_ENGINES
  const visibleEngines = (engines?.length ? engines : fallbackEngines).filter(
    (engine): engine is GeoEngine => engine in ENGINE_LABELS
  )
  const scanEngines = visibleEngines.length > 0 ? visibleEngines : DEFAULT_SCAN_ENGINES

  return (
    <div
      className={cn(
        'my-4 rounded-2xl border p-5',
        accent.borderPanel,
        accent.bgPanel,
        className
      )}
      role="status"
      aria-live="polite"
      aria-label="Probing AI search engines"
    >
      <div className="mb-4 flex items-center gap-3">
        <Loader2 className={cn('h-4 w-4 animate-spin', accent.textLabel)} aria-hidden="true" />
        <div>
          <p className={cn('text-sm font-medium', accent.textLabel)}>Probing AI search engines…</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            Engines run in parallel; results appear when the scan is complete.
          </p>
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {scanEngines.map((engine) => (
          <div
            key={engine}
            className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2"
          >
            <Loader2 className={cn('h-3.5 w-3.5 animate-spin', accent.textLabel)} aria-hidden="true" />
            <span className="text-xs text-zinc-300">Probing {ENGINE_LABELS[engine]}…</span>
          </div>
        ))}
      </div>
    </div>
  )
}
