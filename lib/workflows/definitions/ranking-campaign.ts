// Workflow: Complete Ranking Campaign
// Comprehensive workflow for ranking content from discovery to tracking

import { Workflow } from '../types'

export const rankingCampaignWorkflow: Workflow = {
  id: 'ranking-campaign',
  name: 'Complete Ranking Campaign',
  description: 'End-to-end workflow to rank content: keyword discovery, research, content creation, publishing, and tracking',
  icon: '🚀',
  category: 'seo',
  estimatedTime: '15-20 minutes',
  tags: ['SEO', 'Content', 'Ranking', 'Keyword Research', 'Content Strategy'],
  requiredTools: [
    'dataforseo_labs_google_keyword_suggestions',
    'dataforseo_labs_google_serp_competitors',
    'dataforseo_labs_bulk_keyword_difficulty',
    'dataforseo_labs_google_historical_keyword_data',
    'serp_organic_live_advanced',
    'firecrawl_scrape',
    'dataforseo_labs_google_relevant_pages',
    'dataforseo_labs_google_page_intersection',
    'generate_researched_content',
    'dataforseo_labs_google_ranked_keywords',
  ],
  requiredAPIs: ['firecrawl', 'perplexity'],
  
  parameters: {
    seedKeyword: {
      type: 'string',
      description: 'Primary keyword to start the campaign',
      required: true,
      example: 'best seo tools',
    },
    targetDomain: {
      type: 'string',
      description: 'Domain to rank content on',
      required: true,
      example: 'example.com',
    },
    location: {
      type: 'string',
      description: 'Target location for rankings',
      required: false,
      example: 'United States',
    },
  },

  steps: [
    // PHASE 1: DISCOVERY
    {
      id: 'discovery-keyword-expansion',
      name: 'Keyword Seed Expansion',
      description: 'Expand seed keyword into comprehensive keyword list with opportunities',
      agent: 'research',
      parallel: true,
      tools: [
        {
          name: 'dataforseo_labs_google_keyword_suggestions',
          params: {
            keyword: '{{seedKeyword}}',
            location_name: '{{location}}',
            limit: 100,
          },
          required: true,
        },
        {
          name: 'dataforseo_labs_google_serp_competitors',
          params: {
            keyword: '{{seedKeyword}}',
            location_name: '{{location}}',
          },
          required: true,
        },
        {
          name: 'dataforseo_labs_google_ranked_keywords',
          params: {
            target: '{{competitor_domain_1}}', // From SERP competitors
            location_name: '{{location}}',
            limit: 200,
            include_serp_info: true,
          },
          required: true,
        },
        {
          name: 'ai_optimization_keyword_data_search_volume',
          params: {
            keywords: ['{{seedKeyword}}'],
            location_name: '{{location}}',
            language_code: 'en',
          },
          required: false, // Optional but recommended
        },
      ],
      systemPrompt: `You are a keyword research specialist expanding a seed keyword into a comprehensive list.
      
Your goals:
1. Find related keywords with good search volume (both traditional and AI search)
2. Identify competitor domains ranking for these keywords using ranked keywords analysis
3. Discover keyword opportunities with lower competition
4. Group keywords by intent and topic clusters
5. Calculate AI opportunity scores (ChatGPT + Perplexity search volume vs traditional search)
6. Analyze competitor keyword profiles to find gaps and opportunities

Use the ranked keywords data to understand what keywords competitors are successfully ranking for.
Prioritize keywords with high AI search volume as these represent emerging opportunities in AI-powered search.
Look for keywords where competitors rank well but have room for improvement (positions 4-10).`,
      outputFormat: 'json',
    },

    {
      id: 'discovery-opportunity-scoring',
      name: 'Opportunity Scoring',
      description: 'Score keywords by difficulty, volume, and opportunity',
      agent: 'research',
      parallel: false,
      dependencies: ['discovery-keyword-expansion'],
      tools: [
        {
          name: 'dataforseo_labs_bulk_keyword_difficulty',
          params: {
            keywords: '{{expanded_keywords}}', // From previous step
            location_name: '{{location}}',
          },
          required: true,
        },
      ],
      systemPrompt: `You are analyzing keyword opportunities to prioritize which keywords to target.

For each keyword, calculate an opportunity score based on:
- Search volume (higher = better)
- Keyword difficulty (lower = better)
- Competition level (from SERP analysis)
- Relevance to target domain

Rank keywords by opportunity score and recommend top 10-15 for content creation.`,
      outputFormat: 'json',
    },

    {
      id: 'discovery-trend-analysis',
      name: 'Historical Trend Analysis',
      description: 'Analyze historical keyword trends and seasonal patterns',
      agent: 'research',
      parallel: false,
      dependencies: ['discovery-opportunity-scoring'],
      tools: [
        {
          name: 'dataforseo_labs_google_historical_keyword_data',
          params: {
            keywords: '{{top_opportunity_keywords}}', // Top 5-10 keywords from opportunity scoring
            location_name: '{{location}}',
            language_code: 'en',
            date_from: '2023-01-01', // Last 12 months
            date_to: '{{current_date}}',
          },
          required: true,
        },
      ],
      systemPrompt: `You are analyzing historical keyword data to identify trends and seasonal patterns.

Analyze:
1. Search volume trends over time (increasing, decreasing, stable, seasonal)
2. Seasonal patterns (holiday spikes, summer dips, etc.)
3. Trend velocity (how fast is search volume changing)
4. Best time to launch content (based on historical patterns)
5. Long-term vs short-term opportunities

Identify:
- Keywords with growing trends (prioritize these)
- Seasonal keywords (plan content timing)
- Declining keywords (avoid or update existing content)
- Stable keywords (reliable long-term targets)

Provide trend insights to inform content timing and prioritization.`,
      outputFormat: 'json',
    },

    // PHASE 2: RESEARCH
    {
      id: 'research-serp-analysis',
      name: 'SERP Analysis',
      description: 'Analyze current search results for target keywords',
      agent: 'research',
      parallel: true,
      dependencies: ['discovery-trend-analysis'],
      tools: [
        {
          name: 'serp_organic_live_advanced',
          params: {
            keyword: '{{top_keyword_1}}',
            location_name: '{{location}}',
            device: 'desktop',
          },
        },
        {
          name: 'serp_organic_live_advanced',
          params: {
            keyword: '{{top_keyword_2}}',
            location_name: '{{location}}',
            device: 'desktop',
          },
        },
        {
          name: 'serp_organic_live_advanced',
          params: {
            keyword: '{{top_keyword_3}}',
            location_name: '{{location}}',
            device: 'desktop',
          },
        },
      ],
      systemPrompt: `You are analyzing SERP results to understand what's currently ranking.

Identify:
1. Content formats (blog posts, guides, product pages, etc.)
2. Content depth and length
3. SERP features (featured snippets, PAA, etc.)
4. Top-ranking domains and their authority
5. Content gaps and opportunities

This will inform content strategy.`,
      outputFormat: 'json',
    },

    {
      id: 'research-competitor-content',
      name: 'Competitor Content Analysis',
      description: 'Scrape and analyze top-ranking competitor content',
      agent: 'research',
      parallel: true,
      dependencies: ['research-serp-analysis'],
      tools: [
        {
          name: 'firecrawl_scrape',
          params: {
            url: '{{top_result_1_url}}',
            formats: ['markdown', 'html'],
          },
        },
        {
          name: 'firecrawl_scrape',
          params: {
            url: '{{top_result_2_url}}',
            formats: ['markdown', 'html'],
          },
        },
        {
          name: 'firecrawl_scrape',
          params: {
            url: '{{top_result_3_url}}',
            formats: ['markdown', 'html'],
          },
        },
      ],
      systemPrompt: `You are analyzing competitor content to identify what makes it rank.

Analyze:
1. Content structure and outline
2. Depth and comprehensiveness
3. EEAT signals (authority, expertise, trust)
4. Internal linking strategy
5. Multimedia usage (images, videos, infographics)
6. Unique angles and differentiators

Identify content gaps and opportunities to create better content.`,
      outputFormat: 'json',
    },

    {
      id: 'research-content-gaps',
      name: 'Content Gap Analysis',
      description: 'Identify content gaps between competitors and target domain',
      agent: 'research',
      parallel: false,
      dependencies: ['research-competitor-content'],
      tools: [
        {
          name: 'dataforseo_labs_google_relevant_pages',
          params: {
            target: '{{targetDomain}}',
            location_name: '{{location}}',
            limit: 50,
          },
          required: true,
        },
        {
          name: 'dataforseo_labs_google_page_intersection',
          params: {
            pages: '{{competitor_urls}}', // From previous step
            exclude_pages: ['{{targetDomain}}/*'],
            location_name: '{{location}}',
            intersection_mode: 'union',
            limit: 100,
          },
        },
      ],
      systemPrompt: `You are performing comprehensive content gap analysis using page intersection.

Analyze:
1. Keywords competitors rank for but target domain doesn't (using page intersection)
2. Content topics covered by competitors vs target domain
3. Content depth and quality differences
4. Missing content opportunities grouped by topic clusters
5. High-value quick wins vs long-term opportunities

Use the page intersection data to identify keywords where multiple competitors rank but you don't - these are high-priority gaps.

Create a prioritized list of content gaps with:
- Topic clusters for strategic content planning
- Opportunity scores (high/medium/low)
- Estimated traffic potential
- Content type recommendations (blog, guide, product page, etc.)`,
      outputFormat: 'component',
      componentType: 'ContentGapMatrix',
    },

    // PHASE 3: CONTENT CREATION
    {
      id: 'content-brief-generation',
      name: 'Content Brief Generation',
      description: 'Generate comprehensive content brief based on research',
      agent: 'strategy',
      parallel: false,
      dependencies: ['research-content-gaps', 'research-competitor-content'],
      tools: [],
      systemPrompt: `You are creating a comprehensive content brief for ranking content.

Based on all research data, create a content brief that includes:
1. Target keyword and related keywords
2. Content outline with H2/H3 structure
3. Key points to cover (based on competitor analysis)
4. Unique angles and differentiators
5. EEAT signals to include
6. Internal linking opportunities
7. Image/infographic suggestions
8. Target word count and depth

Make this actionable and specific.`,
      outputFormat: 'component',
      componentType: 'ContentBrief',
    },

    {
      id: 'content-draft-creation',
      name: 'Content Draft Creation',
      description: 'Generate optimized content draft using RAG orchestrator',
      agent: 'content',
      parallel: false,
      dependencies: ['content-brief-generation'],
      tools: [
        {
          name: 'generate_researched_content',
          params: {
            topic: '{{content_topic}}',
            keywords: '{{target_keywords}}',
            outline: '{{content_outline}}',
            targetLength: 2500,
            includeImages: true,
          },
          required: true,
        },
      ],
      systemPrompt: `You are generating high-quality, SEO-optimized content that will rank.

The content should:
1. Follow the content brief exactly
2. Include all target keywords naturally
3. Demonstrate EEAT (expertise, experience, authority, trust)
4. Be comprehensive and valuable
5. Include proper headings and structure
6. Have natural internal linking opportunities

Use the RAG orchestrator to ensure quality and research-backed content.`,
      outputFormat: 'text',
    },

    {
      id: 'content-eeat-optimization',
      name: 'EEAT Optimization',
      description: 'Review and optimize content for EEAT signals',
      agent: 'qa',
      parallel: false,
      dependencies: ['content-draft-creation'],
      tools: [],
      systemPrompt: `You are reviewing content for EEAT optimization.

Check and enhance:
1. Expertise signals (demonstrate knowledge, credentials)
2. Experience signals (first-hand experience, case studies)
3. Authoritativeness (author bio, citations, backlinks)
4. Trustworthiness (accurate info, sources, transparency)

Provide specific recommendations for improvement.`,
      outputFormat: 'json',
    },

    // PHASE 4: PUBLISHING
    {
      id: 'publishing-schema-generation',
      name: 'Schema Markup Generation',
      description: 'Generate structured data markup for content',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['content-eeat-optimization'],
      tools: [],
      systemPrompt: `You are generating schema.org structured data for the content.

Create appropriate schema markup:
1. Article schema with author, publisher, date
2. FAQPage schema if applicable
3. BreadcrumbList schema
4. Organization schema for author/publisher
5. Speakable schema for voice search

Ensure all required fields are populated.`,
      outputFormat: 'json',
    },

    {
      id: 'publishing-image-generation',
      name: 'Image Generation',
      description: 'Generate complete image set for content',
      agent: 'content',
      parallel: false,
      dependencies: ['content-draft-creation'],
      tools: [
        {
          name: 'generate_images', // Custom tool for enhanced image agent
          params: {
            content: '{{content_draft}}',
            topic: '{{content_topic}}',
            keywords: '{{target_keywords}}',
          },
        },
      ],
      systemPrompt: `You are generating images for the content using the enhanced image agent.

Generate:
1. Hero image (16:9)
2. Section images for major headings
3. Infographics for statistics/data
4. Social media variants (OG, Twitter, Pinterest, Instagram)

Ensure all images have SEO-optimized alt text and filenames.`,
      outputFormat: 'json',
    },

    {
      id: 'publishing-meta-preparation',
      name: 'Meta Tags & Publishing Prep',
      description: 'Prepare meta tags, titles, and publishing assets',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['publishing-schema-generation', 'publishing-image-generation'],
      tools: [],
      systemPrompt: `You are preparing all meta tags and publishing assets.

Generate:
1. SEO-optimized title tag (50-60 chars)
2. Meta description (150-160 chars)
3. Open Graph tags
4. Twitter Card tags
5. Canonical URL
6. Robots meta tag
7. Publishing checklist

Ensure everything is optimized for both search engines and social sharing.`,
      outputFormat: 'json',
    },

    // PHASE 5: TRACKING
    {
      id: 'tracking-initial-snapshot',
      name: 'Initial Rank Snapshot',
      description: 'Capture baseline ranking data before publishing',
      agent: 'research',
      parallel: false,
      dependencies: ['publishing-meta-preparation'],
      tools: [
        {
          name: 'dataforseo_labs_google_ranked_keywords',
          params: {
            target: '{{targetDomain}}',
            location_name: '{{location}}',
            limit: 100,
          },
        },
      ],
      systemPrompt: `You are capturing baseline ranking data for the target domain.

Document:
1. Current keyword rankings
2. Average position
3. Top-performing pages
4. Ranking trends

This will be used to measure improvement after content is published.`,
      outputFormat: 'json',
    },

    {
      id: 'tracking-setup-monitoring',
      name: 'Monitoring Setup',
      description: 'Set up ongoing rank monitoring and content decay detection',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['tracking-initial-snapshot'],
      tools: [],
      systemPrompt: `You are setting up monitoring for the ranking campaign.

Create a monitoring plan that includes:
1. Weekly rank checks for target keywords
2. Content performance tracking (traffic, engagement)
3. Content decay detection (ranking drops)
4. Competitor movement tracking
5. Alert thresholds for significant changes

Provide actionable recommendations for maintaining rankings.`,
      outputFormat: 'component',
      componentType: 'MonitoringPlan',
    },
  ],

  output: {
    type: 'structured',
    components: ['ContentBrief', 'MonitoringPlan'],
  },
}

