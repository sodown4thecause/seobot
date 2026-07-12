import { normalizeKeywordToolResult, type NormalizedKeywordResult } from '@/lib/chat/tool-result-normalizers'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function normalizeKeywordArtifactData(data: unknown): NormalizedKeywordResult | null {
  if (isRecord(data) && Array.isArray(data.keywords) && data.keywords.length === 0) {
    return {
      topic: typeof data.topic === 'string' && data.topic.trim() ? data.topic : 'Keyword Analysis',
      keywords: [],
    }
  }

  const normalized = normalizeKeywordToolResult(data)
  return normalized.keywords.length > 0 ? normalized : null
}
