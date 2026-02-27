import type { TopicalMapNode, TopicalMapProviderStatus } from '@/lib/audit/types'

interface ProviderTopicInput {
  topic: string
  intent?: TopicalMapNode['intent']
  youCoverage?: number
  competitorCoverage?: number
  aiMentions?: number
  citations?: number
  evidenceDepth?: number
  sourceUrl?: string
  lastIndexedAt?: string
}

export interface TopicalMapNormalizationInput {
  dataforseo?: { topics: ProviderTopicInput[] }
  firecrawl?: { topics: ProviderTopicInput[] }
  aiDiagnostics?: { topics: ProviderTopicInput[] }
  providerStatus?: TopicalMapProviderStatus
}

export interface TopicalMapNormalizationResult {
  nodes: TopicalMapNode[]
  confidence: number
  partialData: boolean
  providerStatus: TopicalMapProviderStatus
}

function normalizeTopicKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function asIntent(value: string | undefined): TopicalMapNode['intent'] {
  if (value === 'navigational' || value === 'transactional' || value === 'commercial') {
    return value
  }

  return 'informational'
}

function asProviderStatus(
  input?: TopicalMapProviderStatus
): TopicalMapProviderStatus {
  return {
    dataforseo: input?.dataforseo || 'ok',
    firecrawl: input?.firecrawl || 'ok',
    aiDiagnostics: input?.aiDiagnostics || 'ok',
  }
}

function computeConfidence(nodeCount: number, providerStatus: TopicalMapProviderStatus): number {
  let score = nodeCount > 0 ? 0.9 : 0.55

  for (const status of Object.values(providerStatus)) {
    if (status === 'failed') score -= 0.2
    if (status === 'partial') score -= 0.1
  }

  if (score < 0.2) return 0.2
  if (score > 0.98) return 0.98
  return Number(score.toFixed(2))
}

export function normalizeTopicalMap(
  input: TopicalMapNormalizationInput
): TopicalMapNormalizationResult {
  const providerStatus = asProviderStatus(input.providerStatus)
  const topicMap = new Map<string, TopicalMapNode>()

  const allSources: ProviderTopicInput[] = [
    ...(input.dataforseo?.topics || []),
    ...(input.firecrawl?.topics || []),
    ...(input.aiDiagnostics?.topics || []),
  ]

  for (const item of allSources) {
    if (!item.topic?.trim()) continue
    const key = normalizeTopicKey(item.topic)
    const existing = topicMap.get(key)

    if (!existing) {
      topicMap.set(key, {
        topic: key,
        intent: asIntent(item.intent),
        youCoverage: item.youCoverage ?? 0,
        competitorCoverage: item.competitorCoverage ?? 0,
        aiMentions: item.aiMentions ?? 0,
        citations: item.citations ?? 0,
        evidenceDepth: item.evidenceDepth ?? 0,
        freshness: {
          lastIndexedAt: item.lastIndexedAt || new Date(0).toISOString(),
        },
        sourceUrls: item.sourceUrl ? [item.sourceUrl] : [],
        confidence: 0.9,
      })
      continue
    }

    existing.youCoverage = Math.max(existing.youCoverage, item.youCoverage ?? 0)
    existing.competitorCoverage = Math.max(existing.competitorCoverage, item.competitorCoverage ?? 0)
    existing.aiMentions = Math.max(existing.aiMentions, item.aiMentions ?? 0)
    existing.citations = Math.max(existing.citations, item.citations ?? 0)
    existing.evidenceDepth = Math.max(existing.evidenceDepth, item.evidenceDepth ?? 0)
    if (item.sourceUrl && !existing.sourceUrls.includes(item.sourceUrl)) {
      existing.sourceUrls.push(item.sourceUrl)
      existing.sourceUrls.sort((a, b) => a.localeCompare(b))
    }
    if (item.lastIndexedAt && item.lastIndexedAt > existing.freshness.lastIndexedAt) {
      existing.freshness.lastIndexedAt = item.lastIndexedAt
    }
  }

  const nodes = Array.from(topicMap.values()).sort((a, b) => a.topic.localeCompare(b.topic))
  const confidence = computeConfidence(nodes.length, providerStatus)
  const partialData = Object.values(providerStatus).some((status) => status !== 'ok')

  const normalizedNodes = nodes.map((node) => ({
    ...node,
    confidence,
    sourceUrls: node.sourceUrls.slice().sort((a, b) => a.localeCompare(b)),
  }))

  return {
    nodes: normalizedNodes,
    confidence,
    partialData,
    providerStatus,
  }
}
