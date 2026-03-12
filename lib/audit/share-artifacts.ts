import type { TopicalMapResultPayload } from '@/lib/audit/types'

interface BuildShareCopyInput {
  brand: string
  score: number
  action: string
}

function sanitizeCompetitiveLanguage(input: string): string {
  return input
    .replace(/destroy\s+your\s+competitors/gi, 'outperform your baseline')
    .replace(/competitor\s*x\s+is\s+bad/gi, 'competition analysis identified gaps')
    .replace(/crush\s+the\s+competition/gi, 'improve your visibility')
    .replace(/invisible/gi, 'high-headroom')
    .replace(/not ranking/gi, 'still building presence')
}

export function buildShareCopy(input: BuildShareCopyInput): string {
  const base = `${input.brand} topical authority score is ${input.score}/100. Fastest next move: ${input.action}`
  return sanitizeCompetitiveLanguage(base)
}

export function buildShareArtifacts(input: {
  brand: string
  payload: Pick<TopicalMapResultPayload, 'topicalMap' | 'priorityActions'>
}): TopicalMapResultPayload['shareArtifacts'] {
  const action = input.payload.priorityActions[0] || 'Ship one source-backed page for your highest-gap buyer topic.'
  const xCopy = buildShareCopy({
    brand: input.brand,
    score: input.payload.topicalMap.scores.topicalAuthority,
    action,
  })

  return {
    verdictCard: {
      title: 'Topical Opportunity Snapshot',
      summary: xCopy,
    },
    topicalMapCard: {
      topGaps: input.payload.topicalMap.nodes
        .filter((node) => node.competitorCoverage > node.youCoverage)
        .slice(0, 3)
        .map((node) => node.topic),
    },
    channels: {
      x: xCopy,
      reddit: `${xCopy} Sharing practical, user-centric improvements only.`,
    },
  }
}
