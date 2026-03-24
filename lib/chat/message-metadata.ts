import type { ReasoningStep } from '@/components/ai-elements/reasoning'
import type { SourceItem } from '@/components/ai-elements/sources'

export type CitationItem = {
  number: number
  title?: string
  url?: string
  description?: string
}

export function extractSources(message: any): SourceItem[] {
  const sources =
    message.sources ||
    message.metadata?.sources ||
    message.metadata?.citations ||
    message.annotations?.sources ||
    []

  if (!Array.isArray(sources)) return []

  return sources
    .map((source: any, index: number): SourceItem | null => {
      if (typeof source === 'string') {
        return { id: source, url: source, title: source }
      }

      if (source && typeof source === 'object') {
        return {
          id: source.id ?? source.url ?? source.link ?? source.title ?? source.name ?? `source-${index}`,
          title: source.title ?? source.name,
          url: source.url ?? source.link,
          description: source.description ?? source.summary ?? source.snippet,
          type: source.type || 'website',
        }
      }

      return null
    })
    .filter((source): source is SourceItem => source !== null)
}

export function extractReasoning(message: any): ReasoningStep[] {
  const reasoning = message.reasoning || message.metadata?.reasoning || message.annotations?.reasoning

  if (!reasoning) return []

  if (Array.isArray(reasoning)) {
    return reasoning.map((step: any, index: number) => ({
      id: step.id || `step-${index}`,
      title: step.title || step.step || `Step ${index + 1}`,
      description: step.description || step.detail || step.thought,
      status: step.status || (step.completed ? 'completed' : step.inProgress ? 'in-progress' : 'pending'),
    }))
  }

  if (typeof reasoning === 'object' && Array.isArray(reasoning.steps)) {
    return reasoning.steps.map((step: any, index: number) => ({
      id: step.id || `step-${index}`,
      title: step.title || step.name || `Step ${index + 1}`,
      description: step.description || step.detail,
      status: step.status || (step.completed ? 'completed' : step.inProgress ? 'in-progress' : 'pending'),
    }))
  }

  return []
}

export function extractCitations(message: any): CitationItem[] {
  const citations = message.metadata?.citations || message.annotations?.citations || []

  if (!Array.isArray(citations)) return []

  return citations
    .map((citation: any, index: number): CitationItem | null => {
      if (typeof citation === 'string') {
        return {
          number: index + 1,
          url: citation,
          title: citation,
        }
      }

      if (citation && typeof citation === 'object') {
        return {
          number: typeof citation.number === 'number' ? citation.number : index + 1,
          title: citation.title ?? citation.name ?? citation.source,
          url: citation.url ?? citation.link,
          description: citation.description ?? citation.summary ?? citation.snippet,
        }
      }

      return null
    })
    .filter((citation): citation is CitationItem => citation !== null)
}
