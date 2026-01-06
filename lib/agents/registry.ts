// Agent Registry for Multi-Agent SEO Platform
// Defines agent configurations, capabilities, and tool access

export interface AgentToolConfig {
  name: string
  description: string
  category: 'seo' | 'research' | 'content' | 'analysis' | 'marketing'
  priority: 'high' | 'medium' | 'low'
  requiresAuth?: boolean
  mcpToolNames?: string[]
}

export interface AgentRAGConfig {
  frameworks: boolean
  agentDocuments: boolean
  conversationHistory: boolean
  maxContextLength: number
}

export interface AgentPersonality {
  tone: string
  style: string
  traits: string[]
  responseLength: 'concise' | 'moderate' | 'detailed'
  communicationStyle: 'formal' | 'casual' | 'professional'
}

export interface AgentCapabilities {
  canGenerateImages: boolean
  canAccessExternalAPIs: boolean
  canPerformSEOAnalysis: boolean
  canConductResearch: boolean
  canWriteContent: boolean
  canManageCampaigns: boolean
}

export interface AgentConfig {
  id: string
  name: string
  description: string
  personality: AgentPersonality
  capabilities: AgentCapabilities
  tools: AgentToolConfig[]
  ragConfig: AgentRAGConfig
  systemPrompt: string
  fallbackAgent?: string
  createdAt: Date
  updatedAt: Date
}

export interface AgentRegistry {
  agents: Map<string, AgentConfig>
  getAgent(id: string): AgentConfig | null
  getAgentsByCategory(category: string): AgentConfig[]
  validateToolAccess(agentId: string, toolName: string): boolean
  getAgentTools(agentId: string): AgentToolConfig[]
}

// Define available tools across all agents
export const AVAILABLE_TOOLS: Record<string, AgentToolConfig> = {
  // DataForSEO Tools
  keyword_search_volume: {
    name: 'keyword_search_volume',
    description: 'Get Google search volume, CPC, and competition for keywords',
    category: 'seo',
    priority: 'high',
    mcpToolNames: ['keywords_data_google_ads_search_volume'],
  },
  google_rankings: {
    name: 'google_rankings',
    description: 'Get current Google SERP results for a keyword',
    category: 'seo',
    priority: 'high',
    mcpToolNames: ['serp_organic_live_advanced'],
  },
  domain_overview: {
    name: 'domain_overview',
    description: 'Get comprehensive SEO metrics for a domain',
    category: 'seo',
    priority: 'high',
    mcpToolNames: ['dataforseo_labs_google_domain_rank_overview'],
  },
  ai_keyword_search_volume: {
    name: 'ai_keyword_search_volume',
    description: 'Get search volume for AI platform keywords',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['ai_optimization_keyword_data_search_volume'],
  },
  keyword_suggestions: {
    name: 'keyword_suggestions',
    description: 'Discover long-tail keywords and variations based on a seed term',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_keyword_suggestions'],
  },
  keyword_ideas: {
    name: 'keyword_ideas',
    description: 'Generate keyword ideas by category and related topics',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_keyword_ideas'],
  },
  related_keywords: {
    name: 'related_keywords',
    description: 'Find keywords appearing in “searches related to” SERP element',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_related_keywords'],
  },
  ranking_domains: {
    name: 'ranking_domains',
    description: 'Identify domains ranking for a keyword with visibility metrics',
    category: 'seo',
    priority: 'high',
    mcpToolNames: ['dataforseo_labs_google_serp_competitors'],
  },
  domain_keywords: {
    name: 'domain_keywords',
    description: 'List keywords a domain ranks for with positions and volumes',
    category: 'seo',
    priority: 'high',
    mcpToolNames: ['dataforseo_labs_google_ranked_keywords'],
  },
  top_pages: {
    name: 'top_pages',
    description: 'Identify top-performing pages for a domain by organic traffic',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_relevant_pages'],
  },
  domain_intersection: {
    name: 'domain_intersection',
    description: 'Find overlapping keywords across multiple domains',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_domain_intersection'],
  },
  page_intersection: {
    name: 'page_intersection',
    description: 'Compare pages to find keyword gaps and overlaps',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_page_intersection'],
  },
  domain_subdomains: {
    name: 'domain_subdomains',
    description: 'Analyze subdomains and their ranking distribution',
    category: 'seo',
    priority: 'low',
    mcpToolNames: ['dataforseo_labs_google_subdomains'],
  },
  top_searches: {
    name: 'top_searches',
    description: 'Explore top search queries from the DataForSEO keyword database',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_top_searches'],
  },
  keywords_for_site: {
    name: 'keywords_for_site',
    description: 'Discover keywords relevant to a specific domain',
    category: 'seo',
    priority: 'medium',
    mcpToolNames: ['dataforseo_labs_google_keywords_for_site'],
  },

  // Research Tools
  perplexity_research: {
    name: 'perplexity_research',
    description: 'Research topics using Perplexity AI with citations',
    category: 'research',
    priority: 'high',
    requiresAuth: true,
  },
  perplexity_stats: {
    name: 'perplexity_stats',
    description: 'Get latest statistics and data points',
    category: 'research',
    priority: 'medium',
    requiresAuth: true,
  },
  perplexity_trends: {
    name: 'perplexity_trends',
    description: 'Analyze trends and patterns over time',
    category: 'research',
    priority: 'medium',
    requiresAuth: true,
  },
  jina_crawl_page: {
    name: 'jina_crawl_page',
    description: 'Crawl and extract clean content from web pages',
    category: 'research',
    priority: 'high',
  },

  // Content Tools
  generate_image: {
    name: 'generate_image',
    description: 'Generate images using AI models',
    category: 'content',
    priority: 'medium',
  },

  // Analysis Tools
  competitor_analysis: {
    name: 'competitor_analysis',
    description: 'Analyze competitor websites and strategies',
    category: 'analysis',
    priority: 'high',
    mcpToolNames: ['dataforseo_labs_google_competitors_domain'],
  },
  site_audit: {
    name: 'site_audit',
    description: 'Perform technical SEO site audits',
    category: 'analysis',
    priority: 'high',
    mcpToolNames: ['on_page_instant_pages', 'on_page_content_parsing'],
  },
  backlinks_overview: {
    name: 'backlinks_overview',
    description: 'Retrieve backlink lists and metrics for a target domain',
    category: 'analysis',
    priority: 'medium',
    mcpToolNames: ['backlinks_backlinks'],
  },
  backlinks_anchors: {
    name: 'backlinks_anchors',
    description: 'Analyze anchor texts used in backlinks',
    category: 'analysis',
    priority: 'low',
    mcpToolNames: ['backlinks_anchors'],
  },
  backlinks_competitors: {
    name: 'backlinks_competitors',
    description: 'Find domains sharing backlinks with competitors',
    category: 'analysis',
    priority: 'medium',
    mcpToolNames: ['backlinks_competitors'],
  },
  backlinks_domain_intersection: {
    name: 'backlinks_domain_intersection',
    description: 'Identify referring domains linking to competitor sites',
    category: 'analysis',
    priority: 'medium',
    mcpToolNames: ['backlinks_domain_intersection'],
  },
  backlinks_domain_pages: {
    name: 'backlinks_domain_pages',
    description: 'Summarize backlink metrics for pages of a domain',
    category: 'analysis',
    priority: 'low',
    mcpToolNames: ['backlinks_domain_pages'],
  },
  backlinks_domain_pages_summary: {
    name: 'backlinks_domain_pages_summary',
    description: 'Get aggregated backlink summary per page',
    category: 'analysis',
    priority: 'low',
    mcpToolNames: ['backlinks_domain_pages_summary'],
  },
  backlinks_page_intersection: {
    name: 'backlinks_page_intersection',
    description: 'Compare backlink profiles for multiple pages',
    category: 'analysis',
    priority: 'low',
    mcpToolNames: ['backlinks_page_intersection'],
  },
  backlinks_referring_domains: {
    name: 'backlinks_referring_domains',
    description: 'Review referring domains and backlink quality metrics',
    category: 'analysis',
    priority: 'medium',
    mcpToolNames: ['backlinks_referring_domains'],
  },
  backlinks_referring_networks: {
    name: 'backlinks_referring_networks',
    description: 'Understand backlink networks and relationships',
    category: 'analysis',
    priority: 'low',
    mcpToolNames: ['backlinks_referring_networks'],
  },

  // Marketing Tools
  campaign_optimizer: {
    name: 'campaign_optimizer',
    description: 'Optimize marketing campaigns and ad spend',
    category: 'marketing',
    priority: 'medium',
  },
  social_media_insights: {
    name: 'social_media_insights',
    description: 'Analyze social media performance and trends',
    category: 'marketing',
    priority: 'medium',
  },
  business_listings_search: {
    name: 'business_listings_search',
    description: 'Search Google Business listings for local citations',
    category: 'marketing',
    priority: 'medium',
    mcpToolNames: ['business_data_business_listings_search'],
  },
  whois_overview: {
    name: 'whois_overview',
    description: 'Retrieve Whois data with SEO metrics for domains',
    category: 'analysis',
    priority: 'low',
    mcpToolNames: ['domain_analytics_whois_overview'],
  },
  content_analysis_search: {
    name: 'content_analysis_search',
    description: 'Fetch citation data for a keyword across the web',
    category: 'analysis',
    priority: 'medium',
    mcpToolNames: ['content_analysis_search'],
  },
  content_analysis_summary: {
    name: 'content_analysis_summary',
    description: 'Summarize citation data and sentiment for a keyword',
    category: 'analysis',
    priority: 'medium',
    mcpToolNames: ['content_analysis_summary'],
  },
  content_analysis_phrase_trends: {
    name: 'content_analysis_phrase_trends',
    description: 'Monitor phrase trends and sentiment over time',
    category: 'analysis',
    priority: 'low',
    mcpToolNames: ['content_analysis_phrase_trends'],
  },
}

// SEO/AEO Manager Agent Configuration
const seoManagerConfig: AgentConfig = {
  id: 'seo_manager',
  name: 'SEO/AEO Manager',
  description: 'Specialized in SEO, AEO (Answer Engine Optimization), keyword strategy, and AI platform visibility',
  personality: {
    tone: 'professional',
    style: 'analytical',
    traits: ['detail-oriented', 'data-driven', 'strategic'],
    responseLength: 'moderate',
    communicationStyle: 'professional',
  },
  capabilities: {
    canGenerateImages: false,
    canAccessExternalAPIs: true,
    canPerformSEOAnalysis: true,
    canConductResearch: true,
    canWriteContent: false,
    canManageCampaigns: false,
  },
  tools: [
    AVAILABLE_TOOLS.keyword_search_volume,
    AVAILABLE_TOOLS.google_rankings,
    AVAILABLE_TOOLS.domain_overview,
    AVAILABLE_TOOLS.ai_keyword_search_volume,
    AVAILABLE_TOOLS.keyword_suggestions,
    AVAILABLE_TOOLS.keyword_ideas,
    AVAILABLE_TOOLS.related_keywords,
    AVAILABLE_TOOLS.domain_keywords,
    AVAILABLE_TOOLS.top_pages,
    AVAILABLE_TOOLS.ranking_domains,
    AVAILABLE_TOOLS.domain_intersection,
    AVAILABLE_TOOLS.page_intersection,
    AVAILABLE_TOOLS.domain_subdomains,
    AVAILABLE_TOOLS.top_searches,
    AVAILABLE_TOOLS.keywords_for_site,
    AVAILABLE_TOOLS.perplexity_research,
    AVAILABLE_TOOLS.jina_crawl_page,
    AVAILABLE_TOOLS.competitor_analysis,
    AVAILABLE_TOOLS.site_audit,
    AVAILABLE_TOOLS.backlinks_overview,
    AVAILABLE_TOOLS.backlinks_competitors,
    AVAILABLE_TOOLS.backlinks_domain_intersection,
    AVAILABLE_TOOLS.backlinks_referring_domains,
    AVAILABLE_TOOLS.backlinks_anchors,
    AVAILABLE_TOOLS.backlinks_domain_pages,
    AVAILABLE_TOOLS.backlinks_domain_pages_summary,
    AVAILABLE_TOOLS.backlinks_page_intersection,
    AVAILABLE_TOOLS.backlinks_referring_networks,
    AVAILABLE_TOOLS.business_listings_search,
    AVAILABLE_TOOLS.whois_overview,
    AVAILABLE_TOOLS.content_analysis_search,
    AVAILABLE_TOOLS.content_analysis_summary,
    AVAILABLE_TOOLS.content_analysis_phrase_trends,
  ],
  ragConfig: {
    frameworks: true,
    agentDocuments: true,
    conversationHistory: true,
    maxContextLength: 4000,
  },
  systemPrompt: `You are an SEO/AEO Manager with deep expertise in both traditional search engine optimization AND Answer Engine Optimization for AI platforms. Your focus is on:

**Traditional SEO:**
1. Technical SEO optimization and site audits
2. Keyword research and strategy development
3. SERP analysis and competitor research
4. Link building strategies and opportunities
5. Schema markup and structured data
6. Core Web Vitals and page speed optimization
7. International SEO and localization strategies

**AEO (Answer Engine Optimization) - NEW:**
8. Optimizing content for AI platforms (ChatGPT, Perplexity, Claude, Gemini)
9. Citation analysis and citation-worthiness optimization
10. EEAT signal detection and enhancement (Experience, Expertise, Authoritativeness, Trustworthiness)
11. AI platform visibility tracking and monitoring
12. Platform-specific content optimization strategies
13. Multi-platform performance comparison and optimization

**Your Unique Capabilities:**
You have access to 70+ tools across 9 integrations:
- DataForSEO MCP (40+ SEO tools for traditional search)
- Firecrawl MCP (advanced web scraping with JavaScript rendering)
- Winston MCP (plagiarism and AI content detection)
- Rytr (SEO-optimized content generation)
- Perplexity (citation-based research with authoritative sources)
- Jina (clean content extraction)
- AEO Tools (citation analysis, EEAT detection, platform optimization)
- Content Quality Tools (readability, SEO analysis, fact-checking)
- Codemode (multi-tool orchestration for complex workflows)

**AEO Best Practices:**
- ChatGPT prioritizes clear, structured content with definitive answers and examples
- Perplexity heavily weights recent, authoritative sources with citations
- Claude values nuanced, comprehensive explanations with multiple perspectives
- Gemini excels with visual descriptions and practical, actionable content
- All platforms prioritize high-EEAT content for citations

**Intelligent Tool Selection Guide:**

When user asks about... → Use these tools:

1. **"Audit my content for AI platforms"** → Workflow: aeo-comprehensive-audit
   - Or manually: jina_scrape → aeo_find_citation_opportunities + aeo_detect_eeat_signals + aeo_compare_platforms

2. **"Why am I not getting cited?"** → Workflow: aeo-citation-optimization
   - Or manually: aeo_analyze_citations → aeo_find_citation_opportunities → aeo_optimize_for_citations

3. **"Optimize for ChatGPT/Perplexity/Claude/Gemini"** → Workflow: aeo-multi-platform-optimization
   - Or manually: aeo_compare_platforms → aeo_optimize_for_platform (for each platform)

4. **"How to rank on ChatGPT"** → Workflow: rank-on-chatgpt
   - Comprehensive strategy with research, analysis, and recommendations

5. **"Check my EEAT signals"** → Direct tools:
   - aeo_detect_eeat_signals (scoring) → aeo_enhance_eeat_signals (recommendations)

6. **"What content gets cited for [topic]?"** → Direct tool:
   - aeo_analyze_citations (citation pattern analysis)

7. **"Track my AI platform visibility"** → Direct tools:
   - aeo_track_visibility → aeo_analyze_trends (for trend analysis)

8. **Traditional SEO tasks** → Use DataForSEO tools:
   - Keyword research: keyword_search_volume, keyword_suggestions, related_keywords
   - Rankings: google_rankings, domain_keywords, top_pages
   - Competitors: competitor_analysis, domain_intersection, ranking_domains
   - Backlinks: backlinks_overview, backlinks_competitors, backlinks_referring_domains
   - Content: content_analysis_search, content_analysis_summary

9. **Content quality validation** → Use quality tools:
   - validateContentTool (plagiarism + AI detection + SEO)
   - analyzeSEOContentTool (comprehensive SEO analysis)
   - factCheckContentTool (fact-checking with Perplexity)

10. **Content generation** → Use Rytr tools:
    - generateSEOContentTool, generateBlogSectionTool
    - generateMetaTitleTool, generateMetaDescriptionTool
    - improveContentTool, expandContentTool

**Workflow vs. Direct Tools:**
- Use **workflows** for comprehensive, multi-step tasks (audits, strategies, optimization plans)
- Use **direct tools** for specific, single-purpose tasks (check EEAT, analyze citations, track visibility)
- Workflows automatically orchestrate multiple tools in the optimal sequence
- Direct tools give you more control but require manual orchestration

**Tool Selection Best Practices:**
1. **Start broad, then narrow**: Use comparison/analysis tools first, then specific optimization tools
2. **Parallel when possible**: Use multiple tools simultaneously for faster results (workflows do this automatically)
3. **Chain intelligently**: Output from one tool should inform the next (e.g., citation analysis → optimization)
4. **Validate before recommending**: Use quality tools to check content before suggesting publication
5. **Combine AEO + SEO**: Don't forget traditional SEO while optimizing for AI platforms

Provide actionable, data-driven recommendations with specific metrics and implementation steps. Always prioritize user intent and search experience over just ranking factors. When providing recommendations, include both the 'why' and the 'how' for implementation.

**IMPORTANT: Business Context Integration**
You receive the user's business profile (industry, website, goals, brand voice, target locations) in your system prompt. Always reference and tailor your SEO strategies to their specific business context. If critical information is missing for your analysis, ask for it concisely.

**CRITICAL: Response Formatting**
When presenting SEO data and metrics:
- NEVER use markdown headers (# ## ###)
- NEVER use asterisks (*) for bold or emphasis
- NEVER use markdown tables or bullet points with special characters
- Write in clean, plain text with simple sentences
- The data visualization components will handle all formatting
- Focus on insights and actionable recommendations in conversational language
- Example: "This keyword has strong commercial intent with 12,000 monthly searches. The CPC of $2.50 indicates advertisers find it valuable, suggesting good conversion potential for your business."`,

  fallbackAgent: 'general',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Marketing Manager Agent Configuration
const marketingManagerConfig: AgentConfig = {
  id: 'marketing_manager',
  name: 'Marketing Manager',
  description: 'Focused on digital marketing strategy, campaign optimization, and growth initiatives',
  personality: {
    tone: 'energetic',
    style: 'strategic',
    traits: ['creative', 'results-oriented', 'innovative'],
    responseLength: 'detailed',
    communicationStyle: 'professional',
  },
  capabilities: {
    canGenerateImages: false,
    canAccessExternalAPIs: true,
    canPerformSEOAnalysis: false,
    canConductResearch: true,
    canWriteContent: true,
    canManageCampaigns: true,
  },
  tools: [
    AVAILABLE_TOOLS.perplexity_research,
    AVAILABLE_TOOLS.perplexity_stats,
    AVAILABLE_TOOLS.perplexity_trends,
    AVAILABLE_TOOLS.jina_crawl_page,
    AVAILABLE_TOOLS.campaign_optimizer,
    AVAILABLE_TOOLS.social_media_insights,
    AVAILABLE_TOOLS.keyword_search_volume,
    AVAILABLE_TOOLS.domain_overview,
    AVAILABLE_TOOLS.keyword_suggestions,
    AVAILABLE_TOOLS.domain_keywords,
    AVAILABLE_TOOLS.top_pages,
    AVAILABLE_TOOLS.top_searches,
    AVAILABLE_TOOLS.business_listings_search,
    AVAILABLE_TOOLS.content_analysis_summary,
  ],
  ragConfig: {
    frameworks: true,
    agentDocuments: true,
    conversationHistory: true,
    maxContextLength: 5000,
  },
  systemPrompt: `You are a Marketing Manager specializing in digital marketing strategy and campaign optimization. Your expertise includes:

1. Multi-channel marketing strategy and planning
2. Campaign performance analysis and optimization
3. Social media marketing and content strategy
4. Email marketing and automation workflows
5. Conversion rate optimization (CRO)
6. Marketing attribution and analytics
7. Brand voice and messaging development
8. Budget allocation and ROI optimization

You combine creativity with data analysis to develop comprehensive marketing strategies. Use research tools to gather market insights and trending topics. When generating content ideas or campaigns, consider both creative innovation and measurable business outcomes.

Always tie recommendations back to specific KPIs and provide clear success metrics.

**IMPORTANT: Business Context Integration**
You receive the user's business profile (industry, website, goals, brand voice, target market) in your system prompt. Tailor all marketing strategies and campaigns to their specific business context, target audience, and brand voice.`,

  fallbackAgent: 'general',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Article Writer Agent Configuration
const articleWriterConfig: AgentConfig = {
  id: 'article_writer',
  name: 'Article Writer',
  description: 'Expert content creator focused on SEO-optimized articles and engaging writing',
  personality: {
    tone: 'engaging',
    style: 'conversational',
    traits: ['storyteller', 'research-focused', 'audience-aware'],
    responseLength: 'detailed',
    communicationStyle: 'casual',
  },
  capabilities: {
    canGenerateImages: false,
    canAccessExternalAPIs: false,
    canPerformSEOAnalysis: false,
    canConductResearch: true,
    canWriteContent: true,
    canManageCampaigns: false,
  },
  tools: [
    AVAILABLE_TOOLS.perplexity_research,
    AVAILABLE_TOOLS.jina_crawl_page,
    AVAILABLE_TOOLS.keyword_search_volume,
  ],
  ragConfig: {
    frameworks: true,
    agentDocuments: true,
    conversationHistory: true,
    maxContextLength: 6000,
  },
  systemPrompt: `You are an Article Writer specializing in creating engaging, SEO-optimized content. Your strengths include:

1. SEO-optimized article writing and content strategy
2. Research-backed content with proper citations
3. Different content formats (how-to guides, listicles, case studies)
4. Engaging headlines and meta descriptions
5. Content structure and readability optimization
6. Featured snippet optimization
7. Internal linking strategies
8. Content gap analysis and topic clustering

You combine creativity with SEO best practices to create content that both engages readers and ranks well. Use research tools to gather current information and data to support your content. Focus on creating value for the reader while incorporating SEO elements naturally.

When writing, prioritize readability, engagement, and search intent satisfaction over keyword density.

**IMPORTANT: Business Context Integration**
You receive the user's business profile including their brand voice (tone, style, personality, sample phrases) and industry. Always write in their brand voice and tailor content to their specific industry, target audience, and business goals.`,

  fallbackAgent: 'general',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Default/General Agent Configuration
const generalAgentConfig: AgentConfig = {
  id: 'general',
  name: 'General Assistant',
  description: 'Versatile AI assistant for general SEO and marketing questions',
  personality: {
    tone: 'helpful',
    style: 'balanced',
    traits: ['versatile', 'adaptable', 'user-focused'],
    responseLength: 'moderate',
    communicationStyle: 'professional',
  },
  capabilities: {
    canGenerateImages: false,
    canAccessExternalAPIs: true,
    canPerformSEOAnalysis: true,
    canConductResearch: true,
    canWriteContent: true,
    canManageCampaigns: true,
  },
  tools: Object.values(AVAILABLE_TOOLS).filter(tool => tool.name !== 'generate_image'),
  ragConfig: {
    frameworks: true,
    agentDocuments: false,
    conversationHistory: true,
    maxContextLength: 3000,
  },
  systemPrompt: `You are the General Assistant and onboarding concierge. You handle both onboarding new users and providing general SEO/marketing assistance.

## ONBOARDING RESPONSIBILITIES

When a user's business profile is missing or incomplete, conduct a friendly onboarding conversation:

**Required Information to Collect:**
- website_url: Their business website
- industry: Their industry or business niche
- location: Primary customer location (country, region, city)
- brand_voice: Tone, style, personality, sample phrases
- goals: Business objectives (Generate Leads, Increase Traffic, Build Authority, Local SEO, etc.)
- content_frequency: How often they want to create content

**Onboarding Process:**
1. Ask ONE question at a time in a conversational, friendly manner
2. After each user answer, immediately call upsert_business_profile with the extracted information
3. Don't ask the user to confirm tool calls - just save the data automatically
4. Use interactive components when helpful by embedding JSON in code blocks:

   For website URL:
   \`\`\`json
   { "component": "url_input", "props": { "label": "What's your website?", "placeholder": "https://example.com" } }
   \`\`\`

   For multiple choice (goals, content types):
   \`\`\`json
   { "component": "card_selector", "props": { "title": "What are your main goals?", "options": ["Generate Leads", "Increase Traffic", "Build Authority", "Local SEO"], "multiple": true } }
   \`\`\`

   For location:
   \`\`\`json
   { "component": "location_picker", "props": { "label": "Where are your customers located?" } }
   \`\`\`

**Special Triggers:**
- If user message is "__START_ONBOARDING__", greet them warmly and ask the first missing question
- Continue onboarding until all required fields are collected
- Once complete, congratulate them and transition to being their general assistant

## GENERAL ASSISTANCE (After Onboarding)

After onboarding is complete, provide expert help with:
1. SEO questions and best practices
2. Keyword research and analysis
3. Content strategy and planning
4. Marketing campaign guidance
5. Competitive analysis
6. Website optimization tips
7. Digital marketing trends

**Business Context Usage:**
Always reference the user's business profile when providing advice. Tailor all recommendations to their:
- Industry and target market
- Brand voice and communication style
- Business goals and objectives
- Geographic focus

If specialized expertise is needed, recommend the appropriate specialist agent (SEO Manager, Marketing Manager, or Article Writer).

**CRITICAL: Response Formatting**
When presenting data from SEO tools:
- NEVER use markdown headers (# ## ###)
- NEVER use asterisks (*) for bold or emphasis
- NEVER use markdown tables or bullet points with special characters
- Use plain, conversational text for insights and analysis
- Let the data visualization components handle all formatting
- Example good response: "The keyword shows strong commercial intent with 12,000 monthly searches and a CPC of $2.50. This suggests high competition but good conversion potential."
- Example bad response: "## Keyword Analysis\n\n**Search Volume:** 12,000\n\n* High competition\n* Good CPC"

**Available Tools:**
- extract_brand_voice: After user provides website URL, call this to analyze their website and extract brand voice automatically
- save_business_profile: Save onboarding information (industry, location, goals, content frequency)
- get_profile_status: Check what information has been collected and what's still missing
- All SEO research and analysis tools
- Perplexity research for competitor intelligence
- Jina web crawling for competitor analysis

**IMPORTANT: Brand Voice Extraction**
When the user provides their website URL:
1. Immediately call extract_brand_voice with the URL
2. This will scrape their website and automatically detect their brand voice (tone, style, personality)
3. No need to ask the user about brand voice separately - it's extracted from their website
4. Continue to ask about industry, goals, and location`,

  createdAt: new Date(),
  updatedAt: new Date(),
}

// Agent Registry Implementation
export class AgentRegistry implements AgentRegistry {
  public agents: Map<string, AgentConfig>

  constructor() {
    this.agents = new Map()
    this.initializeAgents()
  }

  private initializeAgents() {
    // Register all agents
    this.agents.set(seoManagerConfig.id, seoManagerConfig)
    this.agents.set(marketingManagerConfig.id, marketingManagerConfig)
    this.agents.set(articleWriterConfig.id, articleWriterConfig)
    this.agents.set(generalAgentConfig.id, generalAgentConfig)

    console.log(`[Agent Registry] Initialized ${this.agents.size} agents`)
  }

  public getAgent(id: string): AgentConfig | null {
    return this.agents.get(id) || null
  }

  public getAgentsByCategory(category: string): AgentConfig[] {
    // Filter agents based on their primary capabilities
    switch (category) {
      case 'seo':
        return [seoManagerConfig, generalAgentConfig]
      case 'marketing':
        return [marketingManagerConfig, generalAgentConfig]
      case 'content':
        return [articleWriterConfig, marketingManagerConfig, generalAgentConfig]
      case 'research':
        return [seoManagerConfig, marketingManagerConfig, articleWriterConfig, generalAgentConfig]
      default:
        return Array.from(this.agents.values())
    }
  }

  public validateToolAccess(agentId: string, toolName: string): boolean {
    const agent = this.getAgent(agentId)
    if (!agent) return false

    return agent.tools.some(tool => tool.name === toolName)
  }

  public getAgentTools(agentId: string): AgentToolConfig[] {
    const agent = this.getAgent(agentId)
    if (!agent) return []

    return agent.tools
  }

  public getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values())
  }

  public getAgentByName(name: string): AgentConfig | null {
    return Array.from(this.agents.values()).find(
      agent => agent.name.toLowerCase() === name.toLowerCase()
    ) || null
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry()

// Export agent configurations for direct access
export {
  seoManagerConfig,
  marketingManagerConfig,
  articleWriterConfig,
  generalAgentConfig,
}
