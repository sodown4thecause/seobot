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
    <section className="glass-card space-y-6 rounded-[1.75rem] border-white/8 bg-white/[0.03] p-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-white">Topical Authority Map</h2>
        <p className="text-sm text-zinc-400">
          Confidence {Math.round(payload.runMetadata.confidence * 100)}% • Last refreshed{' '}
          {new Date(payload.runMetadata.generatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {scoreCards.map((card) => (
          <article key={card.label} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{card.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Topic clusters</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {payload.topicalMap.nodes.map((node) => (
            <article key={node.topic} className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-medium text-white">{node.topic}</h4>
                <span className="text-xs uppercase tracking-[0.18em] text-zinc-500">{node.intent}</span>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                    <span>Your coverage</span>
                    <span>{node.youCoverage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                      style={{ width: `${node.youCoverage}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-xs uppercase tracking-[0.18em] text-zinc-500">
                    <span>Competitor coverage</span>
                    <span>{node.competitorCoverage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className="h-2 rounded-full bg-white/25" style={{ width: `${node.competitorCoverage}%` }} />
                  </div>
                </div>
              </div>

              <p className="mt-4 text-xs text-zinc-400">
                Mentions {node.aiMentions} • Citations {node.citations} • Evidence depth {node.evidenceDepth}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Freshness: {new Date(node.freshness.lastIndexedAt).toLocaleDateString()}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Priority actions</h3>
        <ul className="space-y-2">
          {payload.priorityActions.map((action) => (
            <li
              key={action}
              className="rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-300"
            >
              {action}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
