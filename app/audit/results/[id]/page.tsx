'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { CitationSources } from '@/components/audit/CitationSources'
import { PlatformBreakdown } from '@/components/audit/PlatformBreakdown'
import { ResultsHero } from '@/components/audit/ResultsHero'
import { SharePanel } from '@/components/audit/SharePanel'
import { TopicalAuthorityMap } from '@/components/audit/TopicalAuthorityMap'
import { UpsellGate } from '@/components/audit/UpsellGate'
import { trackResultsViewed } from '@/lib/analytics/audit-tracker'
import type { AuditResponsePayload } from '@/lib/audit/types'

interface AuditResultsPageProps {
  params: Promise<{ id: string }>
}

interface LoadState {
  loading: boolean
  payload: AuditResponsePayload | null
  status: number | null
  message: string | null
}

export default function AuditResultsPage({ params }: AuditResultsPageProps) {
  const { id } = use(params)
  const [state, setState] = useState<LoadState>({
    loading: true,
    payload: null,
    status: null,
    message: null,
  })
  const [visibility, setVisibility] = useState<'unlisted' | 'public' | 'private'>('unlisted')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch(`/api/audit/results/${id}`, {
          cache: 'no-store',
        })
        const payload = (await response.json()) as AuditResponsePayload

        if (!active) {
          return
        }

        if (!response.ok) {
          setState({
            loading: false,
            payload: null,
            status: response.status,
            message: payload.message || 'This audit report is unavailable.',
          })
          return
        }

        if (payload.results) {
          trackResultsViewed({
            sessionId: `audit_report_${id}`,
            auditId: typeof payload.auditId === 'string' ? payload.auditId : id,
            brandName: payload.results.brand,
            properties: {
              source: 'reopened-report',
              visibilityRate: payload.results.visibilityRate,
              topCompetitor: payload.results.topCompetitor,
            },
          })
        }

        setState({
          loading: false,
          payload,
          status: response.status,
          message: null,
        })
        const resolvedVisibility =
          payload.publicVisibility || payload.topicalMapPayload?.publicVisibility || 'unlisted'
        setVisibility(resolvedVisibility)
      } catch {
        if (!active) {
          return
        }

        setState({
          loading: false,
          payload: null,
          status: 500,
          message: 'We could not load this report right now. Please try again shortly.',
        })
      }
    }

    void load()

    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    const content = visibility === 'public' ? 'index,follow' : 'noindex,nofollow'
    const existing = document.querySelector('meta[name="robots"]')
    if (existing) {
      existing.setAttribute('content', content)
      return
    }

    const tag = document.createElement('meta')
    tag.setAttribute('name', 'robots')
    tag.setAttribute('content', content)
    document.head.appendChild(tag)
  }, [visibility])

  const updateVisibility = async (nextVisibility: 'unlisted' | 'public' | 'private') => {
    try {
      const response = await fetch(`/api/audit/results/${id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: nextVisibility }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        setState((prev) => ({ ...prev, message: payload.message || 'Unable to update visibility.' }))
        return
      }

      setVisibility(nextVisibility)
      setState((prev) => {
        if (!prev.payload) return prev
        return {
          ...prev,
          payload: {
            ...prev.payload,
            publicVisibility: nextVisibility,
            topicalMapPayload: prev.payload.topicalMapPayload
              ? {
                  ...prev.payload.topicalMapPayload,
                  publicVisibility: nextVisibility,
                }
              : prev.payload.topicalMapPayload,
          },
          message: null,
        }
      })
    } catch {
      setState((prev) => ({ ...prev, message: 'Unable to update visibility.' }))
    }
  }

  if (state.loading) {
    return (
      <section className="mx-auto w-full max-w-5xl space-y-4 px-4 py-10 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">AI Visibility Audit Report</p>
        <h1 className="text-3xl font-bold tracking-tight">Loading your completed report...</h1>
      </section>
    )
  }

  if (!state.payload?.results || !state.payload.platformResults) {
    const title = state.status === 400 ? 'Invalid report link' : 'Report unavailable'

    return (
      <section className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">AI Visibility Audit Report</p>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {state.message || 'This audit report could not be loaded.'}
        </p>
        <p className="text-sm text-muted-foreground">
          Need a fresh report? <Link href="/audit" className="underline">Run a new AI visibility audit.</Link>
        </p>
      </section>
    )
  }

  const { results, platformResults, executionMeta, auditId, topicalMapPayload } = state.payload

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 md:px-8">
      <header className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">AI Visibility Audit Report</p>
        <h1 className="text-3xl font-bold tracking-tight">Re-opened audit for {results.brand}</h1>
        <p className="text-muted-foreground">Shared report links stay stable so your team can review findings later.</p>
      </header>

      {executionMeta?.message ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{executionMeta.message}</p>
      ) : null}

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Share Visibility</p>
        <p className="mt-1 text-sm text-zinc-700">Current: {visibility}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateVisibility('unlisted')}
            className="rounded border border-zinc-300 bg-white px-3 py-1 text-sm"
          >
            Unlisted
          </button>
          <button
            type="button"
            onClick={() => updateVisibility('public')}
            className="rounded border border-zinc-300 bg-white px-3 py-1 text-sm"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={() => updateVisibility('private')}
            className="rounded border border-zinc-300 bg-white px-3 py-1 text-sm"
          >
            Private
          </button>
        </div>
      </div>

      <ResultsHero results={results} />
      <PlatformBreakdown summary={results.platformResults} rawResults={platformResults} />
      <CitationSources urls={results.citationUrls} />
      {topicalMapPayload ? <TopicalAuthorityMap payload={topicalMapPayload} /> : null}
      {topicalMapPayload ? <SharePanel artifacts={topicalMapPayload.shareArtifacts} /> : null}
      <UpsellGate
        auditId={typeof auditId === 'string' ? auditId : null}
        brand={results.brand}
        visibilityRate={results.visibilityRate}
        topCompetitor={results.topCompetitor}
      />
    </section>
  )
}
