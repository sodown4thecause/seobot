'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { AuditResultsExperience } from '@/components/audit/AuditResultsExperience'
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
      const previousContent = existing.getAttribute('content')
      existing.setAttribute('content', content)

      return () => {
        if (previousContent === null) {
          existing.removeAttribute('content')
        } else {
          existing.setAttribute('content', previousContent)
        }
      }
    }

    const tag = document.createElement('meta')
    tag.setAttribute('name', 'robots')
    tag.setAttribute('content', content)
    document.head.appendChild(tag)

    return () => {
      tag.remove()
    }
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
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">AI Visibility Scorecard</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Loading your saved scorecard...</h1>
      </section>
    )
  }

  if (!state.payload?.results || !state.payload.platformResults) {
    const title = state.status === 400 ? 'Invalid report link' : 'Report unavailable'

    return (
      <section className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">AI Visibility Scorecard</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-50">
          {state.message || 'This audit report could not be loaded.'}
        </p>
        <p className="text-sm text-zinc-300">
          Need a fresh report? <Link href="/audit" className="underline">Run a new AI visibility audit.</Link>
        </p>
      </section>
    )
  }

  const { results, platformResults, executionMeta, auditId, topicalMapPayload } = state.payload

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 md:px-8">
      <header className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">AI Visibility Scorecard</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Saved scorecard for {results.brand}</h1>
        <p className="text-zinc-300">Shared report links stay stable so your team can review, export, and benchmark progress later.</p>
      </header>

      <div className="glass-card rounded-[1.5rem] border-white/8 bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Share visibility</p>
        <p className="mt-1 text-sm text-zinc-300">Current: {visibility}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateVisibility('unlisted')}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200"
          >
            Unlisted
          </button>
          <button
            type="button"
            onClick={() => updateVisibility('public')}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200"
          >
            Publish
          </button>
          <button
            type="button"
            onClick={() => updateVisibility('private')}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-zinc-200"
          >
            Private
          </button>
        </div>
        {state.message ? (
          <p className="mt-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-50">{state.message}</p>
        ) : null}
      </div>

      <AuditResultsExperience
        results={results}
        platformResults={platformResults}
        topicalMapPayload={topicalMapPayload}
        executionMeta={executionMeta}
        auditId={typeof auditId === 'string' ? auditId : null}
      />
    </section>
  )
}
