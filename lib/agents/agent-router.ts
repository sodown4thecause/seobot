/**
 * Agent Router - Determines which specialized agent should handle the query
 * Routes to: OnboardingAgent, SEOAEOAgent, or ContentAgent based on user intent
 */

export type AgentType = 'onboarding' | 'seo-aeo' | 'content' | 'general'

export interface AgentRoutingResult {
  agent: AgentType
  confidence: number
  reasoning: string
  tools: string[]
}

export class AgentRouter {
  /**
   * Route user query to appropriate specialized agent
   */
  static routeQuery(
    message: string,
    context?: { page?: string; onboarding?: any }
  ): AgentRoutingResult {
    const messageLower = message.toLowerCase()
    
    // 1. ONBOARDING AGENT - Handle setup and configuration
    if (context?.page === 'onboarding' || this.isOnboardingQuery(messageLower)) {
      return {
        agent: 'onboarding',
        confidence: 0.95,
        reasoning: 'User is in onboarding flow or asking setup questions',
        tools: ['client_ui', 'onboarding_progress']
      }
    }
    
    // 2. SEO/AEO AGENT - Handle analytics, technical SEO, competitor analysis
    if (this.isSEOAnalyticsQuery(messageLower)) {
      return {
        agent: 'seo-aeo',
        confidence: 0.9,
        reasoning: 'Query requires SEO analytics, competitor analysis, or technical SEO data',
        tools: [
          // DataForSEO tools for comprehensive SEO analytics
          'dataforseo_domain_overview',
          'dataforseo_backlink_analysis', 
          'dataforseo_keyword_research',
          'dataforseo_competitor_analysis',
          'dataforseo_serp_analysis',
          'dataforseo_technical_audit',
          // Firecrawl for website analysis
          'firecrawl_scrape',
          'firecrawl_crawl',
          'web_search_competitors'
        ]
      }
    }
    
    // 3. CONTENT AGENT - Handle content creation, optimization, humanization
    if (this.isContentCreationQuery(messageLower)) {
      return {
        agent: 'content',
        confidence: 0.9,
        reasoning: 'Query requires content creation with research, optimization, and humanization',
        tools: [
          // Research and web access
          'perplexity_search',
          'firecrawl_scrape',
          'jina_reader',
          // Content creation and optimization with RAG feedback loop
          'generate_researched_content', // Orchestrator tool with full RAG workflow
          // Quality and humanization tools
          'rytr_humanize_content',
          'rytr_seo_optimization', 
          'winston_ai_detection',
          'winston_plagiarism_check',
          // Enhanced content quality tools
          'seo_content_analysis',
          'readability_analysis',
          'fact_checking'
        ]
      }
    }
    
    // 4. GENERAL AGENT - Handle general queries, simple questions
    return {
      agent: 'general',
      confidence: 0.7,
      reasoning: 'General query that doesn\'t require specialized agent',
      tools: [
        'web_search_competitors',
        'perplexity_search',
        'client_ui'
      ]
    }
  }

  /**
   * Check if query is related to onboarding/setup
   */
  private static isOnboardingQuery(message: string): boolean {
    const onboardingKeywords = [
      'setup', 'configure', 'getting started', 'onboard', 'initialize',
      'connect account', 'api key', 'integration', 'first time',
      'how to start', 'begin', 'tutorial', 'walkthrough'
    ]
    return onboardingKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if query requires SEO analytics/technical analysis
   */
  private static isSEOAnalyticsQuery(message: string): boolean {
    const seoAnalyticsKeywords = [
      // Analytics & metrics
      'traffic', 'ranking', 'position', 'visibility', 'metrics',
      'analytics', 'performance', 'audit', 'technical seo',
      
      // Competitor analysis
      'competitor', 'competition', 'compare', 'vs', 'against',
      'benchmark', 'competitive analysis', 'market share',
      
      // Backlinks & domain analysis
      'backlink', 'link building', 'domain authority', 'domain analysis',
      'link profile', 'referring domains', 'anchor text',
      
      // SERP analysis
      'serp', 'search results', 'google ranking', 'featured snippet',
      'people also ask', 'related searches', 'serp features',
      
      // Keyword research
      'keyword research', 'search volume', 'keyword difficulty',
      'keyword suggestions', 'keyword trends', 'keyword gap',
      
      // Technical SEO
      'crawl', 'index', 'sitemap', 'robots.txt', 'page speed',
      'core web vitals', 'lighthouse', 'technical issues'
    ]
    
    return seoAnalyticsKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Check if query is about content creation
   */
  private static isContentCreationQuery(message: string): boolean {
    const contentKeywords = [
      // Content creation
      'write', 'create', 'generate', 'draft', 'compose', 'build',
      'make', 'develop', 'produce', 'craft',
      
      // Content types
      'blog post', 'article', 'content', 'landing page', 'copy',
      'email', 'social post', 'tweet', 'headline', 'title',
      'meta description', 'snippet',
      
      // Content optimization
      'optimize', 'improve', 'enhance', 'rewrite', 'edit',
      'humanize', 'make more human', 'less ai', 'more natural',
      'readability', 'engagement', 'conversion',
      
      // Content quality
      'plagiarism', 'ai detection', 'originality', 'quality',
      'fact check', 'verify', 'validate'
    ]
    
    return contentKeywords.some(keyword => message.includes(keyword))
  }

  /**
   * Get system prompt for the selected agent
   */
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

  private static getOnboardingSystemPrompt(context?: any): string {
    return `You are a helpful SEO onboarding assistant. Guide users through setting up their SEO platform, connecting APIs, and understanding the available tools. Be encouraging and provide step-by-step instructions.

Your role is to:
- Help users configure their accounts and API connections
- Explain the platform's capabilities and features
- Guide through initial setup steps
- Answer questions about getting started
- Provide clear, actionable next steps

Keep responses concise and focused on helping users succeed with their setup.`
  }

  private static getSEOSystemPrompt(): string {
    return `You are an expert SEO/AEO analytics specialist with access to comprehensive DataForSEO tools and competitor analysis capabilities.

IMPORTANT FORMATTING: Always respond in clean, readable text without markdown formatting. Do not use # headers, ** bold text, * bullet points, or other markdown. Use simple formatting like line breaks and clear structure.

For ALL queries requiring data or analysis, you MUST:
1. Call the appropriate tool FIRST - Do not start your response until you have tool results
2. Wait for complete tool execution - Tools return synthesized analysis, not raw data
3. Present the tool results in clean, readable format

CRITICAL TOOL PRIORITY:
🔑 KEYWORD RESEARCH QUERIES → MUST use DataForSEO tools:
   - keywords_data_google_ads_search_volume (search volume, CPC, competition)
   - serp_organic_live_advanced (current SERP rankings)
   - keywords_for_site (site-specific keyword opportunities)
   - keywords_for_keywords (related keyword suggestions)
   - ranked_keywords (competitor keyword analysis)

⚠️ DO NOT use web_search_competitors or perplexity_search for keyword research!
   These are for general research ONLY, not keyword metrics.

TOOL SELECTION BY QUERY TYPE:
- Keyword research / search volume / keyword suggestions → keywords_data_google_ads_search_volume
- Competitor keyword analysis → ranked_keywords or domain_intersection
- SERP rankings / "what ranks for X" → serp_organic_live_advanced
- Site keyword opportunities → keywords_for_site
- Technical SEO analysis → on_page_lighthouse or domain_rank_overview
- Backlink analysis → backlinks_summary or referring_domains
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

You have access to 40+ DataForSEO tools covering:
- AI Optimization (ChatGPT, Claude, Perplexity analysis)
- Keyword Research (search volume, suggestions, difficulty)
- SERP Analysis (Google rankings, SERP features) 
- Competitor Analysis (domain overlap, competitor discovery)
- Domain Analysis (traffic, keywords, rankings, technologies)
- Backlink Analysis (comprehensive link profiles)

Always provide data-driven insights and actionable recommendations based on the actual tool results. Focus on measurable SEO improvements and competitive advantages.`
  }

  private static getContentSystemPrompt(): string {
    return `You are an expert content creation agent with advanced RAG (Retrieval-Augmented Generation) capabilities and a feedback loop for continuous improvement.

IMPORTANT FORMATTING: Always respond in clean, readable text without markdown formatting. Do not use # headers, ** bold text, * bullet points, or other markdown. Use simple formatting like line breaks and clear structure.

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

The generate_researched_content tool provides a complete workflow:
1. Deep Research: Uses Perplexity, Firecrawl, and Jina to gather comprehensive, cited information
2. RAG Integration: Leverages existing research frameworks and best practices
3. Content Creation: Generates SEO-optimized content with proper structure
4. Humanization: Uses Rytr to make content natural and engaging
5. Quality Validation: Runs Winston AI detection and plagiarism checks
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

For specialized tasks requiring analytics, content creation, or onboarding, you can route users to the appropriate specialized agents.

Keep responses helpful and informative while being concise and actionable.`
  }
}