'use client'

import { Check, CheckCircle2, Circle, ExternalLink, Minus, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getChatModeAccentClasses } from '@/lib/chat/modes'
import type { GeoCitationDelta } from '@/lib/geo/citation-delta'

export interface CitationDeltaReportProps {
  delta: GeoCitationDelta
  cycle?: {
    brand?: string | null
    query?: string | null
    shippedUrl?: string | null
    status?: string | null
    createdAt?: Date | string | null
    shippedAt?: Date | string | null
    lastVerifiedAt?: Date | string | null
  }
}

const STATUS_STEPS = [
  ['scanning', 'Scanned'],
  ['fix_proposed', 'Fix proposed'],
  ['shipped', 'Shipped'],
  ['verifying', 'Verifying'],
] as const

function formatRate(rate: number) {
  return `${Math.round(rate * 100)}%`
}

function formatDate(value?: Date | string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function humanEngine(engine: string) {
  return engine.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function verdictLabel(verdict: string) {
  return verdict.replace('_', ' ')
}

export function CitationDeltaReport({ delta, cycle }: CitationDeltaReportProps) {
  const accent = getChatModeAccentClasses('geo')
  const verdict = delta.verdict
  const statusIndex = STATUS_STEPS.findIndex(([status]) => status === cycle?.status)
  const verdictReached = ['improved', 'no_change', 'regressed'].includes(cycle?.status ?? '')

  return (
    <Card className="my-4 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl">
      <CardHeader className={cn('border-b bg-zinc-900/40', accent.borderPanel)}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', accent.textLabel)}>
              Citation Delta
            </p>
            <CardTitle className="mt-2 text-xl">
              {cycle?.brand ?? 'Your brand'} AI visibility changed from {formatRate(delta.mentionRateBefore)} to {formatRate(delta.mentionRateAfter)}
            </CardTitle>
            {cycle?.query && <p className="mt-1 text-sm text-zinc-400">Query: “{cycle.query}”</p>}
          </div>
          <Badge className={cn('border bg-transparent capitalize', accent.borderPanel, accent.textLabel)}>
            {verdictLabel(verdict)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        {delta.perEngine.some((engine) => engine.shippedUrlCited) && (
          <div className={cn('flex items-start gap-3 rounded-xl border p-4', accent.borderPanel, accent.bgPanel)}>
            <CheckCircle2 className={cn('mt-0.5 h-5 w-5 shrink-0', accent.textLabel)} />
            <div className="min-w-0">
              <p className={cn('font-medium', accent.textLabel)}>Your published fix is now cited</p>
              <p className="mt-1 text-sm text-zinc-400">
                {cycle?.shippedUrl ? (
                  <a className="inline-flex items-center gap-1 hover:text-zinc-200" href={cycle.shippedUrl} target="_blank" rel="noreferrer">
                    {cycle.shippedUrl}<ExternalLink className="h-3 w-3" />
                  </a>
                ) : 'The published fix appeared in a verification citation.'}
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <div className="grid min-w-[620px] grid-cols-[1.2fr_1fr_1fr_1.4fr] border-b border-zinc-800 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            <span>Engine</span><span>Mentioned</span><span>Sentiment</span><span>Citations</span>
          </div>
          <div className="divide-y divide-zinc-800">
            {delta.perEngine.map((engine) => {
              const gained = engine.current.citedDomains.filter((domain) => !engine.baseline.citedDomains.includes(domain))
              const lost = engine.baseline.citedDomains.filter((domain) => !engine.current.citedDomains.includes(domain))
              return (
                <div key={engine.engine} className="grid min-w-[620px] grid-cols-[1.2fr_1fr_1fr_1.4fr] items-center px-4 py-3 text-sm">
                  <span className="font-medium">{humanEngine(engine.engine)}</span>
                  <span className="flex items-center gap-2 text-xs">
                    <Mentioned value={engine.baseline.mentioned} />
                    <span className="text-zinc-600">→</span>
                    <Mentioned value={engine.current.mentioned} />
                  </span>
                  <span className="text-xs text-zinc-400">
                    {engine.baseline.sentiment ?? '—'} <span className="text-zinc-600">→</span> {engine.current.sentiment ?? '—'}
                  </span>
                  <span className="flex flex-wrap gap-1 text-[11px]">
                    {gained.length > 0 && <span className="text-emerald-400">+{gained.length} gained</span>}
                    {lost.length > 0 && <span className="text-rose-400">−{lost.length} lost</span>}
                    {gained.length === 0 && lost.length === 0 && <span className="text-zinc-600">No change</span>}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">Cycle timeline</p>
          <div className="grid gap-3 sm:grid-cols-5">
            {STATUS_STEPS.map(([status, label], index) => {
              const complete = statusIndex >= index || verdictReached
              return (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', complete ? cn(accent.borderPanel, accent.bgPanel, accent.textLabel) : 'border-zinc-800 text-zinc-600')}>
                    {complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                  </span>
                  <span className={complete ? 'text-zinc-200' : 'text-zinc-600'}>{label}</span>
                </div>
              )
            })}
            <div className="flex items-center gap-2 text-xs">
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', verdictReached ? cn(accent.borderPanel, accent.bgPanel, accent.textLabel) : 'border-zinc-800 text-zinc-600')}>
                {verdictReached ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
              </span>
              <span className={verdictReached ? 'text-zinc-200' : 'text-zinc-600'}>Verdict</span>
            </div>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-zinc-500">
          Methodology: each engine was double-probed and treated as mentioned if either probe mentioned the brand.
          Baseline: {formatDate(delta.runsCompared.baselineAt)} · Current: {formatDate(delta.runsCompared.currentAt)} · {delta.runsCompared.verificationCount} successful verification probes.
          This reports what changed after you shipped {cycle?.shippedUrl ? cycle.shippedUrl : 'the fix'}; it does not claim the fix caused the change.
        </p>
      </CardContent>
    </Card>
  )
}

function Mentioned({ value }: { value: boolean }) {
  return value
    ? <span className="inline-flex items-center gap-1 text-emerald-400"><Check className="h-3 w-3" />Yes</span>
    : <span className="inline-flex items-center gap-1 text-zinc-500"><X className="h-3 w-3" />No</span>
}

export function CitationDeltaReportArtifact({ data }: { data: unknown }) {
  const value = data as {
    delta?: GeoCitationDelta
    cycle?: CitationDeltaReportProps['cycle'] & { latestDelta?: GeoCitationDelta | null }
  } | null
  const delta = value?.delta ?? value?.cycle?.latestDelta
  return delta ? <CitationDeltaReport delta={delta} cycle={value?.cycle} /> : null
}
