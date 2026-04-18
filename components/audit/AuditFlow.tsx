'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

import { AuditForm } from '@/components/audit/AuditForm'
import { BrandConfirmation } from '@/components/audit/BrandConfirmation'
import { CitationSources } from '@/components/audit/CitationSources'
import { PlatformBreakdown } from '@/components/audit/PlatformBreakdown'
import { ProgressStages } from '@/components/audit/ProgressStages'
import { ResultsHero } from '@/components/audit/ResultsHero'
import { UpsellGate } from '@/components/audit/UpsellGate'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
} from '@/lib/audit/types'

type Stage = 'form' | 'confirm' | 'loading' | 'gate' | 'results'
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
  const [auditId, setAuditId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [runPhase, setRunPhase] = useState<RunPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [gateEmail, setGateEmail] = useState('')

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
    setStage('loading')
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
      setGateEmail(email)
      const resolvedAuditId = typeof payload.auditId === 'string' ? payload.auditId : null

      setAuditId(resolvedAuditId)
      setRunPhase('done')
      setStage('gate')

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
      setStage('confirm')
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

  const unlockResults = () => {
    if (!requestState || !results || !sessionId || !detected) {
      return
    }

    trackEmailCaptured({
      sessionId,
      url: requestState.domain,
      email: gateEmail,
      brandName: results.brand,
      properties: {
        source: 'live-audit',
        category: detected.category,
        gateSource: 'gate-unlock',
      },
    })

    setStage('results')
  }

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 md:px-8">
      <header className="space-y-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-zinc-300">Free Reddit Content Gap Report</p>
        <h1 className="text-3xl font-black uppercase italic tracking-tight text-white md:text-5xl">
          Stop Writing for Robots. Start Answering the Questions Your Buyers Are Asking Right Now.
        </h1>
        <p className="mx-auto max-w-3xl text-zinc-400">
          We scan your competitors, analyze real-time Reddit discussions, and deliver a priority content gap report with AI-ready briefs — in 60 seconds.
        </p>
      </header>

      {error ? <p className="rounded-md border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 p-6 md:p-8">
        <AnimatePresence mode="wait">
          {stage === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <AuditForm onSubmit={handleDetect} loading={loading} />
            </motion.div>
          ) : null}

          {stage === 'confirm' && detected ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-4"
            >
              <BrandConfirmation detected={detected} onConfirm={handleConfirm} loading={loading} />
            </motion.div>
          ) : null}

          {stage === 'loading' ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-white/20">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              </div>
              <ProgressStages phase={runPhase === 'idle' ? 'running-checks' : runPhase} />
            </motion.div>
          ) : null}

          {stage === 'gate' && results ? (
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-xl space-y-5 text-center"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Report ready</p>
              <h2 className="text-3xl font-black uppercase italic text-white">Unlock your content gap report</h2>
              <p className="text-zinc-400">
                Your analysis is complete. Confirm where we should send your content gap report and priority briefs.
              </p>
              <Input
                value={gateEmail}
                onChange={(event) => setGateEmail(event.target.value)}
                type="email"
                placeholder="you@company.com"
                className="border-white/15 bg-zinc-900 text-white"
              />
              <Button
                onClick={unlockResults}
                className="w-full bg-white text-black hover:bg-zinc-200"
                disabled={!gateEmail.includes('@')}
              >
                Show content gap results
              </Button>
            </motion.div>
          ) : null}

          {stage === 'results' && results ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-6"
            >
              {executionMeta?.message ? (
                <p className="rounded-md border border-zinc-700 bg-zinc-900 p-3 text-sm text-zinc-200">
                  {executionMeta.message}
                </p>
              ) : null}
              <ResultsHero results={results} />
              <PlatformBreakdown summary={results.platformResults} rawResults={platformResults} />
              <CitationSources urls={results.citationUrls} />
              <UpsellGate
                auditId={auditId}
                brand={results.brand}
                visibilityRate={results.visibilityRate}
                topCompetitor={results.topCompetitor}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  )
}
