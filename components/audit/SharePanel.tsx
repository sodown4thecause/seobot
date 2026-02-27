import type { TopicalMapResultPayload } from '@/lib/audit/types'

interface SharePanelProps {
  artifacts: TopicalMapResultPayload['shareArtifacts']
}

export function SharePanel({ artifacts }: SharePanelProps) {
  return (
    <section className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Share Artifacts</h2>
      <p className="text-sm text-zinc-600">Safe, user-centric copy for your social updates.</p>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">X</h3>
        <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">{artifacts.channels.x}</p>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Reddit</h3>
        <p className="rounded-md bg-zinc-50 p-3 text-sm text-zinc-700">{artifacts.channels.reddit}</p>
      </div>
    </section>
  )
}
