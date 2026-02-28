import type { TopicalMapResultPayload } from '@/lib/audit/types'

interface TopicalAuthorityMapProps {
  payload: TopicalMapResultPayload
}

export function TopicalAuthorityMap({ payload }: TopicalAuthorityMapProps) {
  const scoreCards = [
    { label: 'Topical Authority', value: payload.topicalMap.scores.topicalAuthority },
    { label: 'AEO Citation', value: payload.topicalMap.scores.aeoCitation },
    { label: 'Proof Gap', value: payload.topicalMap.scores.proofGap },
    { label: 'Share Shock', value: payload.topicalMap.scores.shareShock },
  ]

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Topical Authority Map</h2>
        <p className="text-sm text-zinc-600">
          Confidence {Math.round(payload.runMetadata.confidence * 100)}% • Last refreshed {new Date(payload.runMetadata.generatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scoreCards.map((card) => (
          <article key={card.label} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Topic Clusters</h3>
        <div className="space-y-2">
          {payload.topicalMap.nodes.map((node) => (
            <article key={node.topic} className="rounded-lg border border-zinc-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-zinc-900">{node.topic}</h4>
                <span className="text-xs text-zinc-500">{node.intent}</span>
              </div>
              <p className="mt-2 text-xs text-zinc-600">
                You {node.youCoverage}% • Competitors {node.competitorCoverage}% • Mentions {node.aiMentions} • Citations {node.citations}
              </p>
              <p className="mt-1 text-xs text-zinc-500">Freshness: {new Date(node.freshness.lastIndexedAt).toLocaleDateString()}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Priority Actions</h3>
        <ul className="space-y-2">
          {payload.priorityActions.map((action) => (
            <li key={action} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              {action}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
