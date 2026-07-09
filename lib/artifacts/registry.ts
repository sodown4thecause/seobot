import type { ChatMode } from '@/lib/chat/modes'
import type {
  ArtifactCategory,
  ArtifactImplementationStatus,
  ArtifactType,
} from '@/lib/artifacts/types'

export interface ArtifactDefinition {
  type: ArtifactType
  label: string
  description: string
  category: ArtifactCategory
  modes: ChatMode[]
  status: ArtifactImplementationStatus
  /** AI SDK tool names that produce this artifact when complete. */
  toolNames: string[]
  /** Stable panel id used in chat artifact sync. */
  panelId: string
}

const def = (
  type: ArtifactType,
  label: string,
  description: string,
  category: ArtifactCategory,
  modes: ChatMode[],
  status: ArtifactImplementationStatus,
  toolNames: string[] = [],
  panelId?: string
): ArtifactDefinition => ({
  type,
  label,
  description,
  category,
  modes,
  status,
  toolNames,
  panelId: panelId ?? type,
})

export const ARTIFACT_REGISTRY: Record<ArtifactType, ArtifactDefinition> = {
  keyword: def(
    'keyword',
    'Keyword Research',
    'Keyword metrics table with volume, difficulty, and intent.',
    'legacy',
    ['seo'],
    'live',
    ['suggest_keywords'],
    'keyword-research'
  ),
  backlink: def(
    'backlink',
    'Backlink Profile',
    'Referring domains and anchor text breakdown.',
    'legacy',
    ['seo'],
    'live',
    ['aisa_backlinks_summary', 'aisa_backlinks_list', 'aisa_referring_domains', 'aisa_backlink_anchors', 'legacy_n8n_backlinks', 'n8n_backlinks'],
    'backlink-analysis'
  ),
  serp: def(
    'serp',
    'SERP Analysis',
    'Organic SERP results and competitor positions.',
    'legacy',
    ['seo'],
    'live',
    ['serp_organic_live_advanced', 'dataforseo_labs_google_serp_competitors'],
    'serp-analysis'
  ),
  blog: def(
    'blog',
    'Content Package',
    'Draft blog or content package preview.',
    'content',
    ['content'],
    'live',
    ['create_content_package'],
    'content-package'
  ),
  'social-listening': def(
    'social-listening',
    'Social Listening',
    'Public social mentions, pain points, and trend signals from X/Twitter and Reddit.',
    'social',
    ['social'],
    'live',
    ['aisa_x_search', 'reddit_social_search'],
    'social-listening'
  ),
  'keyword-cluster-map': def(
    'keyword-cluster-map',
    'Keyword Cluster Map',
    'Interactive clusters by topic, intent, and volume.',
    'seo-keyword',
    ['seo'],
    'planned'
  ),
  'serp-gap-visualizer': def(
    'serp-gap-visualizer',
    'SERP Gap Visualizer',
    'Your page vs top competitors across EEAT and schema signals.',
    'seo-keyword',
    ['seo'],
    'planned'
  ),
  'search-intent-matrix': def(
    'search-intent-matrix',
    'Search Intent Matrix',
    'Awareness vs decision coverage across problem and solution quadrants.',
    'seo-keyword',
    ['seo'],
    'planned'
  ),
  'keyword-opportunity-scatter': def(
    'keyword-opportunity-scatter',
    'Keyword Opportunity Map',
    'Difficulty vs opportunity scatter with quick-win quadrant.',
    'seo-keyword',
    ['seo'],
    'planned'
  ),
  'schema-markup-generator': def(
    'schema-markup-generator',
    'Schema Markup Generator',
    'JSON-LD editor with rich-result preview.',
    'seo-technical',
    ['seo', 'geo'],
    'live',
    ['generate_schema_markup'],
    'schema-markup'
  ),
  'cwv-diagnosis-card': def(
    'cwv-diagnosis-card',
    'Core Web Vitals Diagnosis',
    'LCP, CLS, and INP scored dashboard with fix checklist.',
    'seo-technical',
    ['seo'],
    'planned'
  ),
  'internal-link-map': def(
    'internal-link-map',
    'Internal Link Map',
    'Directed graph of internal links with orphan highlights.',
    'seo-technical',
    ['seo'],
    'planned'
  ),
  'robots-sitemap-audit': def(
    'robots-sitemap-audit',
    'AI Crawlability Audit',
    'robots.txt, llms.txt, and AI crawler access checklist.',
    'seo-technical',
    ['seo', 'geo'],
    'live',
    ['ai_crawlability_audit'],
    'crawlability-audit'
  ),
  'page-optimization-scorecard': def(
    'page-optimization-scorecard',
    'Page Optimization Scorecard',
    'Streaming EEAT and on-page scoring with fixes.',
    'seo-onpage',
    ['seo'],
    'planned'
  ),
  'title-meta-variants': def(
    'title-meta-variants',
    'Title & Meta Variants',
    'CTR-scored title and description alternatives.',
    'seo-onpage',
    ['seo'],
    'planned'
  ),
  'content-brief': def(
    'content-brief',
    'Content Brief',
    'Structured brief with headings, FAQs, and schema recommendation.',
    'seo-onpage',
    ['seo', 'content'],
    'planned'
  ),
  'faq-schema-builder': def(
    'faq-schema-builder',
    'FAQ Schema Builder',
    'Q&A pairs with Google preview and JSON-LD export.',
    'seo-onpage',
    ['seo', 'content'],
    'planned'
  ),
  'citation-tracker': def(
    'citation-tracker',
    'AI Citation Tracker',
    'Brand mentions across ChatGPT, Perplexity, and Google AI Overviews.',
    'geo-visibility',
    ['geo'],
    'live',
    ['geo_brand_scan'],
    'citation-tracker'
  ),
  'brand-mention-heatmap': def(
    'brand-mention-heatmap',
    'Brand Mention Heatmap',
    'Topic × engine matrix of citation presence over time.',
    'geo-visibility',
    ['geo'],
    'planned'
  ),
  'ai-answer-accuracy-audit': def(
    'ai-answer-accuracy-audit',
    'AI Answer Accuracy Audit',
    'How engines describe your brand vs your positioning.',
    'geo-visibility',
    ['geo'],
    'planned'
  ),
  'share-of-voice': def(
    'share-of-voice',
    'Share of Voice',
    'Citation rate vs competitors across a query set.',
    'geo-visibility',
    ['geo'],
    'planned'
  ),
  'aeo-content-optimizer': def(
    'aeo-content-optimizer',
    'AEO Content Optimizer',
    'Answer-lead structure, FAQ coverage, and specificity scoring.',
    'geo-content',
    ['geo', 'content'],
    'planned'
  ),
  'answer-ready-paragraph': def(
    'answer-ready-paragraph',
    'Answer-Ready Paragraph',
    'Structured AEO paragraph block for reuse.',
    'geo-content',
    ['geo', 'content'],
    'planned'
  ),
  'topical-authority-map': def(
    'topical-authority-map',
    'Topical Authority Map',
    'Pillar and spoke coverage with citation-ready gaps.',
    'geo-content',
    ['geo', 'seo'],
    'planned'
  ),
  'entity-optimization-checklist': def(
    'entity-optimization-checklist',
    'Entity Optimization Checklist',
    'Organization schema and cross-platform entity consistency.',
    'geo-content',
    ['geo'],
    'planned'
  ),
  'competitor-citation-comparison': def(
    'competitor-citation-comparison',
    'Competitor Citation Comparison',
    'Side-by-side brand positioning across AI engines.',
    'geo-competitive',
    ['geo'],
    'planned'
  ),
  'geo-content-gap-report': def(
    'geo-content-gap-report',
    'GEO Fix Plan',
    'Actionable fix plan from visibility gaps with content brief.',
    'geo-competitive',
    ['geo', 'content'],
    'live',
    ['geo_generate_fix'],
    'geo-fix-plan'
  ),
  'ai-search-result-preview': def(
    'ai-search-result-preview',
    'AI Search Result Preview',
    'Simulated Perplexity-style category answer preview.',
    'geo-competitive',
    ['geo'],
    'planned'
  ),
}

/** tool name → artifact definition (first match wins for multi-tool defs). */
export const TOOL_TO_ARTIFACT: Map<string, ArtifactDefinition> = (() => {
  const map = new Map<string, ArtifactDefinition>()
  for (const entry of Object.values(ARTIFACT_REGISTRY)) {
    for (const toolName of entry.toolNames) {
      if (!map.has(toolName)) {
        map.set(toolName, entry)
      }
    }
  }
  return map
})()

export function getArtifactDefinition(type: ArtifactType): ArtifactDefinition {
  return ARTIFACT_REGISTRY[type]
}

export function isArtifactType(value: string): value is ArtifactType {
  return value in ARTIFACT_REGISTRY
}

export function listArtifactsByMode(mode: ChatMode): ArtifactDefinition[] {
  return Object.values(ARTIFACT_REGISTRY).filter((d) => d.modes.includes(mode))
}

export function listLiveArtifacts(): ArtifactDefinition[] {
  return Object.values(ARTIFACT_REGISTRY).filter((d) => d.status === 'live')
}
