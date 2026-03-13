'use client'

import { useState } from 'react'
import { AuditForm } from '@/components/audit/AuditForm'
import { BrandConfirmation } from '@/components/audit/BrandConfirmation'
import { AuditResultsExperience } from '@/components/audit/AuditResultsExperience'
import { ProgressStages } from '@/components/audit/ProgressStages'
import {
  generateSessionId,
  trackAuditCompleted,
  trackAuditFailed,
  trackAuditStarted,
  trackEmailCaptured,
} from '@/lib/analytics/audit-tracker'
import type {
  AuditExecutionMeta,
  AuditResults,
  BrandDetectionPayload,
  PlatformResult,
  TopicalMapResultPayload,
} from '@/lib/audit/types'

type Stage = 'form' | 'confirm' | 'results'
type RunPhase = 'idle' | 'detecting' | 'running-checks' | 'scoring' | 'done'

interface RequestState {
  domain: string
}

export function AuditFlow() {
  const [stage, setStage] = useState<Stage>('form')
  const [requestState, setRequestState] = useState<RequestState | null>(null)
  const [detected, setDetected] = useState<BrandDetectionPayload | null>(null)
  const [results, setResults] = useState<AuditResults | null>(null)
  const [platformResults, setPlatformResults] = useState<PlatformResult[]>([])
  const [executionMeta, setExecutionMeta] = useState<AuditExecutionMeta | null>(null)
  const [topicalMapPayload, setTopicalMapPayload] = useState<TopicalMapResultPayload | null>(null)
  const [auditId, setAuditId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [runPhase, setRunPhase] = useState<RunPhase>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleDetect = async (input: RequestState) => {
    const nextSessionId = generateSessionId()

    setSessionId(nextSessionId)
    setLoading(true)
    setRunPhase('detecting')
    setError(null)

    trackAuditStarted({
      sessionId: nextSessionId,
      url: input.domain,
      properties: {
        source: 'live-audit',
      },
    })

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect', ...input }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.detected) {
        throw new Error(payload.message || 'Detection failed')
      }

      setRequestState(input)
      setDetected(payload.detected)
      setTopicalMapPayload(null)
      setAuditId(null)
      setStage('confirm')

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Detection failed'

      setError(message)
      trackAuditFailed({
        sessionId: nextSessionId,
        url: input.domain,
        properties: {
          source: 'live-audit',
          phase: 'detect',
          error: message,
        },
      })
    } finally {
      setLoading(false)
      setRunPhase('idle')
    }
  }

  const handleConfirm = async (input: { context: BrandDetectionPayload; email: string }) => {
    if (!requestState) return
    const { context, email } = input

    const activeSessionId = sessionId || generateSessionId()
    if (!sessionId) {
      setSessionId(activeSessionId)
    }

    setLoading(true)
    setError(null)

    try {
      setRunPhase('running-checks')
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          domain: requestState.domain,
          email,
          confirmedContext: context,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.results) {
        throw new Error(payload.message || 'Audit failed')
      }

      setRunPhase('scoring')
      setResults(payload.results)
      setPlatformResults(payload.platformResults || [])
      setExecutionMeta(payload.executionMeta || null)
      setTopicalMapPayload(payload.topicalMapPayload || null)
      const resolvedAuditId = typeof payload.auditId === 'string' ? payload.auditId : null

      setAuditId(resolvedAuditId)
      setRunPhase('done')
      setStage('results')

      trackEmailCaptured({
        sessionId: activeSessionId,
        url: requestState.domain,
        email,
        brandName: context.brand,
        properties: {
          source: 'live-audit',
          category: context.category,
        },
      })

      trackAuditCompleted({
        sessionId: activeSessionId,
        auditId: resolvedAuditId || undefined,
        url: requestState.domain,
        email,
        brandName: context.brand,
        properties: {
          source: 'live-audit',
          category: context.category,
          visibilityRate: payload.results.visibilityRate,
          topCompetitor: payload.results.topCompetitor,
        },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Audit failed'

      setError(message)
      trackAuditFailed({
        sessionId: activeSessionId,
        url: requestState.domain,
        email,
        brandName: context.brand,
        properties: {
          source: 'live-audit',
          category: context.category,
          phase: 'run',
          error: message,
        },
      })
    } finally {
      setLoading(false)
      setRunPhase('idle')
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 md:px-8">
      <header className="space-y-4 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">Free AI Visibility Scorecard</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
          Discover how your brand shows up in AI search and where the next upside lives.
        </h1>
        <p className="mx-auto max-w-3xl text-base leading-7 text-zinc-300 md:text-lg">
          Check your presence across Perplexity, Grok, and Gemini, then leave with a polished scorecard, topical opportunity map, and a 7 / 30 / 90 day action plan.
        </p>
      </header>

      {error ? <p className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-50">{error}</p> : null}

      {stage === 'form' ? <AuditForm onSubmit={handleDetect} loading={loading} /> : null}

      {stage === 'confirm' && detected ? (
        <div className="space-y-4">
          {loading ? <ProgressStages phase={runPhase === 'idle' ? 'detecting' : runPhase} /> : null}
          <BrandConfirmation detected={detected} onConfirm={handleConfirm} loading={loading} />
        </div>
      ) : null}

      {stage === 'results' && results ? (
        <div className="space-y-6">
          <AuditResultsExperience
            results={results}
            platformResults={platformResults}
            topicalMapPayload={topicalMapPayload}
            executionMeta={executionMeta}
            auditId={auditId}
            onRunAnother={() => {
              setStage('form')
              setRequestState(null)
              setDetected(null)
              setResults(null)
              setPlatformResults([])
              setExecutionMeta(null)
              setTopicalMapPayload(null)
              setAuditId(null)
              setError(null)
              setRunPhase('idle')
            }}
          />
        </div>
      ) : null}
    </section>
  )
}
