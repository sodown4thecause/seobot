type UnknownRecord = Record<string, unknown>

export interface NormalizedKeywordData {
  keyword: string
  volume: number
  difficulty: number
  cpc: number
  intent: string
}

export interface NormalizedKeywordResult {
  topic: string
  keywords: NormalizedKeywordData[]
  parseError?: string
}

const isRecord = (value: unknown): value is UnknownRecord => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const toFiniteNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[%,$\s]/g, '')
    const parsed = Number.parseFloat(cleaned)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const parseJsonString = (value: string): unknown => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return null
    }
  }

  if (trimmed.includes('\n')) {
    const lines = trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)

    const parsedLines = lines
      .filter((line) => line.startsWith('{') || line.startsWith('['))
      .map((line) => {
        try {
          return JSON.parse(line)
        } catch {
          return null
        }
      })
      .filter((line): line is unknown => line !== null)

    if (parsedLines.length > 0) {
      return parsedLines
    }
  }

  return null
}

function unwrapResultPayload(result: unknown): unknown {
  if (typeof result === 'string') {
    const parsed = parseJsonString(result)
    return parsed ?? result
  }

  if (!isRecord(result)) {
    return result
  }

  if ('success' in result && 'data' in result) {
    return (result as UnknownRecord).data
  }

  return result
}

function extractKeywordRows(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    const flattened = payload.flatMap((item) => extractKeywordRows(item))
    if (flattened.length > 0) {
      return flattened
    }
    return payload
  }

  if (!isRecord(payload)) {
    return []
  }

  if (Array.isArray(payload.keywords)) {
    return payload.keywords
  }

  if (Array.isArray(payload.items)) {
    return payload.items
  }

  if (Array.isArray(payload.result)) {
    const nestedResult = payload.result.flatMap((item) => extractKeywordRows(item))
    if (nestedResult.length > 0) {
      return nestedResult
    }
  }

  if (Array.isArray(payload.tasks)) {
    const taskRows = payload.tasks.flatMap((task) => {
      if (!isRecord(task)) return []
      return extractKeywordRows(task.result)
    })

    if (taskRows.length > 0) {
      return taskRows
    }
  }

  return []
}

function normalizeKeywordRow(row: unknown): NormalizedKeywordData | null {
  if (!isRecord(row)) {
    return null
  }

  const keywordRaw =
    row.keyword ??
    row.term ??
    row.query

  const keyword = typeof keywordRaw === 'string' ? keywordRaw.trim() : ''
  if (!keyword) {
    return null
  }

  const difficultySource =
    row.difficulty ??
    row.keyword_difficulty ??
    row.competition ??
    row.competition_index

  const cpcSource =
    row.cpc ??
    row.cost_per_click ??
    row.avg_cpc ??
    row.low_top_of_page_bid

  const volumeSource =
    row.volume ??
    row.search_volume ??
    row.searchVolume ??
    row.monthly_searches

  const intentRaw = row.intent ?? row.search_intent ?? row.searchIntent
  const intent = typeof intentRaw === 'string' && intentRaw.trim().length > 0
    ? intentRaw
    : 'Unknown'

  return {
    keyword,
    volume: toFiniteNumber(volumeSource),
    difficulty: Math.max(0, Math.min(100, toFiniteNumber(difficultySource))),
    cpc: toFiniteNumber(cpcSource),
    intent,
  }
}

export function normalizeKeywordToolResult(result: unknown): NormalizedKeywordResult {
  const defaultResult: NormalizedKeywordResult = {
    topic: 'Keyword Analysis',
    keywords: [],
  }

  try {
    const unwrapped = unwrapResultPayload(result)
    const payload = typeof unwrapped === 'string' ? parseJsonString(unwrapped) ?? unwrapped : unwrapped

    const topic = isRecord(payload) && typeof payload.topic === 'string' && payload.topic.trim().length > 0
      ? payload.topic
      : defaultResult.topic

    const rows = extractKeywordRows(payload)
    const keywords = rows
      .map((row) => normalizeKeywordRow(row))
      .filter((row): row is NormalizedKeywordData => row !== null)

    return {
      topic,
      keywords,
    }
  } catch (error) {
    return {
      ...defaultResult,
      parseError: error instanceof Error ? error.message : 'Failed to parse keyword result',
    }
  }
}
