/**
 * Intent-Based Tool Router
 * 
 * Two-tier LLM system for intelligent tool selection:
 * - Tier 1: Lightweight model classifies user intent → selects tool subset
 * - Tier 2: Execution model receives only relevant tools (5-15 vs 70+)
 * 
 * This prevents context bloat and improves tool selection accuracy.
 */

import { generateObject } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import type { GatewayModelId } from '@ai-sdk/gateway'
import { isAbortError } from '@/lib/errors/types'
import { z } from 'zod'

// =============================================================================
// INTENT CATEGORIES & TOOL MAPPINGS
// =============================================================================

export type IntentCategory =
    | 'keyword_research'
    | 'serp_analysis'
    | 'competitor_analysis'
    | 'domain_metrics'
    | 'backlinks'
    | 'content_optimization'
    | 'youtube_seo'
    | 'trends'
    | 'technical_seo'
    | 'web_scraping'
    | 'ai_platforms'
    | 'research'
    | 'general'

/**
 * Map each intent category to its relevant tools
 * Tools are organized by their primary function
 */
export const INTENT_TOOL_MAP: Record<IntentCategory, string[]> = {
    // Keyword Research (8 tools)
    keyword_research: [
        'keywords_data_google_ads_search_volume',
        'dataforseo_labs_google_keyword_ideas',
        'dataforseo_labs_google_keyword_suggestions',
        'dataforseo_labs_google_keyword_overview',
        'dataforseo_labs_google_related_keywords',
        'dataforseo_labs_google_keywords_for_site',
        'dataforseo_labs_bulk_keyword_difficulty',
        'dataforseo_labs_search_intent',
    ],

    // SERP Analysis (5 tools)
    serp_analysis: [
        'serp_organic_live_advanced',
        'dataforseo_labs_google_serp_competitors',
        'dataforseo_labs_google_historical_serp',
        'dataforseo_labs_google_top_searches',
        'serp_locations',
    ],

    // Competitor Analysis (12 tools - full workflow: find → analyze → scrape → keywords)
    competitor_analysis: [
        // Step 1: Find competitors in SERP
        'serp_organic_live_advanced',
        // Step 2: Analyze competitor domains
        'dataforseo_labs_google_competitors_domain',
        'dataforseo_labs_google_domain_intersection',
        'dataforseo_labs_google_page_intersection',
        'dataforseo_labs_google_ranked_keywords',
        'dataforseo_labs_google_relevant_pages',
        'dataforseo_labs_google_subdomains',
        // Step 3: Scrape competitor content
        'firecrawl_scrape',
        'firecrawl_crawl',
        // Step 4: Keyword research for gaps
        'dataforseo_labs_google_keyword_ideas',
        'keywords_data_google_ads_search_volume',
    ],

    // Domain Metrics (5 tools)
    domain_metrics: [
        'dataforseo_labs_google_domain_rank_overview',
        'dataforseo_labs_google_historical_rank_overview',
        'dataforseo_labs_bulk_traffic_estimation',
        'domain_analytics_whois_overview',
        'domain_analytics_technologies_domain_technologies',
    ],

    // Backlinks (n8n webhook only - DataForSEO backlinks inactive)
    backlinks: [
        'n8n_backlinks',
    ],

    // Content Optimization (4 tools + Frase)
    content_optimization: [
        'content_analysis_search',
        'content_analysis_summary',
        'content_analysis_phrase_trends',
        // Frase is handled separately in content generation
    ],

    // YouTube SEO (5 tools)
    youtube_seo: [
        'serp_youtube_organic_live_advanced',
        'serp_youtube_video_info_live_advanced',
        'serp_youtube_video_comments_live_advanced',
        'serp_youtube_video_subtitles_live_advanced',
        'serp_youtube_locations',
    ],

    // Trends Analysis (3 tools)
    trends: [
        'keywords_data_google_trends_explore',
        'keywords_data_dataforseo_trends_explore',
        'keywords_data_dataforseo_trends_demography',
    ],

    // Technical SEO (3 tools)
    technical_seo: [
        'on_page_lighthouse',
        'on_page_content_parsing',
        'on_page_instant_pages',
    ],

    // Web Scraping - Firecrawl (5 tools)
    web_scraping: [
        'firecrawl_scrape',
        'firecrawl_search',
        'firecrawl_crawl',
        'firecrawl_map',
        'firecrawl_extract',
    ],

    // AI Platform Optimization (2 tools)
    ai_platforms: [
        'ai_optimization_keyword_data_search_volume',
        'ai_optimization_keyword_data_locations_and_languages',
    ],

    // General Research (includes keyword tools for content ideas)
    research: [
        'perplexity_search',
        'read_url',           // Jina
        'search_web',         // Jina
        // Include keyword tools for content ideas queries
        'keywords_data_google_ads_search_volume',
        'dataforseo_labs_google_keyword_ideas',
        'dataforseo_labs_google_keyword_suggestions',
        'dataforseo_labs_search_intent',
    ],

    // General/fallback
    general: [
        'perplexity_search',
        'client_ui',
    ],
}

/**
 * Intent descriptions for the classifier prompt
 */
const INTENT_DESCRIPTIONS: Record<IntentCategory, string> = {
    keyword_research: 'Finding keywords, search volume, keyword difficulty, keyword suggestions, keyword ideas, content ideas with keywords',
    serp_analysis: 'Analyzing search results, SERP features, ranking positions, what ranks for a query',
    competitor_analysis: 'Full competitor workflow: finding top competitors in SERP, analyzing their keywords/domains, scraping their content, keyword gaps, domain overlap, outranking strategies',
    domain_metrics: 'Domain authority, traffic estimation, domain overview, WHOIS data, technology stack',
    backlinks: 'Backlink analysis, referring domains, link building, link profile',
    content_optimization: 'Content analysis, content scoring, phrase trends, citation analysis',
    youtube_seo: 'YouTube rankings, video optimization, video comments, YouTube search',
    trends: 'Google Trends, trending topics, trend analysis, popularity over time',
    technical_seo: 'Page speed, Lighthouse audit, technical issues, crawl analysis',
    web_scraping: 'Scraping websites, extracting content, crawling pages, site mapping',
    ai_platforms: 'AI search optimization, ChatGPT/Perplexity visibility, answer engine optimization',
    research: 'General web research, finding information, summarizing content, topic research',
    general: 'General questions, guidance, simple queries',
}

// =============================================================================
// INTENT CLASSIFICATION SCHEMA
// =============================================================================

const IntentClassificationSchema = z.object({
    primaryIntent: z.enum([
        'keyword_research',
        'serp_analysis',
        'competitor_analysis',
        'domain_metrics',
        'backlinks',
        'content_optimization',
        'youtube_seo',
        'trends',
        'technical_seo',
        'web_scraping',
        'ai_platforms',
        'research',
        'general',
    ]).describe('The primary intent of the user query'),

    secondaryIntents: z.array(z.enum([
        'keyword_research',
        'serp_analysis',
        'competitor_analysis',
        'domain_metrics',
        'backlinks',
        'content_optimization',
        'youtube_seo',
        'trends',
        'technical_seo',
        'web_scraping',
        'ai_platforms',
        'research',
        'general',
    ])).describe('Additional intents that may be relevant (0-2)'),

    recommendedAgent: z.enum([
        'seo-aeo',
        'content',
        'general',
        'image',
    ]).describe('Which agent should handle this: seo-aeo for analysis/research/data, content for writing full articles, image for image generation, general for simple questions'),

    confidence: z.number().min(0).max(1).describe('Confidence in the classification (0-1)'),

    reasoning: z.string().describe('Brief explanation of why this intent was selected'),

    extractedEntities: z.object({
        domains: z.array(z.string()).optional().describe('Any domains mentioned'),
        keywords: z.array(z.string()).optional().describe('Any keywords/topics mentioned'),
        location: z.string().optional().describe('Any location/region mentioned'),
    }).optional(),
})

export type IntentClassification = z.infer<typeof IntentClassificationSchema>

// Valid intent values for sanitization
const VALID_INTENTS = [
    'keyword_research',
    'serp_analysis',
    'competitor_analysis',
    'domain_metrics',
    'backlinks',
    'content_optimization',
    'youtube_seo',
    'trends',
    'technical_seo',
    'web_scraping',
    'ai_platforms',
    'research',
    'general',
] as const

/**
 * Sanitize an intent string by removing common LLM artifacts
 * Handles cases like ":backlinks", " backlinks", "backlinks:", etc.
 */
function sanitizeIntent(intent: string | undefined | null): IntentCategory {
    if (!intent || typeof intent !== 'string') return 'general'
    // Remove leading/trailing colons, spaces, quotes
    const cleaned = intent.trim().replace(/^[:"\s]+|[:"\s]+$/g, '').toLowerCase()
    // Check if it matches a valid intent
    if (VALID_INTENTS.includes(cleaned as IntentCategory)) {
        return cleaned as IntentCategory
    }
    return 'general'
}

/**
 * Permissive schema for raw LLM output - allows string fields that may have formatting issues
 */
const RawIntentClassificationSchema = z.object({
    primaryIntent: z.string().describe('The primary intent of the user query'),
    secondaryIntents: z.array(z.string()).optional().describe('Additional intents that may be relevant (0-2)'),
    recommendedAgent: z.string().optional().describe('Which agent should handle this'),
    confidence: z.union([z.number(), z.string()]).optional().describe('Confidence in the classification (0-1 number or high/medium/low)'),
    reasoning: z.string().optional().describe('Brief explanation of why this intent was selected'),
    extractedEntities: z.object({
        domains: z.array(z.string()).optional(),
        keywords: z.array(z.string()).optional(),
        location: z.string().optional(),
    }).optional(),
})

/**
 * Sanitize the raw LLM response and convert to proper IntentClassification
 */
function sanitizeClassificationResponse(raw: z.infer<typeof RawIntentClassificationSchema>): IntentClassification {
    const primaryIntent = sanitizeIntent(raw.primaryIntent)
    const secondaryIntents = (raw.secondaryIntents || [])
        .map(i => sanitizeIntent(i))
        .filter(i => i !== primaryIntent) // Remove duplicates of primary
        .slice(0, 2) as IntentCategory[]

    // Map recommended agent (fallback to keyword-based heuristics)
    let recommendedAgent: 'seo-aeo' | 'content' | 'general' | 'image' = 'general'
    const rawAgent = (raw.recommendedAgent || '').toLowerCase().trim()
    if (rawAgent.includes('seo') || rawAgent.includes('aeo')) {
        recommendedAgent = 'seo-aeo'
    } else if (rawAgent.includes('content')) {
        recommendedAgent = 'content'
    } else if (rawAgent.includes('image')) {
        recommendedAgent = 'image'
    } else {
        const queryLower = raw.reasoning?.toLowerCase() || ''
        if (queryLower.includes('image') || queryLower.includes('infographic') || queryLower.includes('hero')) {
            recommendedAgent = 'image'
        }
    }

    // Convert string confidence to number
    let confidence = 0.8 // default
    if (typeof raw.confidence === 'number') {
        confidence = raw.confidence
    } else if (typeof raw.confidence === 'string') {
        const confStr = raw.confidence.toLowerCase()
        if (confStr === 'high' || confStr === 'very high') confidence = 0.9
        else if (confStr === 'medium') confidence = 0.7
        else if (confStr === 'low') confidence = 0.5
        else {
            // Try parsing as float
            const parsed = parseFloat(raw.confidence)
            if (!isNaN(parsed)) confidence = parsed
        }
    }

    return {
        primaryIntent,
        secondaryIntents,
        recommendedAgent,
        confidence,
        reasoning: raw.reasoning || 'Classified based on query analysis',
        extractedEntities: raw.extractedEntities,
    }
}

// =============================================================================
// INTENT ROUTER CLASS
// =============================================================================

export class IntentToolRouter {
    /**
     * Tier 1: Classify user intent using lightweight LLM
     * Returns the intent category and relevant tool subset
     */
    static async classifyIntent(query: string, abortSignal?: AbortSignal): Promise<IntentClassification> {
        const intentList = Object.entries(INTENT_DESCRIPTIONS)
            .map(([intent, desc]) => `- ${intent}: ${desc}`)
            .join('\n')

        try {
            // Use generateObject with PERMISSIVE schema to allow for LLM formatting issues
            // Then sanitize the result to handle cases like ":backlinks" instead of "backlinks"
            const { object: rawResult } = await generateObject({
                model: vercelGateway.languageModel('google/gemini-3-flash' as GatewayModelId),
                schema: RawIntentClassificationSchema,
                abortSignal,
                prompt: `You are an SEO/AEO intent classifier. Analyze the user query and classify their intent.

IMPORTANT: Return EXACT enum values without any prefixes like colons. For example, use "backlinks" NOT ":backlinks".

USER QUERY: "${query}"

AVAILABLE INTENT CATEGORIES:
${intentList}

AGENT SELECTION RULES:
- seo-aeo: Use for keyword research, SERP analysis, competitor analysis, domain metrics, backlinks, trends, technical SEO, content IDEAS
- content: Use ONLY when user explicitly asks to WRITE/CREATE/GENERATE a full blog post or article
- image: Use when the user explicitly asks to generate images, hero images, infographics, or social variants
- general: Use for simple questions or chat

COMPLEX MULTI-INTENT QUERY HANDLING:
When a query involves RANKING, COMPETITORS, or OUTRANKING - use "competitor_analysis" as primary.
This intent includes: finding competitors in SERP, analyzing their content, scraping their pages, and keyword gaps.

CRITICAL EXAMPLES FOR COMPETITOR/RANKING QUERIES:
- "rank for 'X keyword', analyze competitors, tell me what content to create" → primaryIntent: "competitor_analysis", secondaryIntents: ["keyword_research", "serp_analysis"]
- "find keyword opportunities and analyze top 3 competitors" → primaryIntent: "competitor_analysis", secondaryIntents: ["keyword_research"]
- "what content do I need to outrank competitors for X" → primaryIntent: "competitor_analysis", secondaryIntents: ["web_scraping"]
- "who ranks for X and what are they doing right" → primaryIntent: "competitor_analysis", secondaryIntents: ["serp_analysis"]
- "analyze the top competitors for my keyword" → primaryIntent: "competitor_analysis"

OTHER EXAMPLES:
- "content ideas with keywords" → primaryIntent: "keyword_research", recommendedAgent: "seo-aeo"
- "write a blog post about SEO" → primaryIntent: "content_optimization", recommendedAgent: "content"
- "generate a hero image for a blog post" → primaryIntent: "content_optimization", recommendedAgent: "image"
- "create an infographic about AI adoption" → primaryIntent: "content_optimization", recommendedAgent: "image"
- "analyze backlinks for competitor.com" → primaryIntent: "backlinks", recommendedAgent: "seo-aeo"
- "what are the search volumes for these keywords" → primaryIntent: "keyword_research"
- "scrape this URL for content" → primaryIntent: "web_scraping"

Classify this query with appropriate intent, agent recommendation, and confidence level.`,
            })

            // Sanitize the LLM response to handle common issues like ":backlinks" instead of "backlinks"
            const result = sanitizeClassificationResponse(rawResult)

            console.log('[Intent Router] Classified intent:', {
                query: query.substring(0, 50),
                primary: result.primaryIntent,
                secondary: result.secondaryIntents,
                agent: result.recommendedAgent,
                confidence: result.confidence,
            })

            return result
        } catch (error) {
            if (isAbortError(error)) {
                throw error
            }

            console.error('[Intent Router] Classification failed:', error)
            // Fallback to general intent
            return {
                primaryIntent: 'general',
                secondaryIntents: [],
                recommendedAgent: 'general',
                confidence: 0.5,
                reasoning: 'Classification failed, using fallback',
            }
        }
    }

    /**
     * Get the tool names for a given set of intents
     */
    static getToolsForIntents(intents: IntentCategory[]): string[] {
        const tools = new Set<string>()

        for (const intent of intents) {
            const intentTools = INTENT_TOOL_MAP[intent] || []
            intentTools.forEach(tool => tools.add(tool))
        }

        return Array.from(tools)
    }

    /**
     * Tier 1 + 2 Combined: Classify intent and return focused tool subset
     * This is the main entry point for the chat API
     */
    static async classifyAndGetTools(query: string, abortSignal?: AbortSignal): Promise<{
        classification: IntentClassification
        tools: string[]
        allIntents: IntentCategory[]
    }> {
        const classification = await this.classifyIntent(query, abortSignal)

        // Combine primary + secondary intents
        const allIntents: IntentCategory[] = [
            classification.primaryIntent,
            ...classification.secondaryIntents,
        ]

        // Get unique tools for all intents
        const tools = this.getToolsForIntents(allIntents)

        console.log('[Intent Router] Tools selected:', {
            intents: allIntents,
            toolCount: tools.length,
            tools: tools.slice(0, 10), // Log first 10
        })

        return {
            classification,
            tools,
            allIntents,
        }
    }

    /**
     * Get a focused system prompt based on the classified intent
     */
    static getIntentSystemPromptAddendum(intents: IntentCategory[]): string {
        const primary = intents[0]

        const addendums: Record<IntentCategory, string> = {
            keyword_research: `
FOCUS: Keyword Research - YOU MUST USE DATAFORSEO TOOLS

MANDATORY: For keyword research, content ideas, and search intent queries:
1. FIRST call: keywords_data_google_ads_search_volume - to get search volume, CPC, competition
2. SECOND call: dataforseo_labs_google_keyword_ideas - to get related keyword ideas
3. THIRD call: dataforseo_labs_search_intent - to understand user search intent

DO NOT USE perplexity_search or research_agent for keyword metrics!
DO NOT USE consult_frameworks for keyword research!
These tools do NOT have keyword data - only DataForSEO does.

Example for "content ideas with keywords for SEO chatbot":
- Call keywords_data_google_ads_search_volume with keywords: ["SEO chatbot", "AI SEO tool", "SEO automation"]
- Call dataforseo_labs_google_keyword_ideas with keyword: "SEO chatbot"
- Present the search volume, difficulty, and related keywords`,

            serp_analysis: `
FOCUS: SERP Analysis
Use these tools in priority order:
1. serp_organic_live_advanced - for current rankings
2. dataforseo_labs_google_serp_competitors - for competitor rankings
3. dataforseo_labs_google_historical_serp - for ranking history`,

            competitor_analysis: `
FOCUS: Comprehensive Competitor Analysis & Ranking Strategy

For queries about ranking, competitors, outranking, or content strategy to beat competitors, follow this EXACT 4-step workflow:

STEP 1 - FIND COMPETITORS IN SERP (MANDATORY FIRST STEP):
→ serp_organic_live_advanced with the target keyword
This returns the actual top 10-20 ranking pages/domains. You MUST do this to know WHO the competitors are.

STEP 2 - ANALYZE COMPETITOR DOMAINS:
→ dataforseo_labs_google_ranked_keywords - what keywords each competitor ranks for
→ dataforseo_labs_google_domain_intersection - find keyword gaps between user's domain and competitors
→ dataforseo_labs_google_competitors_domain - discover additional similar competing domains

STEP 3 - SCRAPE COMPETITOR CONTENT (CRITICAL FOR CONTENT STRATEGY):
→ firecrawl_scrape - extract the actual content from top 3-5 ranking pages
This shows WHAT content structure, topics, headings, and depth competitors use. Users NEED this to know what to create.

STEP 4 - KEYWORD OPPORTUNITIES:
→ dataforseo_labs_google_keyword_ideas - related keywords and opportunities for the topic
→ keywords_data_google_ads_search_volume - get search volume and difficulty data

CRITICAL RULES:
- DO NOT skip the serp_organic_live_advanced step - you need SERP data to identify actual competitors
- DO NOT skip the firecrawl_scrape step - users need to see competitor content to understand how to outrank them
- DO NOT use ONLY perplexity_search - it cannot provide actual competitor SERP data, rankings, or scraped content
- perplexity_search is supplementary only, for additional context after you have real data`,

            domain_metrics: `
FOCUS: Domain Analysis
Use these tools in priority order:
1. dataforseo_labs_google_domain_rank_overview - domain authority
2. dataforseo_labs_bulk_traffic_estimation - traffic estimates
3. domain_analytics_whois_overview - domain registration info`,

            backlinks: `
FOCUS: Backlink Analysis
Use n8n_backlinks webhook for all backlink queries.
DO NOT use other backlinks_* tools - they are inactive.`,

            content_optimization: `
FOCUS: Content Analysis
Use these tools:
1. content_analysis_search - find content across web
2. content_analysis_summary - summarize content landscape`,

            youtube_seo: `
FOCUS: YouTube SEO
Use these tools:
1. serp_youtube_organic_live_advanced - YouTube search rankings
2. serp_youtube_video_info_live_advanced - video metrics`,

            trends: `
FOCUS: Trends Analysis
Use these tools:
1. keywords_data_google_trends_explore - Google Trends data
2. keywords_data_dataforseo_trends_explore - broader trends`,

            technical_seo: `
FOCUS: Technical SEO
Use these tools:
1. on_page_lighthouse - performance audit
2. on_page_instant_pages - quick page analysis`,

            web_scraping: `
FOCUS: Web Scraping
Use Firecrawl tools:
1. firecrawl_scrape - single page extraction
2. firecrawl_crawl - multi-page crawling
3. firecrawl_extract - structured data extraction`,

            ai_platforms: `
FOCUS: AI Platform Optimization
Use these tools for ChatGPT/Perplexity/Claude visibility:
1. ai_optimization_keyword_data_search_volume - AI search metrics`,

            research: `
FOCUS: Research with Data
For content ideas WITH keywords or search intent:
1. FIRST: keywords_data_google_ads_search_volume - get actual search metrics
2. THEN: dataforseo_labs_google_keyword_ideas - expand to related topics
3. FINALLY: perplexity_search - for context and trends

For general research without keyword data:
1. perplexity_search - web search with citations
2. read_url - extract content from URL`,

            general: `
FOCUS: General Assistance
Provide helpful guidance without specialized tool usage.`,
        }

        return addendums[primary] || ''
    }
}

// =============================================================================
// EXPORTS
// =============================================================================

export { INTENT_DESCRIPTIONS }

// _review