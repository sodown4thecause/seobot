import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CitationDeltaReport } from '@/components/chat/tool-ui/citation-delta-report'
import { getSharedFixCycle } from '@/lib/geo/fix-cycle'
import type { GeoCitationDelta } from '@/lib/geo/citation-delta'

type PageProps = {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const cycle = await getSharedFixCycle(token)
  if (!cycle) return { title: 'Proof not found | FlowIntent' }

  return {
    title: `${cycle.brand} gained AI citations — proof by FlowIntent`,
    description: `A read-only GEO citation report for ${cycle.brand}, measured by FlowIntent.`,
    openGraph: {
      title: `${cycle.brand} gained AI citations — proof by FlowIntent`,
      description: `A read-only GEO citation report for ${cycle.brand}, measured by FlowIntent.`,
      type: 'article',
    },
  }
}

export default async function ProofPage({ params }: PageProps) {
  const { token } = await params
  const cycle = await getSharedFixCycle(token)
  if (!cycle) notFound()

  const delta = cycle.latestDelta as GeoCitationDelta | null

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between border-b border-red-500/20 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center bg-red-500 font-black italic text-black">FI</div>
            <span className="font-semibold tracking-tight">FlowIntent</span>
          </div>
          <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">Proof report</span>
        </div>
        {delta?.perEngine && delta.runsCompared ? (
          <CitationDeltaReport
            delta={delta}
            cycle={{
              brand: cycle.brand,
              query: cycle.query,
              shippedUrl: cycle.shippedUrl,
              status: cycle.status,
              createdAt: cycle.createdAt,
              shippedAt: cycle.shippedAt,
              lastVerifiedAt: cycle.lastVerifiedAt,
            }}
          />
        ) : (
          <div className="rounded-2xl border border-red-500/20 bg-zinc-900/50 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">GEO proof report</p>
            <h1 className="mt-3 text-2xl font-semibold">{cycle.brand} — “{cycle.query}”</h1>
            <p className="mt-3 text-sm text-zinc-400">This cycle has not completed a verification run yet.</p>
          </div>
        )}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Measured by FlowIntent across live AI visibility probes. Shared reports are read-only.
        </p>
      </div>
    </main>
  )
}
