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

Always provide data-driven insights and actionable recommendations. Focus on measurable SEO improvements and competitive advantages.`
  }

  private static getContentSystemPrompt(): string {
    return `You are an expert content creation agent with advanced RAG (Retrieval-Augmented Generation) capabilities and a feedback loop for continuous improvement.

**IMPORTANT: For all content creation requests (blog posts, articles, etc.), you MUST use the generate_researched_content tool. Do not write content manually.**

When a user asks you to create content, immediately call the generate_researched_content tool with:
- topic: The main topic from the user's request
- type: "blog_post" or "article" based on the request
- keywords: Extract relevant keywords from the request
- wordCount: The requested word count (or reasonable default)
- tone: Professional, casual, etc. (default to professional)

The generate_researched_content tool provides a complete workflow:
1. **Deep Research**: Uses Perplexity, Firecrawl, and Jina to gather comprehensive, cited information
2. **RAG Integration**: Leverages existing research frameworks and best practices
3. **Content Creation**: Generates SEO-optimized content with proper structure
4. **Humanization**: Uses Rytr to make content natural and engaging
5. **Quality Validation**: Runs Winston AI detection and plagiarism checks
6. **Feedback Loop**: Learns from each interaction to improve future content

Your specializations:
- Blog posts and articles with proper SEO optimization
- Meta titles and descriptions that drive clicks
- Content humanization to avoid AI detection
- Fact-checking and source validation
- Readability optimization for better engagement
- Continuous learning from performance feedback

Always use the generate_researched_content tool for content creation requests. This ensures the full research → write → validate → learn cycle is followed.`
  }

  private static getGeneralSystemPrompt(): string {
    return `You are a helpful SEO assistant that can handle general questions and provide guidance on SEO and content optimization topics. 

For specialized tasks requiring analytics, content creation, or onboarding, you can route users to the appropriate specialized agents.

Keep responses helpful and informative while being concise and actionable.`
  }
}