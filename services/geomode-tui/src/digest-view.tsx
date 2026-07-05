import React from 'react'
import { Box, Text } from 'ink'

interface DigestViewProps {
  payload: {
    digestDate?: string
    brand?: string
    degradedSections?: string[]
    digest?: {
      degraded?: boolean
      geomode?: { engines?: Array<{ engine: string, mentionCount: number, citationCount: number }> }
      serp?: { rankMovers?: Array<{ keyword: string, rank: number | null, rankDelta?: number }> }
    }
    suggestions?: {
      actions?: Array<{ priority: number, title: string, rationale: string }>
      longTermLinks?: Array<{ domain: string, reason: string }>
    }
  }
}

export function DigestView({ payload }: DigestViewProps) {
  const degraded = payload.degradedSections?.length
    ? payload.degradedSections
    : payload.digest?.degraded
      ? ['unknown']
      : []

  return (
    <Box flexDirection="column">
      <Text bold color="red">FlowIntent GEO Daily Digest</Text>
      <Text>{payload.brand} · {payload.digestDate}</Text>
      {degraded.length > 0 && (
        <Text color="yellow">Warning: partial report ({degraded.join(', ')})</Text>
      )}

      <Box marginTop={1} flexDirection="column">
        <Text bold>Engine summary</Text>
        {(payload.digest?.geomode?.engines ?? []).map(engine => (
          <Text key={engine.engine}>
            {engine.engine}: {engine.mentionCount} mentions · {engine.citationCount} citations
          </Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Rank movers</Text>
        {(payload.digest?.serp?.rankMovers ?? []).slice(0, 5).map(mover => (
          <Text key={mover.keyword}>
            {mover.keyword}: {mover.rank ?? '—'} ({mover.rankDelta ?? 0 > 0 ? '+' : ''}{mover.rankDelta ?? 0})
          </Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>AI suggestions</Text>
        {(payload.suggestions?.actions ?? []).map(action => (
          <Text key={action.priority}>
            {action.priority}. {action.title} — {action.rationale}
          </Text>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>Long-term links</Text>
        {(payload.suggestions?.longTermLinks ?? []).slice(0, 5).map(link => (
          <Text key={link.domain}>{link.domain}: {link.reason}</Text>
        ))}
      </Box>
    </Box>
  )
}
