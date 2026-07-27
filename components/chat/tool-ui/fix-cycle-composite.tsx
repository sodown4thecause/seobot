'use client'

import { Check, Circle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GeoFixPlanResult } from './geo-fix-plan-result'
import { cn } from '@/lib/utils'
import { getChatModeAccentClasses } from '@/lib/chat/modes'
import type { GeoFixPlan } from '@/lib/geo/fix-generator'

interface FixCycleCompositeProps {
  result?: {
    success?: boolean
    cycle?: {
      brand?: string
      query?: string
      status?: string
      engines?: string[]
      baselineRunIds?: string[]
      fixPlan?: GeoFixPlan | null
      shippedUrl?: string | null
    }
  }
}

const STEPS = [
  ['scanning', 'Scanned'],
  ['fix_proposed', 'Fix proposed'],
  ['shipped', 'Shipped'],
  ['verifying', 'Verifying'],
] as const

export function FixCycleComposite({ result }: FixCycleCompositeProps) {
  const cycle = result?.cycle
  const accent = getChatModeAccentClasses('geo')
  const activeIndex = STEPS.findIndex(([status]) => status === cycle?.status)

  if (!result?.success || !cycle) {
    return <div className="my-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-200">GEO fix cycle could not be loaded.</div>
  }

  return (
    <Card className="my-4 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl">
      <CardHeader className="border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={cn('text-xs font-semibold uppercase tracking-widest', accent.textLabel)}>GEO fix cycle</p>
            <CardTitle className="mt-1 text-lg">{cycle.brand} — “{cycle.query}”</CardTitle>
          </div>
          <Badge variant="outline" className={cn('capitalize', accent.borderPanel, accent.textLabel)}>
            {cycle.status?.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Engines" value={String(cycle.engines?.length ?? 0)} />
          <Metric label="Successful baseline runs" value={String(cycle.baselineRunIds?.length ?? 0)} />
          <Metric label="Published fix" value={cycle.shippedUrl ? 'Shipped' : 'Not shipped'} />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {STEPS.map(([status, label], index) => {
            const complete = activeIndex >= index
            return (
              <div key={status} className="flex items-center gap-2 text-xs">
                <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border', complete ? cn(accent.borderPanel, accent.bgPanel, accent.textLabel) : 'border-zinc-800 text-zinc-600')}>
                  {complete ? <Check className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                </span>
                <span className={complete ? 'text-zinc-200' : 'text-zinc-600'}>{label}</span>
              </div>
            )
          })}
        </div>

        {cycle.fixPlan ? (
          <GeoFixPlanResult toolInvocation={{ result: { success: true, plan: cycle.fixPlan } }} />
        ) : (
          <p className="rounded-xl border border-zinc-800 p-4 text-sm text-zinc-500">Fix plan is still being prepared.</p>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-100">{value}</p>
    </div>
  )
}
