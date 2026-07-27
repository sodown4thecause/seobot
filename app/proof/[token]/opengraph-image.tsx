import { ImageResponse } from 'next/og'
import { getSharedFixCycle } from '@/lib/geo/fix-cycle'
import type { GeoCitationDelta } from '@/lib/geo/citation-delta'

export const runtime = 'nodejs'
export const alt = 'FlowIntent GEO proof report'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

type ImageProps = {
  params: Promise<{ token: string }>
}

const verdictLabels = {
  improved: 'Improved',
  no_change: 'No change',
  regressed: 'Regressed',
  pending: 'Pending',
} as const

export default async function OpenGraphImage({ params }: ImageProps) {
  const { token } = await params
  const cycle = await getSharedFixCycle(token)

  if (!cycle) {
    return new ImageResponse(
      <div
        style={{
          alignItems: 'center',
          background: '#09090b',
          color: '#f4f4f5',
          display: 'flex',
          fontSize: 48,
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        FlowIntent proof report
      </div>,
      size
    )
  }

  const delta = cycle.latestDelta as GeoCitationDelta | null
  const verdict = delta?.verdict ?? 'pending'
  const before = delta ? Math.round(delta.mentionRateBefore * 100) : null
  const after = delta ? Math.round(delta.mentionRateAfter * 100) : null

  return new ImageResponse(
    <div
      style={{
        background: '#09090b',
        color: '#f4f4f5',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'space-between',
        padding: '64px 72px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ color: '#f87171', display: 'flex', fontSize: 26, fontWeight: 700 }}>
          FlowIntent
        </div>
        <div style={{ color: '#a1a1aa', display: 'flex', fontSize: 22 }}>
          GEO proof report
        </div>
        <div style={{ display: 'flex', fontSize: 48, fontWeight: 700, lineHeight: 1.1 }}>
          {cycle.brand} · “{cycle.query}”
        </div>
      </div>

      <div style={{ alignItems: 'center', display: 'flex', gap: 36 }}>
        <div
          style={{
            alignItems: 'center',
            background: verdict === 'improved' ? '#14532d' : '#27272a',
            borderRadius: 18,
            color: verdict === 'improved' ? '#bbf7d0' : '#e4e4e7',
            display: 'flex',
            fontSize: 28,
            fontWeight: 700,
            padding: '18px 24px',
          }}
        >
          {verdictLabels[verdict]}
        </div>
        {before !== null && after !== null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ color: '#a1a1aa', display: 'flex', fontSize: 22 }}>
              Mention rate
            </div>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 700 }}>
              {before}% → {after}%
            </div>
          </div>
        ) : (
          <div style={{ color: '#a1a1aa', display: 'flex', fontSize: 28 }}>
            Verification is pending
          </div>
        )}
      </div>

      <div style={{ color: '#71717a', display: 'flex', fontSize: 22 }}>
        Measured by FlowIntent across live AI visibility probes
      </div>
    </div>,
    size
  )
}
