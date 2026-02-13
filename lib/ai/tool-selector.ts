import 'server-only'

import type { Tool } from 'ai'
import { generateEmbedding } from '@/lib/ai/embeddings'

export interface ToolEmbeddingScore {
  name: string
  score: number
}

export interface SelectToolsByEmbeddingOptions {
  query: string
  tools: Record<string, Tool>
  topK: number
  pinnedToolNames?: string[]
  minSimilarity?: number
}

function toolToEmbeddingText(name: string, t: Tool): string {
  const description = typeof (t as unknown as { description?: unknown }).description === 'string'
    ? (t as unknown as { description: string }).description
    : ''

  const inputSchema = (t as unknown as { inputSchema?: unknown }).inputSchema
  const jsonSchema = inputSchema && typeof inputSchema === 'object' && 'jsonSchema' in inputSchema
    ? (inputSchema as { jsonSchema: unknown }).jsonSchema
    : inputSchema

  const schemaText = jsonSchema ? safeJsonStringify(jsonSchema) : ''

  return [
    `tool_name: ${name}`,
    description ? `description: ${description}` : '',
    schemaText ? `input_schema: ${schemaText}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value)
  } catch {
    return ''
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimension mismatch: ${a.length} vs ${b.length}`)
  }

  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    const va = a[i]
    const vb = b[i]
    dot += va * vb
    normA += va * va
    normB += vb * vb
  }

  if (normA === 0 || normB === 0) return 0
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

export async function selectToolsByEmbedding(
  options: SelectToolsByEmbeddingOptions,
): Promise<{
  selectedTools: Record<string, Tool>
  scores: ToolEmbeddingScore[]
}> {
  const {
    query,
    tools,
    topK,
    pinnedToolNames = [],
    minSimilarity = 0.15,
  } = options

  const toolEntries = Object.entries(tools)
  if (toolEntries.length === 0) return { selectedTools: {}, scores: [] }

  const normalizedQuery = query.trim()
  if (!normalizedQuery) {
    const pinned = new Set(pinnedToolNames)
    const selectedTools: Record<string, Tool> = {}
    for (const [name, t] of toolEntries) {
      if (pinned.has(name) || Object.keys(selectedTools).length < topK) {
        selectedTools[name] = t
      }
    }
    return { selectedTools, scores: [] }
  }

  const queryEmbedding = await generateEmbedding(normalizedQuery)

  const scored = await Promise.all(
    toolEntries.map(async ([name, t]) => {
      const text = toolToEmbeddingText(name, t)
      const embedding = await generateEmbedding(text)
      const score = cosineSimilarity(queryEmbedding, embedding)
      return { name, score }
    }),
  )

  const pinned = new Set(pinnedToolNames)
  const pinnedTools = toolEntries.filter(([name]) => pinned.has(name)).map(([name, t]) => ({ name, t }))

  const sorted = scored
    .filter((s) => s.score >= minSimilarity)
    .sort((a, b) => b.score - a.score)

  const selectedNames = new Set<string>(pinnedToolNames)
  for (const s of sorted) {
    if (selectedNames.size >= topK) break
    selectedNames.add(s.name)
  }

  // Ensure we always return at least something (even if all scores are low).
  if (selectedNames.size === 0) {
    for (const s of scored.sort((a, b) => b.score - a.score).slice(0, Math.max(1, Math.min(topK, 10)))) {
      selectedNames.add(s.name)
    }
  }

  const selectedTools: Record<string, Tool> = {}
  for (const [name, t] of toolEntries) {
    if (selectedNames.has(name)) {
      selectedTools[name] = t
    }
  }

  for (const p of pinnedTools) {
    selectedTools[p.name] = p.t
  }

  return {
    selectedTools,
    scores: sorted.slice(0, Math.max(0, topK)),
  }
}

