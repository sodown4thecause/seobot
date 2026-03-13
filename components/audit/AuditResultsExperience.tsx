'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Mail,
  Presentation,
  Quote,
  RefreshCw,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { CitationSources } from '@/components/audit/CitationSources'
import { TopicalAuthorityMap } from '@/components/audit/TopicalAuthorityMap'
import { UpsellGate } from '@/components/audit/UpsellGate'
import type {
  AuditExecutionMeta,
  AuditResults,
  AuditShareModule,
  PlatformResult,
  TopicalMapResultPayload,
} from '@/lib/audit/types'

interface AuditResultsExperienceProps {
  results: AuditResults
  platformResults: PlatformResult[]
  topicalMapPayload?: TopicalMapResultPayload | null
  executionMeta?: AuditExecutionMeta | null
  auditId?: string | null
  onRunAnother?: () => void
}

interface EngineCard {
  engine: string
  surfaced: boolean
  bestPosition: number | null
  citations: number
  summary: string
}

function buildReportUrl(auditId?: string | null): string {
  if (typeof window === 'undefined') return ''
  if (!auditId) return window.location.href
  return new URL(`/audit/results/${auditId}`, window.location.origin).toString()
}

function buildEngineCards(platformResults: PlatformResult[]): EngineCard[] {
  return ['perplexity', 'grok', 'gemini'].map((platform) => {
    const engineResults = platformResults.filter((result) => result.platform === platform)
    const surfaced = engineResults.some((result) => result.brandMentioned)
    const positions = engineResults
      .map((result) => result.brandPosition)
      .filter((value): value is number => typeof value === 'number' && value > 0)
      .sort((a, b) => a - b)
    const citations = engineResults.reduce((sum, result) => sum + result.citationUrls.length, 0)
    const bestPosition = positions[0] ?? null

    return {
      engine: platform === 'perplexity' ? 'Perplexity' : platform === 'grok' ? 'Grok' : 'Gemini',
      surfaced,
      bestPosition,
      citations,
      summary: surfaced
        ? bestPosition
          ? `Surfaced with a best observed position of #${bestPosition}.`
          : 'Surfaced in this run and now has a clear path to stronger positioning.'
        : 'Not surfaced in this check yet, which creates a clean opportunity for expansion.',
    }
  })
}

function formatBullets(values: string[]): string {
  return values.map((value) => `• ${value}`).join('\n')
}

export function AuditResultsExperience({
  results,
  platformResults,
  topicalMapPayload,
  executionMeta,
  auditId,
  onRunAnother,
}: AuditResultsExperienceProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const scorecard = results.scorecard
  const reportUrl = buildReportUrl(auditId)

  if (!scorecard) {
    return (
      <div className="space-y-8">
        {executionMeta?.message ? (
          <div className="rounded-3xl border border-amber-200/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-50">
            {executionMeta.message}
          </div>
        ) : null}

        <section className="glass-panel rounded-[2rem] p-6 md:p-8">
          <div className="max-w-3xl space-y-4">
            <Badge className="border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200" variant="outline">
              AI Visibility Scorecard
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Your model checks are here, but the scorecard layer needs a fresh run.
            </h1>
            <p className="text-base leading-7 text-zinc-300">
              We captured the underlying audit signals, but the shareable scorecard package did not finish assembling. Run
              the scorecard again to restore the benchmark band, roadmap, and share cards.
            </p>
            <div className="flex flex-wrap gap-3">
              {onRunAnother ? (
                <Button className="bg-white text-black hover:bg-zinc-100" onClick={onRunAnother}>
                  Run another scorecard
                </Button>
              ) : null}
              {reportUrl ? (
                <Button
                  variant="outline"
                  className="border-white/10 bg-white/5 hover:bg-white/10"
                  onClick={() => {
                    void navigator.clipboard.writeText(reportUrl).catch(() => {})
                  }}
                >
                  Copy report link
                </Button>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    )
  }

  const engineCards = buildEngineCards(platformResults)
  const pdfModule = scorecard.shareModules.find((module) => module.format === 'pdf')
  const teamModule = scorecard.shareModules.find((module) => module.format === 'team')
  const executiveSummary = `${scorecard.teamSummary.headline}\n\n${scorecard.teamSummary.summary}\n${formatBullets(
    scorecard.teamSummary.bullets
  )}`
  const roadmapGroups = [
    { label: 'Next 7 days', items: scorecard.actionPlan.next7Days, tone: 'from-emerald-400/15 to-cyan-400/10' },
    { label: 'Next 30 days', items: scorecard.actionPlan.next30Days, tone: 'from-cyan-400/15 to-sky-400/10' },
    { label: 'Next 90 days', items: scorecard.actionPlan.next90Days, tone: 'from-fuchsia-400/10 to-rose-400/10' },
  ]

  const copyText = async (key: string, value: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedKey(key)
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1800)
    } catch {
      setCopiedKey(null)
    }
  }

  const handleShareModule = (module: AuditShareModule) => {
    if (module.format === 'x') {
      const url = new URL('https://twitter.com/intent/tweet')
      url.searchParams.set('text', module.shareText)
      if (reportUrl) {
        url.searchParams.set('url', reportUrl)
      }
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
      return
    }

    if (module.format === 'linkedin') {
      if (!reportUrl) {
        void copyText(module.key, module.shareText)
        return
      }
      const url = new URL('https://www.linkedin.com/sharing/share-offsite/')
      url.searchParams.set('url', reportUrl)
      window.open(url.toString(), '_blank', 'noopener,noreferrer')
      return
    }

    if (module.format === 'team') {
      const subject = encodeURIComponent(`${results.brand} AI Visibility Scorecard`)
      const body = encodeURIComponent(`${module.shareText}\n\n${reportUrl}`)
      window.location.href = `mailto:?subject=${subject}&body=${body}`
      return
    }

    if (module.format === 'pdf') {
      window.print()
      return
    }

    void copyText(module.key, `${module.shareText}${reportUrl ? `\n${reportUrl}` : ''}`)
  }

  return (
    <div className="space-y-8">
      {executionMeta?.message ? (
        <div className="rounded-3xl border border-amber-200/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-50">
          {executionMeta.message}
        </div>
      ) : null}

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="glass-panel relative overflow-hidden rounded-[2rem] p-6 md:p-8"
      >
        <div className="noise-overlay absolute inset-0" />
        <div className="relative grid gap-8 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-emerald-200" variant="outline">
                AI Visibility Scorecard
              </Badge>
              <Badge className="border-white/10 bg-white/5 px-3 py-1 text-zinc-200" variant="outline">
                {scorecard.momentumCategory.label}
              </Badge>
              <Badge className="border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-cyan-100" variant="outline">
                {scorecard.benchmarkBand.label}
              </Badge>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-zinc-400">Your brand in AI search</p>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                {results.brand} has clear AI visibility upside and a concrete path to the next level.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-zinc-300 md:text-lg">
                {scorecard.momentumCategory.summary}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Overall score', value: scorecard.overallScore, tone: 'from-emerald-300 to-cyan-200' },
                { label: 'AI visibility', value: scorecard.visibilityScore, tone: 'from-cyan-300 to-sky-200' },
                { label: 'AEO readiness', value: scorecard.aeoReadinessScore, tone: 'from-amber-200 to-emerald-200' },
                { label: 'Unlock potential', value: scorecard.unlockPotentialScore, tone: 'from-fuchsia-200 to-rose-200' },
              ].map((item) => (
                <div key={item.label} className="glass-card rounded-3xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{item.label}</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className={`bg-gradient-to-r ${item.tone} bg-clip-text text-4xl font-semibold text-transparent`}>
                      {item.value}
                    </span>
                    <span className="pb-1 text-sm text-zinc-500">/100</span>
                  </div>
                  <Progress value={item.value} className="mt-4 h-2 bg-white/5" indicatorClassName="bg-gradient-to-r from-emerald-400 to-cyan-300" />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button className="bg-white text-black hover:bg-zinc-100" onClick={() => void copyText('report-link', reportUrl)}>
                <Share2 className="mr-2 h-4 w-4" />
                {copiedKey === 'report-link' ? 'Link copied' : 'Copy report link'}
              </Button>
              <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10" onClick={() => void copyText('exec-summary', executiveSummary)}>
                <Copy className="mr-2 h-4 w-4" />
                {copiedKey === 'exec-summary' ? 'Summary copied' : 'Copy exec summary'}
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => {
                  if (pdfModule) {
                    handleShareModule(pdfModule)
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Print / PDF
              </Button>
              {auditId ? (
                <Link href={`/audit/results/${auditId}`}>
                  <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-white">
                    Open shareable report
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] p-6">
            <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Benchmark read</p>
            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/15 text-emerald-200">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{scorecard.benchmarkBand.label}</p>
                  <p className="text-sm text-zinc-400">Built to make low scores feel strategic, not punitive.</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-zinc-300">{scorecard.benchmarkBand.summary}</p>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[1.5rem] border border-white/8 bg-gradient-to-br from-emerald-400/10 to-cyan-400/10 p-5">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-emerald-200" />
                  <div>
                    <p className="text-sm font-medium text-white">Fastest win</p>
                    <p className="text-sm text-zinc-300">{scorecard.fastestWin.title}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{scorecard.fastestWin.action}</p>
              </div>

              <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-5 w-5 text-cyan-100" />
                  <div>
                    <p className="text-sm font-medium text-white">Biggest opportunity</p>
                    <p className="text-sm text-zinc-300">{scorecard.biggestOpportunity.title}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{scorecard.biggestOpportunity.detail}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="glass-card rounded-[1.75rem] p-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-200" />
            <div>
              <h2 className="text-xl font-semibold text-white">What is already working</h2>
              <p className="text-sm text-zinc-400">Lead with momentum before you look at gaps.</p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {scorecard.strengths.map((strength) => (
              <div key={strength.title} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <p className="text-sm font-medium text-white">{strength.title}</p>
                <p className="mt-2 text-sm leading-7 text-zinc-300">{strength.detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[1.75rem] p-6">
          <div className="flex items-start gap-3">
            <Presentation className="h-5 w-5 text-cyan-100" />
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-white">Model-by-model snapshot</h2>
              <p className="max-w-xl text-sm leading-6 text-zinc-400">
                Show which engines already surface you and where expansion is cleanest.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {engineCards.map((engine) => (
              <div key={engine.engine} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{engine.engine}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                      {engine.surfaced ? 'Surfaced in this run' : 'High headroom'}
                    </p>
                  </div>
                  <Badge className={engine.surfaced ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200' : 'border-white/10 bg-white/5 text-zinc-300'} variant="outline">
                    {engine.surfaced ? 'Live signal' : 'Next lever'}
                  </Badge>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Best position</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{engine.bestPosition ? `#${engine.bestPosition}` : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Citations</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{engine.citations}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-300">{engine.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="glass-card rounded-[1.75rem] p-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-emerald-200" />
            <div>
              <h2 className="text-xl font-semibold text-white">Opportunity scorecard</h2>
              <p className="text-sm text-zinc-400">Every weakness is paired with a concrete next move.</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            {scorecard.opportunities.map((opportunity) => (
              <div key={opportunity.id} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-white">{opportunity.title}</p>
                  <Badge className="border-white/10 bg-white/5 text-zinc-200" variant="outline">
                    {opportunity.expectedLift}
                  </Badge>
                  <Badge className="border-white/10 bg-white/5 text-zinc-400" variant="outline">
                    {opportunity.timeframe}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-zinc-300">{opportunity.detail}</p>
                <div className="mt-4 rounded-2xl border border-emerald-400/10 bg-emerald-400/8 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/75">Recommended next step</p>
                  <p className="mt-2 text-sm leading-7 text-emerald-50">{opportunity.action}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card rounded-[1.75rem] p-6">
            <div className="flex items-center gap-3">
              <Quote className="h-5 w-5 text-cyan-100" />
              <div>
                <h2 className="text-xl font-semibold text-white">Show this to your team</h2>
                <p className="text-sm text-zinc-400">A client-safe summary that makes the result easy to forward.</p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
              <p className="text-lg font-medium text-white">{scorecard.teamSummary.headline}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-300">{scorecard.teamSummary.summary}</p>
              <ul className="mt-4 space-y-2">
                {scorecard.teamSummary.bullets.map((bullet) => (
                  <li key={bullet} className="text-sm text-zinc-200">
                    • {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button className="bg-white text-black hover:bg-zinc-100" onClick={() => void copyText('team-summary', executiveSummary)}>
                <Copy className="mr-2 h-4 w-4" />
                {copiedKey === 'team-summary' ? 'Copied' : 'Copy team summary'}
              </Button>
              <Button
                variant="outline"
                className="border-white/10 bg-white/5 hover:bg-white/10"
                onClick={() => {
                  if (teamModule) {
                    handleShareModule(teamModule)
                  }
                }}
              >
                <Mail className="mr-2 h-4 w-4" />
                Email team
              </Button>
            </div>
          </div>

          <div className="glass-card rounded-[1.75rem] p-6">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-emerald-200" />
              <div>
                <h2 className="text-xl font-semibold text-white">Shareable slices</h2>
                <p className="text-sm text-zinc-400">Designed to be screenshot-friendly and easy to repost.</p>
              </div>
            </div>

            <div className="mt-5 flex snap-x gap-3 overflow-x-auto pb-2">
              {scorecard.shareModules.map((module) => (
                <div key={module.key} className="min-w-[280px] snap-start rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{module.format}</p>
                  <p className="mt-3 text-lg font-medium text-white">{module.title}</p>
                  <p className="mt-1 text-sm text-emerald-100">{module.subtitle}</p>
                  <p className="mt-4 text-sm leading-7 text-zinc-300">{module.summary}</p>
                  <Button
                    variant={module.format === 'linkedin' ? 'default' : 'outline'}
                    className={module.format === 'linkedin' ? 'mt-5 bg-white text-black hover:bg-zinc-100' : 'mt-5 border-white/10 bg-white/5 hover:bg-white/10'}
                    onClick={() => handleShareModule(module)}
                  >
                    {module.format === 'pdf' ? <Download className="mr-2 h-4 w-4" /> : <Share2 className="mr-2 h-4 w-4" />}
                    {copiedKey === module.key ? 'Copied' : module.ctaLabel}
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="glass-card rounded-[1.75rem] p-6">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-emerald-200" />
              <div>
                <h2 className="text-xl font-semibold text-white">7 / 30 / 90 day roadmap</h2>
                <p className="text-sm text-zinc-400">A low score still leaves with a real plan, not a dead end.</p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {roadmapGroups.map((group) => (
                <div key={group.label} className={`rounded-[1.5rem] border border-white/8 bg-gradient-to-br ${group.tone} p-5`}>
                  <p className="text-sm font-medium text-white">{group.label}</p>
                  <ul className="mt-4 space-y-3">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-7 text-zinc-200">
                        <span className="mt-2 h-1.5 w-1.5 rounded-full bg-white/60" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {topicalMapPayload ? <TopicalAuthorityMap payload={topicalMapPayload} /> : null}
      <CitationSources urls={results.citationUrls} />

      <UpsellGate
        auditId={auditId || null}
        brand={results.brand}
        visibilityRate={results.visibilityRate}
        topCompetitor={results.topCompetitor}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="text-sm text-zinc-400">
          Rerun this scorecard monthly to turn a snapshot into a momentum benchmark.
        </div>
        {onRunAnother ? (
          <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-white" onClick={onRunAnother}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run another scorecard
          </Button>
        ) : (
          <Link href="/audit">
            <Button variant="ghost" className="text-zinc-300 hover:bg-white/5 hover:text-white">
              <ArrowRight className="mr-2 h-4 w-4" />
              Run another scorecard
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
