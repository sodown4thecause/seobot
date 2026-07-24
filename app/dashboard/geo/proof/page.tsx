import { requireUserId } from '@/lib/auth'
import { listFixCycles } from '@/lib/geo/fix-cycle'
import { ProofDashboard, type ProofCycleRow } from '@/components/dashboard/proof-dashboard'

export const dynamic = 'force-dynamic'

export default async function ProofDashboardPage() {
  const userId = await requireUserId()
  const cycles = await listFixCycles(userId)
  const rows: ProofCycleRow[] = cycles.map((cycle) => ({
    id: cycle.id,
    brand: cycle.brand,
    query: cycle.query,
    status: cycle.status,
    latestVerdict: readVerdict(cycle.latestDelta),
    nextVerifyAt: cycle.nextVerifyAt?.toISOString() ?? null,
    createdAt: cycle.createdAt.toISOString(),
    shareToken: cycle.shareToken,
  }))

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">GEO / AEO</p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-100">Proof</h1>
        <p className="mt-1 max-w-2xl text-sm text-zinc-500">Track what changed after you shipped a GEO fix, then share a read-only citation report.</p>
      </div>
      <ProofDashboard initialCycles={rows} />
    </div>
  )
}

function readVerdict(value: unknown) {
  if (!value || typeof value !== 'object' || !('verdict' in value)) return 'pending'
  const verdict = (value as { verdict?: unknown }).verdict
  return typeof verdict === 'string' ? verdict : 'pending'
}
