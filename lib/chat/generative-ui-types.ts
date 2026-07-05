export const GENERATIVE_UI_COMPONENTS = [
  'KeywordMetrics',
  'SerpResults',
  'DomainAnalytics',
  'AIPlatformMetrics',
  'AISearchMetrics',
  'ContentStrategy',
  'CitationRecommendations',
  'DomainKeywordProfile',
  'ContentGapMatrix',
] as const

export type GenerativeUiComponent = (typeof GENERATIVE_UI_COMPONENTS)[number]

export const GENERATIVE_UI_COMPONENT_SET = new Set<string>(GENERATIVE_UI_COMPONENTS)
