'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { GeoRecommendedFix } from '@/lib/geo/recommended-fixes'
import { CheckCircle2, XCircle, Sparkles, ArrowRight } from 'lucide-react'

interface GeoBrandScanResultsProps {
  toolInvocation: {
    args?: { brand?: string; query?: string }
    result?: GeoScanResult
    state?: string
  }
  onGenerateFix?: (prompt: string) => void
}

interface PlatformRow {
  platform: string
  brandMentioned: boolean
  sentiment: string
  mentionContext: string | null
  competitorsMentioned: string[]
  citations: Array<{ title: string; url: string }>
  error?: string
}

interface GeoScanResult {
  success?: boolean
  brand?: string
  query?: string
  platforms?: PlatformRow[]
  summary?: {
    mentionedOn: number
    totalPlatforms: number
    shareOfVoice: number
    overallSentiment: string
  }
  recommendedFixes?: GeoRecommendedFix[]
}

function sentimentColor(sentiment: string) {
  if (sentiment === 'positive' || sentiment === 'Positive') return 'text-emerald-400'
  if (sentiment === 'negative' || sentiment === 'Negative') return 'text-rose-400'
  if (sentiment === 'not_mentioned' || sentiment === 'Not mentioned') return 'text-zinc-500'
  return 'text-amber-400'
}

export function GeoBrandScanResults({ toolInvocation, onGenerateFix }: GeoBrandScanResultsProps) {
  const result = toolInvocation.result as GeoScanResult | undefined
  const isLoading = toolInvocation.state !== 'result' && !result?.success

  if (isLoading) {
    return (
      <div className="my-4 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 animate-pulse">
        <p className="text-sm text-violet-300">Scanning AI platforms for brand visibility…</p>
      </div>
    )
  }

  if (!result?.success) {
    return (
      <div className="my-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
        Brand scan failed. Try again with a specific brand name and query.
      </div>
    )
  }

  const fixes = result.recommendedFixes ?? []

  return (
    <Card className="my-4 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 shadow-xl border-l-4 border-l-violet-500/60">
      <CardHeader className="border-b border-zinc-800 bg-zinc-900/40 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold">
              AI Visibility Scan — {result.brand}
            </CardTitle>
            <p className="mt-1 text-sm text-zinc-400">Query: &ldquo;{result.query}&rdquo;</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-violet-500/30 text-violet-300">
              {result.summary?.shareOfVoice ?? 0}% share of voice
            </Badge>
            <Badge variant="outline" className="border-zinc-700 text-zinc-300">
              {result.summary?.mentionedOn ?? 0}/{result.summary?.totalPlatforms ?? 5} platforms
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(result.platforms ?? []).map((platform) => (
            <div
              key={platform.platform}
              className={cn(
                'rounded-xl border p-4',
                platform.brandMentioned
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : 'border-zinc-800 bg-zinc-900/30'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{platform.platform}</span>
                {platform.brandMentioned ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-zinc-600" />
                )}
              </div>
              <p className={cn('mt-2 text-xs', sentimentColor(platform.sentiment))}>
                {platform.brandMentioned ? platform.sentiment : 'Not mentioned'}
              </p>
              {platform.mentionContext && (
                <p className="mt-2 text-xs leading-relaxed text-zinc-400 line-clamp-3">
                  &ldquo;{platform.mentionContext}&rdquo;
                </p>
              )}
              {platform.competitorsMentioned.length > 0 && (
                <p className="mt-2 text-[11px] text-zinc-500">
                  Competitors: {platform.competitorsMentioned.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>

        {fixes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-zinc-200">Recommended fixes</h3>
            </div>
            <div className="grid gap-3">
              {fixes.map((fix) => (
                <div
                  key={fix.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-zinc-100">{fix.title}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            fix.priority === 'high'
                              ? 'border-rose-500/30 text-rose-300'
                              : 'border-zinc-700 text-zinc-400'
                          )}
                        >
                          {fix.priority}
                        </Badge>
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{fix.rationale}</p>
                    </div>
                    {onGenerateFix && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 border-violet-500/30 text-violet-200 hover:bg-violet-500/10"
                        onClick={() =>
                          onGenerateFix(
                            `Fix this GEO visibility gap for ${result.brand} on query "${result.query}". ` +
                              `Call geo_generate_fix with fixType="${fix.fixType}", targetPlatforms=${JSON.stringify(fix.targetPlatforms)}, ` +
                              `rationale="${fix.rationale.replace(/"/g, "'")}", and generateContent=true to produce the draft.`
                          )
                        }
                      >
                        Generate fix
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
