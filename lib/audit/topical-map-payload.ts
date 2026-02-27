import type {
  AuditVisibilityState,
  TopicalMapNode,
  TopicalMapProviderStatus,
  TopicalMapResultPayload,
} from '@/lib/audit/types'
import {
  computeAeoCitationScore,
  computeProofGapScore,
  computeShareShockScore,
  computeTopicalAuthorityScore,
} from '@/lib/audit/topical-map-scoring'
import { buildShareArtifacts } from '@/lib/audit/share-artifacts'

interface BuildTopicalMapPayloadInput {
  nodes: TopicalMapNode[]
  providerStatus?: TopicalMapProviderStatus
  confidence?: number
  partialData?: boolean
  visibility?: AuditVisibilityState
  auditVersion?: string
}

function average(values: number[]): number {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function buildPriorityActions(nodes: TopicalMapNode[]): string[] {
  return nodes
    .filter((node) => node.youCoverage < node.competitorCoverage)
    .sort((a, b) => {
      const deltaA = a.competitorCoverage - a.youCoverage
      const deltaB = b.competitorCoverage - b.youCoverage
      if (deltaA !== deltaB) return deltaB - deltaA
      return a.topic.localeCompare(b.topic)
    })
    .slice(0, 3)
    .map((node) => `Improve ${node.topic} with cited proof assets and source-backed comparisons.`)
}

export function buildTopicalMapPayload(input: BuildTopicalMapPayloadInput): TopicalMapResultPayload {
  const nodes = input.nodes.slice().sort((a, b) => a.topic.localeCompare(b.topic))
  const breadth = average(nodes.map((node) => node.youCoverage))
  const depth = average(nodes.map((node) => node.evidenceDepth))
  const parity = average(
    nodes.map((node) => {
      const delta = Math.max(0, node.competitorCoverage - node.youCoverage)
      return Math.max(0, 100 - delta)
    })
  )

  const sourceTrust = average(nodes.map((node) => Math.min(100, node.citations * 20)))
  const mentionPosition = average(nodes.map((node) => (node.aiMentions > 0 ? 75 : 35)))
  const modelAgreement = average(nodes.map((node) => (node.aiMentions > 1 ? 80 : 45)))

  const missingBottomFunnelAssets = average(nodes.map((node) => (node.intent === 'transactional' && node.youCoverage < 60 ? 100 : 35)))
  const missingComparisons = average(nodes.map((node) => (node.competitorCoverage - node.youCoverage > 20 ? 100 : 40)))
  const missingSchemaCoverage = average(nodes.map((node) => (node.evidenceDepth < 40 ? 90 : 30)))
  const missingOriginalData = average(nodes.map((node) => (node.citations === 0 ? 100 : 25)))

  const shareZScore = average(nodes.map((node) => (node.competitorCoverage - node.youCoverage) / 20))

  const scores = {
    topicalAuthority: computeTopicalAuthorityScore({ breadth, depth, parity }),
    aeoCitation: computeAeoCitationScore({ sourceTrust, mentionPosition, modelAgreement }),
    proofGap: computeProofGapScore({
      missingBottomFunnelAssets,
      missingComparisons,
      missingSchemaCoverage,
      missingOriginalData,
    }),
    shareShock: computeShareShockScore({ zScore: shareZScore }),
  }

  const priorityActions = buildPriorityActions(nodes)
  const shareArtifacts = buildShareArtifacts({
    brand: 'Your brand',
    payload: {
      topicalMap: { nodes, scores },
      priorityActions,
    },
  })

  return {
    auditVersion: input.auditVersion || '2026.02.topical-map.v1',
    publicVisibility: input.visibility || 'unlisted',
    topicalMap: {
      nodes,
      scores,
    },
    priorityActions,
    shareArtifacts,
    runMetadata: {
      generatedAt: new Date().toISOString(),
      confidence: input.confidence ?? (nodes.length ? nodes[0].confidence : 0.6),
      partialData: Boolean(input.partialData),
      providerStatus: input.providerStatus || {
        dataforseo: 'ok',
        firecrawl: 'ok',
        aiDiagnostics: 'ok',
      },
    },
  }
}
