'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface UsageSummary {
  currentSpendUsd: number
  limitUsd: number | null
  remainingUsd: number | null
  isUnlimited: boolean
  totalCalls: number
  totalTokens: number
  topAgentType: string
  resetDate: string
}

export function UsageSummaryCard({ className }: { className?: string }) {
  const [summary, setSummary] = useState<UsageSummary | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/usage/summary', { credentials: 'include' })
        if (!response.ok) {
          throw new Error('Failed to load usage')
        }
        const data = (await response.json()) as UsageSummary
        if (!cancelled) {
          setSummary(data)
        }
      } catch {
        if (!cancelled) {
          setError(true)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (error || !summary) {
    return null
  }

  const spendLabel = summary.isUnlimited
    ? `$${summary.currentSpendUsd.toFixed(2)} this month`
    : `$${summary.currentSpendUsd.toFixed(2)} / $${(summary.limitUsd ?? 0).toFixed(2)}`

  const usagePercent =
    summary.isUnlimited || !summary.limitUsd
      ? 0
      : Math.min(100, (summary.currentSpendUsd / summary.limitUsd) * 100)

  return (
    <div
      className={cn(
        'rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-300',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium text-zinc-200">AI usage</span>
        <span>{spendLabel}</span>
      </div>
      {!summary.isUnlimited && summary.limitUsd ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-red-500/80 transition-all"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
        <span>{summary.totalCalls} calls</span>
        <span>{summary.totalTokens.toLocaleString()} tokens</span>
        {summary.topAgentType !== 'none' ? <span>Top: {summary.topAgentType}</span> : null}
      </div>
    </div>
  )
}
