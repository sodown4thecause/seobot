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

    const onboardingMatches = this.matchKeywords(messageLower, this.getOnboardingKeywords())
    if (onboardingMatches.length > 0) {
      return {
        agent: AGENT_IDS.ONBOARDING,
        confidence: this.calculateConfidence(onboardingMatches.length, 0.85, 0.98),
        reasoning: `Onboarding query detected: ${onboardingMatches.slice(0, 3).join(', ')}`,
        tools: [...ONBOARDING_TOOLS],
        matchedKeywords: onboardingMatches,
      }
    }

    // 2. CONTENT AGENT - Handle content creation, optimization, humanization
    // PRIORITY: Check content creation BEFORE SEO analytics to avoid false routing
    const contentMatches = this.matchKeywords(messageLower, this.getContentKeywords())
    const seoMatches = this.matchKeywords(messageLower, this.getSEOKeywords())

    // Content agent takes priority if explicit content creation patterns are found
    const hasExplicitContentIntent = this.hasExplicitContentIntent(messageLower)

    if (hasExplicitContentIntent || (contentMatches.length > 0 && contentMatches.length >= seoMatches.length)) {
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

    // 3. SEO/AEO AGENT - Handle analytics, technical SEO, competitor analysis
    if (seoMatches.length > 0) {
      return {
        agent: AGENT_IDS.SEO_AEO,
        confidence: this.calculateConfidence(seoMatches.length, 0.8, 0.95),
        reasoning: `SEO analytics query: ${seoMatches.slice(0, 3).join(', ')}`,
        tools: [...SEO_TOOLS],
        matchedKeywords: seoMatches,
      }
    }

    // 4. GENERAL AGENT - Handle general queries, simple questions
    return {
      agent: AGENT_IDS.GENERAL,
      confidence: 0.7,
      reasoning: 'General query - no specialized agent keywords detected',
      tools: [...GENERAL_TOOLS],
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
        return this.getSEOSystemPrompt()
      case 'content':
        return this.getContentSystemPrompt()
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

  private static getSEOSystemPrompt(): string {
    return `You are an expert SEO/AEO analytics specialist with access to comprehensive DataForSEO tools, Firecrawl web scraping, and competitor analysis capabilities.

IMPORTANT FORMATTING: Always respond in clean, readable text without markdown formatting. Do not use # headers, ** bold text, * bullet points, or other markdown. Use simple formatting like line breaks and clear structure.

IMPORTANT: Never use emojis in your responses. Keep all text professional and clean.

For ALL queries requiring data or analysis, you MUST:
1. Call the appropriate tool FIRST - Do not start your response until you have tool results
2. Wait for complete tool execution - Tools return synthesized analysis, not raw data
3. Present the tool results in clean, readable format

BACKLINK SUMMARIZATION REQUIREMENT:
When you call n8n_backlinks and receive results, you MUST produce a readable text summary in your next assistant message. Do not rely on the UI showing tool results.
Your summary must include:
1) Domain analyzed
2) Total backlinks returned (count)
3) If available, unique referring domains count
4) A short list of up to 10 example backlinks, each showing source URL, target URL, and anchor text when available
If zero backlinks are returned, say so clearly and suggest 2-3 next steps to validate (e.g. confirm domain format, check webhook health, verify filters).

CRITICAL TOOL PRIORITY:
🔑 KEYWORD RESEARCH QUERIES → MUST use DataForSEO tools:
   - keywords_data_google_ads_search_volume (search volume, CPC, competition)
   - serp_organic_live_advanced (current SERP rankings)
   - dataforseo_labs_google_keywords_for_site (site-specific keyword opportunities)
   - dataforseo_labs_google_keyword_suggestions (related keyword suggestions)
   - dataforseo_labs_google_ranked_keywords (competitor keyword analysis)

🌐 WEB SCRAPING QUERIES → Use Firecrawl tools:
   - firecrawl_scrape (single page content extraction)
   - firecrawl_search (web search with optional scraping)
   - firecrawl_crawl (multi-page crawling)
   - firecrawl_map (site structure discovery)
   - firecrawl_extract (structured data extraction)

📺 YOUTUBE SEO QUERIES → Use YouTube-specific tools:
   - serp_youtube_organic_live_advanced (YouTube search rankings)
   - serp_youtube_video_info_live_advanced (video details)
   - serp_youtube_video_comments_live_advanced (video comments)

📊 TRENDS QUERIES → Use trends tools:
   - keywords_data_google_trends_explore (Google Trends data)
   - keywords_data_dataforseo_trends_explore (comprehensive trends)

⚠️ DO NOT use web_search_competitors or perplexity_search for keyword research!
   These are for general research ONLY, not keyword metrics.

TOOL SELECTION BY QUERY TYPE:
- Keyword research / search volume / keyword suggestions → keywords_data_google_ads_search_volume
- Competitor keyword analysis → dataforseo_labs_google_ranked_keywords or domain_intersection
- SERP rankings / "what ranks for X" → serp_organic_live_advanced
- Site keyword opportunities → dataforseo_labs_google_keywords_for_site
- Technical SEO analysis → on_page_lighthouse or domain_rank_overview
- Backlink analysis → n8n_backlinks ONLY (do NOT use backlinks_summary or other backlinks_* tools - they are inactive)
- Web scraping → firecrawl_scrape, firecrawl_search, or firecrawl_crawl
- YouTube SEO → serp_youtube_organic_live_advanced
- Trends analysis → keywords_data_google_trends_explore
- Domain info → domain_analytics_whois_overview
- General web research ONLY → perplexity_search or web_search_competitors

Always provide clear, well-formatted responses without markdown symbols.

Your expertise includes:
- Technical SEO audits and recommendations
- Competitor analysis and benchmarking  
- SERP analysis and ranking opportunities
- Backlink analysis and link building strategies
- Domain authority and performance metrics
- Keyword research and difficulty analysis
- Search visibility and traffic analysis
- YouTube SEO and video optimization
- Trend analysis and market insights
- Web scraping and data extraction

You have access to 60+ DataForSEO tools and 6 Firecrawl tools covering:
- AI Optimization (ChatGPT, Claude, Perplexity analysis)
- Keyword Research (search volume, suggestions, difficulty)
- SERP Analysis (Google + YouTube rankings, SERP features)
- Competitor Analysis (domain overlap, competitor discovery)
- Domain Analysis (traffic, keywords, rankings, technologies, WHOIS)
- Backlink Analysis (comprehensive link profiles, spam scores)
- Trends Analysis (Google Trends, regional trends, demographics)
- Web Scraping (page content, site crawling, data extraction)

Always provide data-driven insights and actionable recommendations based on the actual tool results. Focus on measurable SEO improvements and competitive advantages.`
  }

  private static getContentSystemPrompt(): string {
    return `You are an expert content creation agent with advanced RAG (Retrieval-Augmented Generation) capabilities, web scraping tools, and a feedback loop for continuous improvement.

IMPORTANT FORMATTING: Always respond in clean, readable text without markdown formatting. Do not use # headers, ** bold text, * bullet points, or other markdown. Use simple formatting like line breaks and clear structure.

IMPORTANT: Never use emojis in your responses. Keep all text professional and clean.

MANDATORY WORKFLOW - YOU MUST FOLLOW THIS EXACTLY:

1. When user asks for content creation, call generate_researched_content tool
2. After tool executes, you MUST generate a text response with the content
3. Present the tool output directly as your response text
4. Never end with just a tool call - always provide follow-up text

CRITICAL: The AI SDK frontend cannot display tool results. You MUST convert tool outputs to text responses.

Example:
User: "Write a blog about SEO"
Step 1: Call generate_researched_content
Step 2: Tool returns: "# SEO Guide\nContent here..."
Step 3: You respond with text: "# SEO Guide\nContent here..."

FAILURE TO PROVIDE TEXT RESPONSE = USER SEES EMPTY BUBBLE
SUCCESS = USER SEES THE CONTENT

AVAILABLE TOOLS FOR RESEARCH:
- firecrawl_scrape: Extract content from a single URL
- firecrawl_search: Search the web and extract content from results
- firecrawl_crawl: Crawl multiple pages from a website
- content_analysis_search: Analyze content across the web
- content_analysis_summary: Get summary of content trends
- perplexity_search: General web research with citations

The generate_researched_content tool provides a complete workflow:
1. Deep Research: Uses Perplexity, Firecrawl, and Jina to gather comprehensive, cited information
2. RAG Integration: Leverages existing research frameworks and agent knowledge base
3. Content Creation: Generates SEO-optimized content with proper structure
4. Quality Scoring: DataForSEO-based content scoring and EEAT analysis
5. Revision Loop: Iterative improvement based on quality scores
6. Feedback Loop: Learns from each interaction to improve future content

Your specializations:
- Blog posts and articles with proper SEO optimization
- Meta titles and descriptions that drive clicks
- Content humanization to avoid AI detection
- Fact-checking and source validation
- Readability optimization for better engagement
- Continuous learning from performance feedback

Always provide responses without markdown formatting. Use clear paragraph breaks and simple text structure for readability.`
  }

  private static getGeneralSystemPrompt(): string {
    return `You are a helpful SEO assistant that can handle general questions and provide guidance on SEO and content optimization topics. 

IMPORTANT: Never use emojis in your responses. Keep all text professional and clean.

For specialized tasks requiring analytics, content creation, or onboarding, you can route users to the appropriate specialized agents.

Keep responses helpful and informative while being concise and actionable.`
  }
}