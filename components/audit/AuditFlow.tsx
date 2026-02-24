'use client'

import { useState } from 'react'
import { AuditForm } from '@/components/audit/AuditForm'
import { BrandConfirmation } from '@/components/audit/BrandConfirmation'
import { CitationSources } from '@/components/audit/CitationSources'
import { PlatformBreakdown } from '@/components/audit/PlatformBreakdown'
import { ResultsHero } from '@/components/audit/ResultsHero'
import { UpsellGate } from '@/components/audit/UpsellGate'
import type { AuditResults, BrandDetectionPayload, PlatformResult } from '@/lib/audit/types'

type Stage = 'form' | 'confirm' | 'results'

interface RequestState {
  domain: string
  email: string
}

export function AuditFlow() {
  const [stage, setStage] = useState<Stage>('form')
  const [requestState, setRequestState] = useState<RequestState | null>(null)
  const [detected, setDetected] = useState<BrandDetectionPayload | null>(null)
  const [results, setResults] = useState<AuditResults | null>(null)
  const [platformResults, setPlatformResults] = useState<PlatformResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDetect = async (input: RequestState) => {
    setLoading(true)
    setError(null)

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
      setStage('confirm')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Detection failed')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (context: BrandDetectionPayload) => {
    if (!requestState) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          ...requestState,
          confirmedContext: context,
        }),
      })

      const payload = await response.json()
      if (!response.ok || !payload.results) {
        throw new Error(payload.message || 'Audit failed')
      }

      setResults(payload.results)
      setPlatformResults(payload.platformResults || [])
      setStage('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Audit failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 md:px-8">
      <header className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">Free AI Visibility Audit</p>
        <h1 className="text-3xl font-bold tracking-tight">Is AI Recommending Your Competitors Instead of You?</h1>
        <p className="text-muted-foreground">
          Submit your domain, confirm your market context, and get a 5-check competitor visibility readout in under a minute.
        </p>
      </header>

      {error ? <p className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {stage === 'form' ? <AuditForm onSubmit={handleDetect} loading={loading} /> : null}

      {stage === 'confirm' && detected ? (
        <BrandConfirmation detected={detected} onConfirm={handleConfirm} loading={loading} />
      ) : null}

      {stage === 'results' && results ? (
        <div className="space-y-6">
          <ResultsHero results={results} />
          <PlatformBreakdown summary={results.platformResults} rawResults={platformResults} />
          <CitationSources urls={results.citationUrls} />
          <UpsellGate
            brand={results.brand}
            visibilityRate={results.visibilityRate}
            topCompetitor={results.topCompetitor}
          />
        </div>
      ) : null}
    </section>
  )
}
