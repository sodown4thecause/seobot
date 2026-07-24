'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ExternalLink, MessageSquare, Share2, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ProofCycleRow {
  id: string
  brand: string
  query: string
  status: string
  latestVerdict: string
  nextVerifyAt: string | null
  createdAt: string
  shareToken: string | null
}

export function ProofDashboard({ initialCycles }: { initialCycles: ProofCycleRow[] }) {
  const [cycles, setCycles] = useState(initialCycles)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function share(cycleId: string) {
    setBusyId(cycleId)
    setError(null)
    try {
      const response = await fetch(`/api/geo/fix-cycles/${cycleId}/share`, { method: 'POST' })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? 'Could not create share link')
      await navigator.clipboard?.writeText(body.shareUrl)
      setCycles((current) => current.map((cycle) => cycle.id === cycleId ? { ...cycle, shareToken: body.shareToken } : cycle))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create share link')
    } finally {
      setBusyId(null)
    }
  }

  async function revoke(cycleId: string) {
    setBusyId(cycleId)
    setError(null)
    try {
      const response = await fetch(`/api/geo/fix-cycles/${cycleId}/share`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Could not revoke share link')
      setCycles((current) => current.map((cycle) => cycle.id === cycleId ? { ...cycle, shareToken: null } : cycle))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not revoke share link')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-200">{error}</p>}
      {cycles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-10 text-center">
          <h2 className="text-lg font-medium text-zinc-200">No proof cycles yet</h2>
          <p className="mt-2 text-sm text-zinc-500">Start a GEO fix cycle in chat to measure what changes after you ship a fix.</p>
          <Button asChild className="mt-5 bg-violet-600 hover:bg-violet-500">
            <Link href="/dashboard?mode=geo"><MessageSquare className="mr-2 h-4 w-4" />Open GEO chat</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-800">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900/50 text-xs uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="px-4 py-3">Brand / query</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verdict</th>
                <th className="px-4 py-3">Next verification</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {cycles.map((cycle) => (
                <tr key={cycle.id} className="text-zinc-300">
                  <td className="px-4 py-4">
                    <p className="font-medium text-zinc-100">{cycle.brand}</p>
                    <p className="mt-1 max-w-[260px] truncate text-xs text-zinc-500">{cycle.query}</p>
                  </td>
                  <td className="px-4 py-4"><Badge variant="outline" className="capitalize">{cycle.status.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-4 capitalize text-zinc-400">{cycle.latestVerdict.replace('_', ' ')}</td>
                  <td className="px-4 py-4 text-xs text-zinc-400">{formatDate(cycle.nextVerifyAt)}</td>
                  <td className="px-4 py-4 text-xs text-zinc-500">{formatDate(cycle.createdAt)}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-zinc-400 hover:text-zinc-100">
                        <Link href="/dashboard?mode=geo" aria-label="Open GEO chat"><MessageSquare className="h-4 w-4" /></Link>
                      </Button>
                      {cycle.shareToken ? (
                        <>
                          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-zinc-400 hover:text-zinc-100">
                            <a href={`/proof/${cycle.shareToken}`} target="_blank" rel="noreferrer" aria-label="Open shared proof"><ExternalLink className="h-4 w-4" /></a>
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-zinc-400 hover:text-rose-300" disabled={busyId === cycle.id} onClick={() => void revoke(cycle.id)} aria-label="Revoke share link"><X className="h-4 w-4" /></Button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-violet-300 hover:text-violet-200" disabled={busyId === cycle.id} onClick={() => void share(cycle.id)}><Share2 className="mr-1 h-4 w-4" />Share</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}
