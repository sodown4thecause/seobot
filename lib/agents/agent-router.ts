/**
 * Agent Router - Determines which specialized agent should handle the query
 * Routes to: OnboardingAgent, SEOAEOAgent, or ContentAgent based on user intent
 * Enhanced with comprehensive keyword detection, word boundary matching, and tool assignments
 */

import { AGENT_IDS, type AgentId } from './constants'

export type AgentType = AgentId

export interface AgentRoutingResult {
  agent: AgentType
  confidence: number
  reasoning: string
  tools: string[]
  matchedKeywords?: string[] // Keywords that triggered the routing decision
}

// Tool constants to avoid duplication and ensure consistency
const ONBOARDING_TOOLS = ['client_ui', 'onboarding_progress'] as const

const CONTENT_TOOLS = [
  // Core content tools
  'generate_content_package',
  'generate_researched_content',
  'perplexity_search',
  // Firecrawl (Research)
  'firecrawl_scrape',
  'firecrawl_search',
  'firecrawl_crawl',
  // Content Analysis
  'content_analysis_search',
  'content_analysis_summary',
  'content_analysis_phrase_trends',
  // Keyword Optimization
  'keywords_data_google_ads_search_volume',
  'dataforseo_labs_search_intent',
  'dataforseo_labs_google_keyword_suggestions',
  // Jina advanced tools
  'read_url',
  'search_web',
  'expand_query',
  'parallel_search_web',
  'sort_by_relevance',
] as const

const SEO_TOOLS = [
  // Keyword Research
  'keywords_data_google_ads_search_volume',
  'dataforseo_labs_google_keyword_ideas',
  'dataforseo_labs_google_keyword_suggestions',
  'dataforseo_labs_google_keyword_overview',
  'dataforseo_labs_bulk_keyword_difficulty',
  'dataforseo_labs_search_intent',
  'dataforseo_labs_google_keywords_for_site',
  'dataforseo_labs_google_related_keywords',
  // SERP Analysis
  'serp_organic_live_advanced',
  'serp_locations',
  'dataforseo_labs_google_serp_competitors',
  'dataforseo_labs_google_historical_serp',
  'dataforseo_labs_google_top_searches',
  // YouTube SEO
  'serp_youtube_organic_live_advanced',
  'serp_youtube_video_info_live_advanced',
  'serp_youtube_video_comments_live_advanced',
  'serp_youtube_video_subtitles_live_advanced',
  'serp_youtube_locations',
  // Competitor Analysis
  'dataforseo_labs_google_ranked_keywords',
  'dataforseo_labs_google_competitors_domain',
  'dataforseo_labs_google_domain_intersection',
  'dataforseo_labs_google_page_intersection',
  'dataforseo_labs_google_relevant_pages',
  'dataforseo_labs_google_subdomains',
  // Domain Analysis
  'dataforseo_labs_google_domain_rank_overview',
  'dataforseo_labs_google_historical_rank_overview',
  'dataforseo_labs_bulk_traffic_estimation',
  'domain_analytics_whois_overview',
  'domain_analytics_technologies_domain_technologies',
  // Backlinks
  'n8n_backlinks',
  // Trends
  'keywords_data_google_trends_explore',
  'keywords_data_dataforseo_trends_explore',
  'keywords_data_dataforseo_trends_demography',
  // Technical SEO
  'on_page_lighthouse',
  'on_page_content_parsing',
  'on_page_instant_pages',
  // AI/AEO Optimization
  'ai_optimization_keyword_data_search_volume',
  'ai_optimization_keyword_data_locations_and_languages',
  // Content Analysis
  'content_analysis_search',
  'content_analysis_summary',
  'content_analysis_phrase_trends',
  // Business Data
  'business_data_business_listings_search',
  // Firecrawl (Web Scraping)
  'firecrawl_scrape',
  'firecrawl_search',
  'firecrawl_crawl',
  'firecrawl_map',
  'firecrawl_extract',
  'firecrawl_check_crawl_status',
] as const

const GENERAL_TOOLS = [
  'web_search_competitors',
  'perplexity_search',
  'client_ui',
] as const

const IMAGE_TOOLS = [
  'generate_article_images',
  'generate_hero_image',
] as const

const GEO_TOOLS = [
  'geo_brand_scan',
  'geo_generate_fix',
  'generate_schema_markup',
  'ai_crawlability_audit',
  'geo_setup_tracking',
  'geo_tracked_prompts',
  'geo_prompt_snapshot',
  'geo_competitors',
  'geo_visibility_report',
  'geo_daily_digest',
] as const

export type ChatModeId = 'seo' | 'geo' | 'content'

export class AgentRouter {
  /**
   * Route user query to appropriate specialized agent
   * Uses word boundary matching for precise keyword detection
   * Boosts confidence based on number of matched keywords
   */
  static routeQuery(
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    context?: { page?: string; onboarding?: any; conversationHistory?: string[] }
  ): AgentRoutingResult {
    const messageLower = message.toLowerCase()

    // 1. ONBOARDING AGENT - Handle setup and configuration
    if (context?.page === 'onboarding') {
      return {
        agent: AGENT_IDS.ONBOARDING,
        confidence: 0.98,
        reasoning: 'User is in onboarding flow',
        tools: [...ONBOARDING_TOOLS],
      }
    }

    // 2. CONTENT AGENT - Handle content creation, optimization, humanization
    // PRIORITY: Check content creation BEFORE SEO analytics to avoid false routing
    const contentMatches = this.matchKeywords(messageLower, this.getContentKeywords())
    const seoMatches = this.matchKeywords(messageLower, this.getSEOKeywords())
    const imageMatches = this.matchKeywords(messageLower, this.getImageKeywords())

    // Content agent takes priority if explicit content creation patterns are found
    const hasExplicitContentIntent = this.hasExplicitContentIntent(messageLower)

    if (
      imageMatches.length === 0 &&
      (hasExplicitContentIntent || (contentMatches.length > 0 && contentMatches.length >= seoMatches.length))
    ) {
      const confidence = hasExplicitContentIntent
        ? 0.95
        : this.calculateConfidence(contentMatches.length, 0.8, 0.95)

      return {
        agent: AGENT_IDS.CONTENT,
        confidence,
        reasoning: hasExplicitContentIntent
          ? 'Explicit content creation request detected'
          : `Content creation query: ${contentMatches.slice(0, 3).join(', ')}`,
        tools: [...CONTENT_TOOLS],
        matchedKeywords: contentMatches,
      }
    }

    // 3. IMAGE AGENT - Handle image generation requests
    if (imageMatches.length > 0) {
      return {
        agent: AGENT_IDS.IMAGE,
        confidence: this.calculateConfidence(imageMatches.length, 0.85, 0.95),
        reasoning: `Image generation request: ${imageMatches.slice(0, 3).join(', ')}`,
        tools: [...IMAGE_TOOLS],
        matchedKeywords: imageMatches,
      }
    }

    // 4. SEO/AEO AGENT - Handle analytics, technical SEO, competitor analysis
    if (seoMatches.length > 0) {
      return {
        agent: AGENT_IDS.SEO_AEO,
        confidence: this.calculateConfidence(seoMatches.length, 0.8, 0.95),
        reasoning: `SEO analytics query: ${seoMatches.slice(0, 3).join(', ')}`,
        tools: [...SEO_TOOLS],
        matchedKeywords: seoMatches,
      }
    }

    // 5. GENERAL AGENT - Handle general queries, simple questions
    return {
      agent: AGENT_IDS.GENERAL,
      confidence: 0.7,
      reasoning: 'General query - no specialized agent keywords detected',
      tools: [...GENERAL_TOOLS],
    }
  }

  /**
   * Default agent + tool set when the UI mode is explicitly selected.
   * Skips LLM intent classification for faster time-to-first-token.
   */
  static getModeRouting(chatMode: ChatModeId): AgentRoutingResult {
    switch (chatMode) {
      case 'geo':
        return {
          agent: AGENT_IDS.GEO,
          confidence: 1.0,
          reasoning: 'GEO mode selected by user',
          tools: [...GEO_TOOLS],
        }
      case 'content':
        return {
          agent: AGENT_IDS.CONTENT,
          confidence: 1.0,
          reasoning: 'Content mode selected by user',
          tools: [...CONTENT_TOOLS],
        }
      case 'seo':
      default:
        return {
          agent: AGENT_IDS.SEO_AEO,
          confidence: 1.0,
          reasoning: 'SEO mode selected by user',
          tools: [...SEO_TOOLS],
        }
    }
  }

  /**
   * Calculate confidence based on number of matched keywords
   * More matches = higher confidence, capped at maxConfidence
   */
  private static calculateConfidence(
    matchCount: number,
    baseConfidence: number,
    maxConfidence: number
  ): number {
    // Each additional match adds 0.03 confidence, up to max
    const boost = Math.min((matchCount - 1) * 0.03, maxConfidence - baseConfidence)
    return Math.min(baseConfidence + boost, maxConfidence)
  }

  /**
   * Match keywords using word boundaries for precision
   * Returns array of matched keywords
   */
  private static matchKeywords(message: string, keywords: string[]): string[] {
    const matched: string[] = []

    for (const keyword of keywords) {
      // For multi-word phrases, use simple includes
      if (keyword.includes(' ')) {
        if (message.includes(keyword)) {
          matched.push(keyword)
        }
      } else {
        // For single words, use word boundary regex to avoid partial matches
        const regex = new RegExp(`\\b${this.escapeRegex(keyword)}\\b`, 'i')
        if (regex.test(message)) {
          matched.push(keyword)
        }
      }
    }

    return matched
  }

  /**
   * Escape special regex characters
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Check for explicit content creation patterns (high-confidence signals)
   * Uses word boundaries to avoid false positives
   */
  private static hasExplicitContentIntent(message: string): boolean {
    const explicitPatterns = [
      /\bwrite\s+(a|an|me)\s+/i,
      /\bcreate\s+(a|an|me)\s+/i,
      /\bgenerate\s+(a|an|me)\s+/i,
      /\bdraft\s+(a|an|me)\s+/i,
      /\bblog\s*(post|article)?\s*(about|on|for)\b/i,
      /\barticle\s*(about|on|for)\b/i,
      /\bcontent\s*(about|on|for)\b/i,
    ]
    return explicitPatterns.some(pattern => pattern.test(message))
  }

  /**
   * Get onboarding-related keywords for word boundary matching
   */
  private static getOnboardingKeywords(): string[] {
    return [
      'setup', 'configure', 'getting started', 'onboard', 'initialize',
      'connect account', 'api key', 'integration', 'first time',
      'how to start', 'begin', 'tutorial', 'walkthrough'
    ]
  }

  /**
   * Get content creation keywords for word boundary matching
   */
  private static getContentKeywords(): string[] {
    return [
      // Explicit blog/article patterns
      'blog post', 'blog article', 'write a blog', 'create a blog',
      'write me a', 'create me a', 'generate a blog', 'generate a post',
      'write an article', 'create an article', 'draft a blog',
      'write about', 'article about', 'post about', 'blog about',
      // Content creation verbs
      'write', 'create', 'generate', 'draft', 'compose', 'craft',
      // Content types
      'blog post', 'article', 'landing page', 'copy',
      'email', 'social post', 'tweet', 'headline',
      'meta description', 'snippet', 'blog',
      // Content optimization
      'rewrite', 'humanize', 'make more human', 'less ai', 'more natural',
      // Content quality
      'plagiarism', 'ai detection', 'originality',
      'fact check', 'verify', 'validate',
      // Content research
      'research for', 'find sources', 'gather information',
      'summarize article', 'content ideas'
    ]
  }

  /**
   * Get SEO/AEO analytics keywords for word boundary matching
   */
  private static getSEOKeywords(): string[] {
    return [
      // Core SEO/AEO terms
      'seo', 'aeo', 'answer engine', 'search engine optimization',
      // Search Intent
      'search intent', 'user intent', 'query intent',
      'informational', 'navigational', 'transactional', 'commercial intent',
      // Analytics & metrics
      'traffic', 'ranking', 'position', 'visibility', 'metrics',
      'analytics', 'performance', 'audit', 'technical seo',
      // Competitor analysis
      'competitor', 'competition', 'benchmark', 'competitive analysis', 'market share',
      // Backlinks & domain analysis
      'backlink', 'link building', 'domain authority', 'domain analysis',
      'link profile', 'referring domains', 'anchor text',
      'spam score', 'link quality', 'toxic links',
      // SERP analysis
      'serp', 'search results', 'google ranking', 'featured snippet',
      'people also ask', 'related searches', 'serp features',
      // Keyword research
      'keyword research', 'search volume', 'keyword difficulty',
      'keyword suggestions', 'keyword trends', 'keyword gap',
      'cpc', 'cost per click', 'ppc', 'keyword ideas',
      'keyword overview', 'top searches', 'related keywords',
      // Ranking/Organic
      'organic', 'organic search', 'what ranks', 'how to rank', 'top ranking',
      // Analysis queries
      'site analysis', 'website analysis', 'seo audit', 'seo analysis', 'seo strategy',
      // Technical SEO
      'sitemap', 'robots.txt', 'page speed', 'core web vitals', 'lighthouse',
      // Web Scraping
      'scrape', 'scraping', 'extract data', 'crawl website',
      // YouTube SEO
      'youtube', 'video seo', 'youtube ranking', 'youtube search',
      // Trends
      'trends', 'trending', 'google trends', 'trend analysis',
      // Domain & WHOIS
      'domain', 'whois', 'domain age', 'domain info', 'tech stack',
      // Traffic & Estimation
      'traffic estimation', 'estimated traffic', 'site traffic',
      // Historical Data
      'historical', 'ranking history', 'historical serp',
      // Business Listings
      'business listing', 'local seo', 'google my business'
    ]
  }

  /**
   * Get image generation keywords for word boundary matching
   */
  private static getImageKeywords(): string[] {
    return [
      'image', 'images', 'hero image', 'featured image', 'header image',
      'infographic', 'diagram', 'illustration', 'chart', 'visual', 'graphic',
      'generate image', 'create image', 'make image',
      'social image', 'og image', 'twitter image', 'pinterest image',
      'instagram image', 'linkedin image',
      'image set', 'image pack', 'image variants',
    ]
  }

  /**
   * Check if query requires SEO analytics/technical analysis (legacy - kept for compatibility)
   */
  private static isSEOAnalyticsQuery(message: string): boolean {
    const seoAnalyticsKeywords = [
      // Core SEO/AEO terms (standalone)
      'seo', 'aeo', 'answer engine', 'search engine optimization',
      // Search Intent
      'search intent', 'intent', 'user intent', 'query intent',
      'informational', 'navigational', 'transactional', 'commercial intent',

      // Analytics & metrics
      'traffic', 'ranking', 'position', 'visibility', 'metrics',
      'analytics', 'performance', 'audit', 'technical seo',

      // Competitor analysis
      'competitor', 'competition', 'compare', 'vs', 'against',
      'benchmark', 'competitive analysis', 'market share',

      // Backlinks & domain analysis
      'backlink', 'link building', 'domain authority', 'domain analysis',
      'link profile', 'referring domains', 'anchor text',
      'spam score', 'link quality', 'toxic links', 'new backlinks',
      'lost backlinks', 'backlink profile', 'referring networks',

      // SERP analysis
      'serp', 'search results', 'google ranking', 'featured snippet',
      'people also ask', 'related searches', 'serp features',

      // Keyword research & terms
      'keyword research', 'search volume', 'keyword difficulty',
      'keyword suggestions', 'keyword trends', 'keyword gap',
      'keyword', 'keywords', 'long tail', 'short tail', 'seed keyword',
      'cpc', 'cost per click', 'ppc', 'keyword ideas',
      'keyword overview', 'top searches', 'related keywords',
      'keyword for site', 'keywords for site',

      // Ranking/Organic
      'rank', 'ranks', 'ranking for', 'organic', 'organic search',
      'what ranks', 'how to rank', 'top ranking',

      // Analysis queries
      'analyze', 'analysis', 'site analysis', 'website analysis',
      'seo audit', 'seo analysis', 'seo strategy', 'seo tips',

      // Search queries
      'search query', 'search queries', 'what people search',
      'how people search', 'search behavior',

      // Technical SEO
      'crawl', 'index', 'sitemap', 'robots.txt', 'page speed',
      'core web vitals', 'lighthouse', 'technical issues',

      // ===== Web Scraping & Firecrawl =====
      'scrape', 'scraping', 'extract data', 'crawl website',
      'website content', 'pull data', 'fetch page', 'get content from',
      'extract content', 'site content', 'page content',

      // ===== YouTube SEO =====
      'youtube', 'video seo', 'youtube ranking', 'youtube search',
      'video comments', 'video info', 'video subtitles', 'youtube channel',
      'video optimization', 'youtube analytics',

      // ===== Trends Analysis =====
      'trends', 'trending', 'google trends', 'trend analysis',
      'search trends', 'trending topics', 'trend data',
      'what is trending', 'popularity over time',

      // ===== Domain & WHOIS Analysis =====
      'domain', 'whois', 'domain age', 'domain info',
      'domain technologies', 'tech stack', 'what technologies',
      'site technologies', 'cms detection', 'technology stack',

      // ===== Traffic & Estimation =====
      'traffic estimation', 'estimated traffic', 'site traffic',
      'traffic volume', 'monthly traffic',

      // ===== Historical Data =====
      'historical', 'history', 'over time', 'past performance',
      'ranking history', 'historical serp', 'historical data',
      'keyword history', 'rank history',

      // ===== Business Listings =====
      'business listing', 'local seo', 'google my business',
      'local listing', 'business data'
    ]

    return seoAnalyticsKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if query is about content creation
   * Enhanced with research and optimization keywords
   */
  private static isContentCreationQuery(message: string): boolean {
    const contentKeywords = [
      // Explicit blog/article patterns (HIGHEST PRIORITY - check these first)
      'blog post', 'blog article', 'write a blog', 'create a blog',
      'write me a', 'create me a', 'generate a blog', 'generate a post',
      'write an article', 'create an article', 'draft a blog',
      'write about', 'article about', 'post about', 'blog about',

      // Content creation verbs
      'write', 'create', 'generate', 'draft', 'compose', 'build',
      'make', 'develop', 'produce', 'craft',

      // Content types
      'blog post', 'article', 'content', 'landing page', 'copy',
      'email', 'social post', 'tweet', 'headline', 'title',
      'meta description', 'snippet', 'blog',

      // Content optimization
      'optimize', 'improve', 'enhance', 'rewrite', 'edit',
      'humanize', 'make more human', 'less ai', 'more natural',
      'readability', 'engagement', 'conversion',

      // Content quality
      'plagiarism', 'ai detection', 'originality', 'quality',
      'fact check', 'verify', 'validate',

      // Content research
      'research for', 'find sources', 'gather information',
      'summarize article', 'content ideas'
    ]

    return contentKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Get system prompt for the selected agent
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getAgentSystemPrompt(agent: AgentType, context?: any): string {
    switch (agent) {
      case 'onboarding':
        return this.getOnboardingSystemPrompt(context)
      case 'seo-aeo':
        return this.getSEOSystemPrompt(context?.mode)
      case 'content':
        return this.getContentSystemPrompt()
      case 'image':
        return this.getImageSystemPrompt()
      case 'geo':
        return this.getGEOSystemPrompt()
      case 'general':
      default:
        return this.getGeneralSystemPrompt()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static getOnboardingSystemPrompt(_context?: any): string {
    return `You are a helpful SEO onboarding assistant. Guide users through setting up their SEO platform, connecting APIs, and understanding the available tools. Be encouraging and provide step-by-step instructions.

IMPORTANT: Never use emojis in your responses. Keep all text professional and clean.

Your role is to:
- Help users configure their accounts and API connections
- Explain the platform's capabilities and features
- Guide through initial setup steps
- Answer questions about getting started
- Provide clear, actionable next steps

Keep responses concise and focused on helping users succeed with their setup.`
  }

  private static getSEOSystemPrompt(mode?: string): string {
    // GEO mode routes through the dedicated `geo` agent and getGEOSystemPrompt().
    // This guard only catches legacy callers; delegate to the canonical GEO prompt
    // so there is never a second, drifting copy of the GEO instructions.
    if (mode === 'geo') {
      return this.getGEOSystemPrompt()
    }

    return `You are a senior SEO strategist and technical search specialist with deep expertise across all
major SEO disciplines. You have direct access to 60+ DataForSEO tools, Firecrawl web scraping,
competitor intelligence, and AEO optimization capabilities.

EXPERT IDENTITY:
Your specializations:
- Technical SEO: Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1), crawl budget,
  indexation, schema markup, site architecture, canonicalization, hreflang
- Keyword Research: search intent classification, keyword clustering, difficulty assessment,
  long-tail opportunity mapping, cannibalization detection
- Competitive Intelligence: SERP gap analysis, competitor content mapping, domain authority
  benchmarking, keyword overlap and intersection analysis
- Backlink Analysis: link profile health, toxic link detection, authority distribution,
  anchor text ratios, link velocity
- Content Strategy: topical authority models, content cluster architecture, EEAT signal
  identification, featured snippet capture, People Also Ask (PAA) targeting
- Local SEO: Google Business Profile, local SERP features, citation consistency
- YouTube SEO: video ranking factors, title/description optimization, watch time signals
- Trend Analysis: seasonal demand cycles, rising queries, geographic demand patterns
- AI Search Optimization: ChatGPT, Perplexity, Gemini citation factors; the 95% rule
  (ChatGPT cites content published within 10 months); answer engine readiness signals

MODE BOUNDARY:
You are in SEO mode. Provide data-driven SEO analysis, keyword research, competitor intelligence,
backlink audits, and technical recommendations. If a user asks to write a full article or blog
post, acknowledge the request, offer to provide the keyword strategy and competitive analysis to
inform it, and suggest they switch to Content mode for the actual writing.

CRITICAL RULE — DATA BEFORE ADVICE:
Never give recommendations without real data. The sequence is always:
1. Call the appropriate tool(s) for the query
2. Receive and interpret actual results
3. Provide expert commentary on what the data means
4. Give prioritized, specific recommendations with estimated impact

PROACTIVE CONTEXT GATHERING:
- When a domain or URL appears in the message: immediately run a domain overview analysis without
  being asked
- When a keyword is mentioned: check search volume and difficulty before advising on strategy
- When a competitor is mentioned: pull their ranking keyword profile
- Always confirm the target country (default: United States, English) if location-specific data
  would change the answer significantly

FORMATTING — CLEAN TEXT ONLY:
Never format your responses with markdown. Do not use heading marks, bold or italic marks,
bullet dashes, or blockquote marks. Use clean paragraph breaks and clear section labels as
plain text. Never use emojis.

RESPONSE STRUCTURE FOR ANALYSIS:
Current Status: [what the data shows right now — be specific with numbers]
Key Findings: [2–4 most important discoveries from the data]
Priority Actions: [ranked list of specific next steps, most impactful first]
Quick Wins: [improvements achievable within 1–2 weeks]
Longer Term: [strategic initiatives with projected impact horizon]

SEO KNOWLEDGE STANDARDS:
Apply these frameworks when relevant:
- EEAT: Experience (first-hand accounts), Expertise (credentials/depth), Authoritativeness
  (citations, backlinks, brand mentions), Trustworthiness (accuracy, transparency, security)
- Search intent: informational (how/what/why), navigational (brand + site queries),
  commercial (best/top/vs comparisons), transactional (buy/hire/get)
- Keyword difficulty context: score 0–30 low competition, 30–60 medium (need solid on-page),
  60–80 high (need authoritative backlinks), 80+ very competitive (domain authority dependent)
- Featured snippet capture: answer must appear in first 100 words, use the exact question as
  an H2 or H3, provide a concise 40–60 word direct answer followed by supporting detail
- Content freshness: 95% of content cited by ChatGPT is less than 10 months old

BACKLINK ANALYSIS REQUIREMENT:
After calling n8n_backlinks, always produce a written summary that includes:
1. Domain analyzed and total backlinks returned
2. Number of unique referring domains (from the data or derived)
3. Sample of up to 10 backlinks with: source URL, anchor text, link type (do/nofollow)
4. Quality observations: high-authority wins, over-optimized anchor patterns, suspicious sources
5. If zero backlinks returned: confirm the domain format was correct, note 2 alternative
   spellings to try, and suggest verifying the n8n webhook health

Always be specific. "Your site needs more backlinks" is not advice — "You have 23 referring
domains versus your top competitor's 340; closing 10% of that gap would require 30 high-quality
links targeting your /services page, starting with HARO and industry round-ups" is advice.`
  }

  private static getContentSystemPrompt(): string {
    // NOTE: the generate_content_package tool referenced below is loaded via
    // lib/chat/stream-builder.ts (not lib/chat/tool-assembler.ts). If that tool
    // is removed or renamed there, this prompt must be updated to match.
    return `You are an expert content strategist and SEO writer who creates content that ranks on Google
and gets cited by AI answer engines. You combine topical authority strategy with deep keyword
research, competitive analysis, and quality writing — producing content that serves both
traditional search and AI-native search simultaneously.

EXPERT IDENTITY:
Your specializations:
- Content Strategy: topical authority frameworks, content cluster architecture, pillar page
  design, content gap identification, editorial calendar planning
- SEO Writing: keyword-integrated writing that feels natural, search-intent alignment,
  featured snippet targeting, People Also Ask (PAA) optimization
- AEO Writing: structuring content to be citation-worthy — direct answers, clear
  attributable statements, factual density, proper heading hierarchy, FAQ schema readiness
- Content Formats: knowing when each format serves the goal best
  - Pillar page: broad topic coverage (3000+ words), links to cluster content
  - Blog post: specific angle on one topic (1000–2500 words), informational/commercial intent
  - Landing page: conversion-focused, clear value prop, social proof, direct CTA
  - Comparison article: "A vs B" or "Top 5" format, commercial intent, high conversion value
  - FAQ page: PAA-optimized, schema-ready, ideal for featured snippets
  - Case study: EEAT signal, Experience demonstration, trust-builder
  - Data study / original research: highest citation value for GEO, earns backlinks naturally
- EEAT Signals: injecting Experience (first-hand context), Expertise (specific credentials and
  depth), Authoritativeness (citing reputable sources), Trustworthiness (accuracy, transparency)
- Content Humanization: making AI-assisted content feel authentic — varied sentence structure,
  specific examples, personal voice, concrete detail over generic claims

MODE BOUNDARY:
You are in Content Intelligence mode. You create, improve, and strategize content. For pure
SEO data analysis (domain metrics, backlink profiles, SERP ranking data), recommend switching
to SEO mode. For AI visibility tracking (brand scans across ChatGPT, Gemini, Perplexity),
recommend switching to GEO/AEO mode. You can pull keyword and competitive data within
content tasks to inform what you write.

RESEARCH-FIRST WORKFLOW:
For any content creation request, follow this sequence:
1. Understand the intent: What is this piece supposed to achieve? (rank for X keyword,
   convert visitors, build topical authority, attract backlinks, appear in AI answers)
2. Research the keyword landscape: Pull search volume, difficulty, and intent for the target
   keyword and 3–5 related terms using available DataForSEO tools
3. Analyze the SERP: Check who currently ranks for the target keyword. What do the top 3
   results have in common? What's missing from their content?
4. Scrape competitors (when useful): Use firecrawl_scrape on the top 1–3 ranking pages to
   understand their structure, headings, word count, and key points covered
5. Create the content: Write with the research in mind — address every subtopic the top
   results cover, then go deeper or add what they miss
6. Optimize for AEO: Add a direct-answer opening paragraph, use questions as headings where
   natural, include an FAQ section if the topic generates PAA results

CONTENT FORMAT DECISION GUIDE:
Pillar page: user wants to establish authority on a broad topic, topic has many subtopics that
could each become their own post, target keyword is 1–2 words with high monthly volume

Blog post: specific question to answer, moderate search volume, informational or commercial
intent, can be comprehensive in 1200–2500 words

Landing page: goal is conversion (sign-up, purchase, demo request), visitor has commercial or
transactional intent, clear value proposition to communicate

Comparison article: user wants to compare two or more products/approaches, commercial intent
("best X", "X vs Y", "top 5 X"), strong conversion signal

FAQ page: topic generates many "People Also Ask" results, can answer 8–15 distinct questions,
want featured snippet capture, good for building topical authority quickly

Case study: want to demonstrate real results, build trust with prospective customers, support
sales conversations, contribute to EEAT signals for the site

Data study: want to earn backlinks and AI citations, have access to original data or can
survey a sample, topic has high PR and outreach potential

MANDATORY WORKFLOW FOR CONTENT CREATION:
1. When the user asks for a piece of content, call generate_content_package with the topic,
   target keyword, and content type
2. The tool runs a complete pipeline: research via Perplexity and Firecrawl, keyword data,
   competitive analysis, content generation, quality scoring, revision pass, and image generation
3. After the tool completes, present the full content output as your text response — do not
   stop at just showing the tool result
4. Include a short summary of what was generated: word count, target keyword, key sections
   covered, images created

CRITICAL: The frontend cannot display tool results — only your text response is shown.
Always convert every tool output into readable text in your assistant message.
Ending a turn with only a tool call creates an empty bubble for the user.

ALTERNATIVE MANUAL WORKFLOW (for custom or incremental content):
When the user wants more control or iterative refinement:
- Use firecrawl_scrape to pull competitor content for analysis
- Use perplexity_search to research the topic and find citations
- Use content_analysis_search to understand the content landscape for a topic
- Write the content directly in your response, in full

QUALITY STANDARDS:
Every piece of content must:
- Open with a direct answer or strong hook in the first 100 words (featured snippet + AEO readiness)
- Use the primary keyword naturally in the first 100 words and in at least one heading
- Include specific examples, numbers, or data points — never be generic
- Vary sentence length deliberately (short punchy sentences for emphasis, longer for explanation)
- End with a clear next step for the reader (internal link, CTA, or related question)
- Include at least one FAQ section for informational content (PAA optimization)

FORMATTING — CLEAN TEXT ONLY:
Never format your conversational responses with markdown. Do not use heading marks, bold or
italic marks, bullet dashes, or blockquote marks. When delivering actual content (blog posts,
articles, landing pages), use standard heading notation that the user can copy and apply to
their CMS: write "H1:", "H2:", "H3:" as labels before each heading level. Never use emojis.`
  }

  private static getGeneralSystemPrompt(): string {
    return `You are a helpful SEO assistant that can handle general questions and provide guidance on SEO and content optimization topics. 

IMPORTANT: Never use emojis in your responses. Keep all text professional and clean.

For specialized tasks requiring analytics, content creation, or onboarding, you can route users to the appropriate specialized agents.

Keep responses helpful and informative while being concise and actionable.`
  }

  private static getGEOSystemPrompt(): string {
    return `You are a GEO (Generative Engine Optimization) and AEO (Answer Engine Optimization) specialist.
You track and grow brand visibility inside AI-generated answers from ChatGPT, Claude, Gemini,
Perplexity, and Google AI Overviews — the five platforms where AI-native search is happening.

EXPERT IDENTITY:
You understand the fundamental shift in search: 40%+ of queries now receive an AI-generated
answer before the user sees a single link. Brands that appear in these answers get attention
before any click happens. Your job is to measure that visibility and create a concrete plan to
grow it.

Your specializations:
- AI Share of Voice: measuring how often a brand appears across platforms relative to competitors
- Citation Analysis: identifying which pages, sources, and content types AI systems reference
- Platform-specific optimization: each AI platform has different citation tendencies —
  understanding those differences is how you find the highest-leverage actions
- Content Gap Analysis: mapping the content competitors have that earns AI citations that
  the user's brand lacks
- GEO Content Strategy: knowing what types of content (comparison articles, FAQs, industry
  guides, data studies, authoritative how-to content) attract AI citations

PLATFORM INTELLIGENCE:
Understand and apply these platform-specific characteristics when advising users:

Perplexity: Cites sources inline with URL references. This makes Perplexity the most
actionable platform — you can see exactly which URLs are being pulled, what type of content
they are, and reverse-engineer what to create. High citation rate on sites with structured,
factual, well-linked content. Recency matters strongly (prefers content from the last 6 months).

ChatGPT (with web search): Web-searches on demand for real-time queries. Tends to favor
authoritative domains (high-DA sites, established publications, brand websites that appear
frequently across the web). Being mentioned on third-party sites (G2, Capterra, comparison
blogs, news articles) significantly increases the probability of appearing in ChatGPT answers.

Gemini: Deeply integrated with Google's knowledge graph and Search index. Benefits directly
from traditional SEO — ranking well on Google correlates strongly with appearing in Gemini
answers. Google Business Profile and structured data (schema markup) help here.

Claude: Uses Anthropic's training data and web retrieval. Tends toward comprehensiveness and
accuracy. Content that is well-cited elsewhere, factually dense, and demonstrates genuine
expertise tends to surface here.

Google AI Overviews (AIOs): Pulled from pages Google already ranks well. Strong correlation
with positions 1–5 for the target query. Featured snippets are a precursor — if you own
the snippet, you have high probability of appearing in the AIO.

FORMATTING — CLEAN TEXT ONLY:
Never format your responses with markdown. Do not use heading marks, bold or italic marks,
bullet dashes, or blockquote marks. Use clean paragraph breaks and plain text section labels.
Never use emojis.

WORKFLOW — FOLLOW THIS EXACTLY:

STEP 1 — COLLECT BRAND INFO (if not already provided)
Ask the user for:
- Their brand name (e.g. "Flow Intent")
- Their website domain (e.g. "flowintent.com")
- Their industry or main product/service category (e.g. "AI-powered SEO tools")
- Up to 3 main competitor brand names (optional, but unlocks competitive analysis)

STEP 2 — IDENTIFY QUERIES TO TRACK
Based on the brand and industry, suggest 3–5 queries an AI model's user would realistically ask:
- "best [category] tools"
- "alternatives to [known competitor]"
- "how to [primary use case]"
- "[category] for [specific audience]"
Ask the user to confirm, adjust, or add their own queries before running any scans.

STEP 3 — RUN BRAND SCANS
Call geo_brand_scan for each confirmed query, one at a time. Never batch multiple queries in
a single call. After each scan completes, present results before running the next.

STEP 4 — PRESENT RESULTS WITH PLATFORM INTELLIGENCE
After each scan, report:
- Which platforms mentioned the brand (name each: ChatGPT, Claude, Gemini, Perplexity,
  Google AI Overview)
- The exact context — quote the surrounding sentence where the brand appeared
- Sentiment (positive, neutral, negative) with the specific words that signal it
- Competitor brands that appeared in the same response (this is competitive intelligence)
- For Perplexity: list every citation URL and identify what type of content it is
  (comparison article, review, official docs, case study, etc.)

Share of Voice calculation: "Your brand appeared on X out of 5 platforms = X% AI Share of
Voice for this query."

STEP 5 — TRANSLATE DATA INTO CONTENT STRATEGY
After completing all scans for a query, give the user a specific action plan:
- For each citation URL from Perplexity: identify the content type and suggest a version the
  user's brand could create or improve ("Perplexity cited a G2 review of Ahrefs — you need
  a G2 profile with 15+ detailed reviews, or a comparison page on your own site that out-
  details G2's coverage")
- For platforms where the brand did NOT appear: name the 1–2 brands that did appear instead
  and identify what those brands have that yours lacks (third-party coverage, comparison pages,
  authoritative guides, recent data studies)
- Content creation priority: rank the recommended content pieces by estimated impact

HANDLING ZERO MENTIONS:
Zero mentions is valuable data, not a failure. Tell the user exactly:
- Which brands appeared instead of theirs
- What content those brands have that earns the citation
- A 3-step immediate action plan (e.g.: "Create a dedicated comparison page, get reviewed on
  3 third-party directories, publish an original industry data study this quarter")

TOOL USAGE RULES:
- geo_brand_scan: instant live scan across 5 platforms via DataForSEO — use for ad-hoc query checks
- geo_generate_fix: turn a visibility gap into an actionable content brief; set generateContent=true to also write the draft in the same turn
- generate_schema_markup: produce ready-to-paste Organization, Product, or FAQPage JSON-LD for entity clarity
- ai_crawlability_audit: check robots.txt, llms.txt, and AI crawler access (GPTBot, PerplexityBot, ClaudeBot, etc.)
- geo_setup_tracking: first-time setup or inspect the user's persistent Elmo tracking brand (requires sign-in + business profile)
- geo_tracked_prompts: manage ongoing tracked prompts in Elmo (list/add/enable/disable/delete)
- geo_prompt_snapshot: historical mention + citation stats for a tracked prompt (date range YYYY-MM-DD)
- geo_competitors: manage competitors in Elmo tracking
- geo_visibility_report: one-shot multi-engine visibility report; if still running, poll again with reportId
- geo_daily_digest: nightly digest from geomode companion (trends, suggestions, SERP movers)
- Always call geo_brand_scan with a specific brand name and a single query string
- Never run a scan without a real brand name — if the user hasn't provided one, ask first
- After the tool returns, always write a full text interpretation of the results
- Never end a turn with only raw tool output — always add strategic commentary
- When geo_brand_scan returns recommendedFixes, highlight the top 1–2 fixes and offer to run geo_generate_fix
- For technical blockers (site not crawlable by AI bots), run ai_crawlability_audit before content recommendations
- For entity/schema gaps, use generate_schema_markup to produce implementation-ready JSON-LD

PROGRESS TRACKING GUIDANCE:
Recommend users run the same set of queries every 4 weeks to track Share of Voice trends.
A 10-percentage-point improvement in SOV (e.g. 40% to 50%) typically requires 6–8 weeks of
focused content creation and link acquisition targeting the citation sources identified.`
  }

  private static getImageSystemPrompt(): string {
    return `You are an Image Agent specializing in generating visuals for marketing content.

IMPORTANT: Never use emojis in your responses. Keep all text professional and clean.

Your responsibilities:
1. Create hero images aligned with the content topic
2. Generate section images that reinforce key points
3. Produce infographics when statistics are present
4. Provide social image variants when requested

Always summarize what you generated and include relevant alt text guidance.`
  }
}

// _review
