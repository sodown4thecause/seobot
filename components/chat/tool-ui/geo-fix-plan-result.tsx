'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles } from 'lucide-react'

interface GeoFixPlanResultProps {
  toolInvocation: {
    result?: {
      success?: boolean
      plan?: {
        title: string
        fixType: string
        brand: string
        query: string
        targetPlatforms: string[]
        contentBrief: {
          objective: string
          suggestedTitle: string
          targetKeywords: string[]
          outline: string[]
          aeoStructure: string[]
          estimatedImpact: string
        }
      }
      generatedContent?: {
        title?: string
        content?: string
        wordCount?: number
      }
      nextStep?: string
    }
  }
}

export function GeoFixPlanResult({ toolInvocation }: GeoFixPlanResultProps) {
  const result = toolInvocation.result
  const plan = result?.plan

  if (!result?.success || !plan) {
    return (
      <div className="my-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
        Fix plan generation failed.
      </div>
    )
  }

  const brief = plan.contentBrief

  return (
    <Card className="my-4 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 border-l-4 border-l-emerald-500/50">
      <CardHeader className="border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-wrap items-center gap-3">
          <Sparkles className="h-5 w-5 text-emerald-400" />
          <div>
            <CardTitle className="text-lg">{plan.title}</CardTitle>
            <p className="text-sm text-zinc-400">
              {plan.brand} — &ldquo;{plan.query}&rdquo;
            </p>
          </div>
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-300">
            {plan.fixType.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6 text-sm">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Objective</h4>
          <p className="mt-1 text-zinc-300">{brief.objective}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Suggested title</h4>
          <p className="mt-1 font-medium text-zinc-100">{brief.suggestedTitle}</p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Outline</h4>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-400">
            {brief.outline.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">AEO structure</h4>
          <ul className="mt-2 space-y-1 text-zinc-400">
            {brief.aeoStructure.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-emerald-400">{brief.estimatedImpact}</p>

        {result.generatedContent?.content && (
          <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Generated draft ({result.generatedContent.wordCount ?? '—'} words)
            </h4>
            <div className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-zinc-300">
              {result.generatedContent.content.slice(0, 3000)}
              {(result.generatedContent.content.length ?? 0) > 3000 ? '…' : ''}
            </div>
          </div>
        )}

        {result.nextStep && (
          <p className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
            Next step: {result.nextStep}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function GeoFixPlanArtifact({ data }: { data: unknown }) {
  return (
    <GeoFixPlanResult toolInvocation={{ result: data as GeoFixPlanResultProps['toolInvocation']['result'] }} />
  )
}
