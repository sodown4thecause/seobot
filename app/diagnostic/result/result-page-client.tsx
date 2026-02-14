'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Copy, Loader2, Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { DiagnosticModel, DiagnosticResultPublic } from '@/lib/diagnostic-types'

interface ResultPageClientProps {
  id: string
}

export function ResultPageClient({ id }: ResultPageClientProps) {
  const [result, setResult] = useState<DiagnosticResultPublic | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadResult() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/diagnostic/result/${id}`, {
          cache: 'no-store',
        })

        const payload = (await response.json()) as DiagnosticResultPublic & { error?: string }
        if (!response.ok) {
          throw new Error(payload.error || 'Unable to load diagnostic result')
        }

        if (!cancelled) {
          setResult(payload)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : 'Something went wrong')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadResult()
    return () => {
      cancelled = true
    }
  }, [id])

  const engineOrder: DiagnosticModel[] = useMemo(() => ['gemini', 'perplexity', 'grok'], [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08121a] text-cyan-100">
        <div className="flex items-center gap-3 text-lg">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading your snapshot...
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#08121a] px-6 text-center text-cyan-100">
        <p className="max-w-md text-lg">{error || 'Snapshot not found or expired.'}</p>
        <Link href="/diagnostic" className="underline underline-offset-4">
          Run a new snapshot
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08121a] text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/diagnostic" className="text-sm text-cyan-100/75 hover:text-cyan-100">
            {'<- Run another snapshot'}
          </Link>
          {result.incomplete ? (
            <span className="rounded-full border border-amber-300/40 bg-amber-500/15 px-3 py-1 text-xs uppercase tracking-[0.15em] text-amber-100">
              Incomplete data
            </span>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-3xl border border-cyan-100/10 bg-gradient-to-br from-[#0f2b3a] to-[#0a1f2b] p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-100/70">AI Influence Score</p>
            <div className="mt-4 flex items-end gap-4">
              <span className="text-7xl font-semibold tracking-tight">{result.aiInfluenceScore}</span>
              <span className="pb-2 text-cyan-100/65">/ 100</span>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-cyan-100/75">
                  <span>Recommendation rate</span>
                  <span>{Math.round(result.recommendationRate * 100)}%</span>
                </div>
                <Progress value={result.recommendationRate * 100} className="h-2 bg-cyan-100/10" indicatorClassName="bg-[#49e0b8]" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-cyan-100/75">
                  <span>Engine coverage</span>
                  <span>{Math.round(result.engineCoverage * 100)}%</span>
                </div>
                <Progress value={result.engineCoverage * 100} className="h-2 bg-cyan-100/10" indicatorClassName="bg-[#7bcfff]" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm text-cyan-100/75">
                  <span>Citation rate</span>
                  <span>{Math.round(result.citationRate * 100)}%</span>
                </div>
                <Progress value={result.citationRate * 100} className="h-2 bg-cyan-100/10" indicatorClassName="bg-[#a7f3d0]" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-cyan-100/10 bg-[#0a1f2b] p-8">
            <h2 className="text-lg font-semibold">AI perception category</h2>
            <p className="mt-3 text-2xl font-medium text-[#74ebca]">{result.aiPerceptionCategory}</p>
            <p className="mt-3 text-sm text-cyan-100/75">{result.aiPerceptionInsight}</p>

            <div className="mt-6 rounded-2xl border border-cyan-100/10 bg-cyan-950/20 p-4">
              <p className="text-xs uppercase tracking-[0.15em] text-cyan-100/60">Primary AI competitor</p>
              <p className="mt-2 text-base text-cyan-100">{result.primaryAICompetitor}</p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-cyan-100/10 bg-[#0a1f2b] p-8">
          <h2 className="text-xl font-semibold">Engine breakdown</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {engineOrder.map((engine) => {
              const data = result.engineBreakdown[engine]
              return (
                <div key={engine} className="rounded-2xl border border-cyan-100/10 bg-[#071723] p-4">
                  <p className="text-sm uppercase tracking-[0.15em] text-cyan-100/70">{engine}</p>
                  <div className="mt-3 space-y-1 text-sm">
                    <p>Mentioned: {data.mentioned ? 'Yes' : 'No'}</p>
                    <p>Recommended: {data.recommended ? 'Yes' : 'No'}</p>
                    <p>Cited: {data.cited ? 'Yes' : 'No'}</p>
                    <p>Best position: {data.bestPosition ?? '-'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-cyan-100/10 bg-[#0a1f2b] p-8">
            <h2 className="text-xl font-semibold">Share card</h2>
            <div className="mt-4 overflow-hidden rounded-2xl border border-cyan-100/10">
              <img src={result.shareCardSvgDataUrl} alt="AI Influence share card" className="w-full" />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a href={result.xShareIntentUrl} target="_blank" rel="noopener noreferrer">
                <Button className="bg-[#49e0b8] text-[#04231a] hover:bg-[#74ebca]">
                  <Share2 className="mr-2 h-4 w-4" /> Share on X
                </Button>
              </a>
              <Button
                variant="outline"
                onClick={handleCopy}
                className="border-cyan-100/30 bg-transparent text-cyan-100 hover:bg-cyan-100/10"
              >
                <Copy className="mr-2 h-4 w-4" /> {copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-100/10 bg-[#0a1f2b] p-8">
            <h2 className="text-xl font-semibold">Next step</h2>
            <p className="mt-3 text-sm text-cyan-100/75">
              Unlock a deep scan with broader keyword coverage, richer competitor insights, and extended AI visibility
              diagnostics.
            </p>
            <Button className="mt-6 w-full bg-[#49e0b8] text-[#04231a] hover:bg-[#74ebca]">
              Start Deep Scan (Step 2)
            </Button>
          </div>
        </section>

        {result.incompleteReasons.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-100">Incomplete details</h3>
            <ul className="mt-2 space-y-1 text-sm text-amber-50/90">
              {result.incompleteReasons.map((reason) => (
                <li key={reason}>- {reason}</li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}
