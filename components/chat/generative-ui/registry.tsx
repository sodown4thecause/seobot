'use client'

import type { ReactNode } from 'react'
import type { GenerativeUiComponent } from '@/lib/chat/harness-contracts'
import { KeywordMetrics } from './keyword-metrics'
import { SerpResults } from './serp-results'
import { DomainAnalytics } from './domain-analytics'
import { AIPlatformMetrics } from './ai-platform-metrics'
import { AISearchMetrics } from './ai-search-metrics'
import { ContentStrategy } from './content-strategy'
import { CitationRecommendations } from './citation-recommendations'
import { DomainKeywordProfile } from './domain-keyword-profile'
import { ContentGapMatrix } from './content-gap-matrix'
import { Loader2 } from 'lucide-react'

const GENERATIVE_UI_REGISTRY: Record<GenerativeUiComponent, (props: Record<string, unknown>) => ReactNode> = {
  KeywordMetrics: (props) => (
    <KeywordMetrics
      keywords={(props.keywords as Parameters<typeof KeywordMetrics>[0]['keywords']) ?? []}
      title={props.title as string | undefined}
      className={props.className as string | undefined}
    />
  ),
  SerpResults: (props) => (
    <SerpResults
      keyword={String(props.keyword ?? 'SERP')}
      results={(props.results as Parameters<typeof SerpResults>[0]['results']) ?? []}
      location={props.location as string | undefined}
      className={props.className as string | undefined}
    />
  ),
  DomainAnalytics: (props) => (
    <DomainAnalytics
      data={props.data as Parameters<typeof DomainAnalytics>[0]['data']}
      className={props.className as string | undefined}
    />
  ),
  AIPlatformMetrics: (props) => (
    <AIPlatformMetrics
      data={props.data as Parameters<typeof AIPlatformMetrics>[0]['data']}
      className={props.className as string | undefined}
    />
  ),
  AISearchMetrics: (props) => (
    <AISearchMetrics
      analysis={props.analysis as Parameters<typeof AISearchMetrics>[0]['analysis']}
      className={props.className as string | undefined}
    />
  ),
  ContentStrategy: (props) => (
    <ContentStrategy
      data={props.data as Parameters<typeof ContentStrategy>[0]['data']}
      className={props.className as string | undefined}
    />
  ),
  CitationRecommendations: (props) => (
    <CitationRecommendations
      data={props.data as Parameters<typeof CitationRecommendations>[0]['data']}
      className={props.className as string | undefined}
    />
  ),
  DomainKeywordProfile: (props) => (
    <DomainKeywordProfile
      profile={props.profile as Parameters<typeof DomainKeywordProfile>[0]['profile']}
      className={props.className as string | undefined}
    />
  ),
  ContentGapMatrix: (props) => (
    <ContentGapMatrix
      analysis={props.analysis as Parameters<typeof ContentGapMatrix>[0]['analysis']}
      className={props.className as string | undefined}
    />
  ),
}

function componentFromPartType(type: string): GenerativeUiComponent | null {
  if (!type.startsWith('data-')) return null
  const name = type.slice('data-'.length)
  if (name in GENERATIVE_UI_REGISTRY) {
    return name as GenerativeUiComponent
  }
  return null
}

function propsForComponent(
  component: GenerativeUiComponent,
  raw: Record<string, unknown>
): Record<string, unknown> {
  switch (component) {
    case 'KeywordMetrics':
      return {
        keywords: raw.keywords,
        title: raw.title,
        className: raw.className,
      }
    case 'SerpResults':
      return {
        keyword: raw.keyword,
        results: raw.results,
        location: raw.location,
        className: raw.className,
      }
    case 'DomainAnalytics':
    case 'AIPlatformMetrics':
    case 'ContentStrategy':
    case 'CitationRecommendations':
      return {
        data: raw.data ?? raw,
        className: raw.className,
      }
    case 'AISearchMetrics':
      return { analysis: raw.analysis, className: raw.className }
    case 'DomainKeywordProfile':
      return { profile: raw.profile, className: raw.className }
    case 'ContentGapMatrix':
      return { analysis: raw.analysis, className: raw.className }
    default:
      return raw
  }
}

export function DataPartRenderer({ part }: { part: { type: string; id?: string; data?: unknown } }) {
  const component = componentFromPartType(part.type)
  if (!component) return null

  const raw = (part.data && typeof part.data === 'object')
    ? (part.data as Record<string, unknown>)
    : {}
  const status = raw.status as string | undefined

  if (status === 'loading') {
    return (
      <div className="my-3 flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
        Loading {component}...
      </div>
    )
  }

  const render = GENERATIVE_UI_REGISTRY[component]
  const payload = propsForComponent(component, raw)

  return (
    <div className="my-3" data-ui-part={part.type} data-ui-id={part.id}>
      {render(payload)}
    </div>
  )
}

export function renderClientUiGenerativeComponent(
  component: string,
  props: Record<string, unknown>
): ReactNode {
  if (!(component in GENERATIVE_UI_REGISTRY)) return null
  return GENERATIVE_UI_REGISTRY[component as GenerativeUiComponent](props)
}
