/**
 * Normalizes keyword tool outputs into the shape the KeywordArtifact panel
 * renders. Handles the pre-normalized `{ topic, keywords }` shape plus raw
 * DataForSEO Labs / Google Ads response structures (tasks → result → items).
 */

export interface KeywordArtifactRow {
  keyword: string
  volume: number
  difficulty: number
  cpc: number
  intent: string
}

export interface KeywordArtifactData {
  topic: string
  keywords: KeywordArtifactRow[]
}

function toNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function normalizeItem(item: Record<string, unknown>): KeywordArtifactRow | null {
  const keywordData = (item.keyword_data ?? item) as Record<string, unknown>
  const keyword =
    typeof keywordData.keyword === 'string'
      ? keywordData.keyword
      : typeof item.keyword === 'string'
        ? item.keyword
        : null
  if (!keyword) return null

  const keywordInfo = (keywordData.keyword_info ?? {}) as Record<string, unknown>
  const keywordProps = (keywordData.keyword_properties ?? {}) as Record<string, unknown>
  const intentInfo = (keywordData.search_intent_info ?? {}) as Record<string, unknown>

  return {
    keyword,
    volume: toNumber(keywordInfo.search_volume ?? item.search_volume ?? item.volume),
    difficulty: toNumber(keywordProps.keyword_difficulty ?? item.keyword_difficulty ?? item.difficulty),
    cpc: toNumber(keywordInfo.cpc ?? item.cpc),
    intent:
      typeof intentInfo.main_intent === 'string'
        ? intentInfo.main_intent
        : typeof item.intent === 'string'
          ? item.intent
          : 'unknown',
  }
}

function extractItems(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    // Could be root items, or DataForSEO envelope array.
    const nested = payload.flatMap((entry) =>
      entry && typeof entry === 'object' ? extractItems(entry) : []
    )
    if (nested.length > 0) return nested
    return payload.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
  }

  if (!payload || typeof payload !== 'object') return []
  const obj = payload as Record<string, unknown>

  if (Array.isArray(obj.items)) {
    return obj.items.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
  }
  if (Array.isArray(obj.result)) return extractItems(obj.result)
  if (Array.isArray(obj.tasks)) return extractItems(obj.tasks)

  return []
}

export function normalizeKeywordArtifactData(data: unknown): KeywordArtifactData | null {
  let payload = data
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload)
    } catch {
      return null
    }
  }
  if (!payload || typeof payload !== 'object') return null

  const obj = payload as Record<string, unknown>

  // Pre-normalized shape from suggest_keywords-style tools.
  if (Array.isArray(obj.keywords) && obj.keywords.every((k) => k && typeof k === 'object')) {
    const rows = (obj.keywords as Record<string, unknown>[])
      .map(normalizeItem)
      .filter((row): row is KeywordArtifactRow => row !== null)
    if (rows.length > 0) {
      return {
        topic: typeof obj.topic === 'string' ? obj.topic : 'Keywords',
        keywords: rows,
      }
    }
  }

  // Raw DataForSEO structures.
  const rows = extractItems(payload)
    .map(normalizeItem)
    .filter((row): row is KeywordArtifactRow => row !== null)

  if (rows.length === 0) return null

  return {
    topic: typeof obj.topic === 'string' ? obj.topic : 'Keywords',
    keywords: rows,
  }
}
