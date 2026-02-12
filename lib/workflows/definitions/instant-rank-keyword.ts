/**
 * Instant Campaign: Rank for This Keyword
 * 
 * Streamlined 3-step workflow optimized for the "3-minute promise"
 * Input: keyword → Output: publish-ready content with hero image
 */

import { Workflow } from '../types'

export const instantRankKeywordWorkflow: Workflow = {
  id: 'instant-rank-keyword',
  name: 'Rank for This Keyword',
  description: 'Enter a keyword → Get publish-ready, SEO-optimized content with images in under 3 minutes',
  icon: '⚡',
  category: 'instant',
  estimatedTime: '2-3 minutes',
  tags: ['Instant', 'Keyword', 'Content', 'SEO', 'Fast'],
  requiredTools: [
    'dataforseo_labs_google_keyword_suggestions',
    'ai_optimization_keyword_data_search_volume',
    'serp_organic_live_advanced',
    'firecrawl_agent',
    'perplexity_search',
    'generate_researched_content',
  ],
  requiredAPIs: ['dataforseo', 'firecrawl', 'perplexity'],

  parameters: {
    keyword: {
      type: 'string',
      description: 'Target keyword to rank for',
      required: true,
      example: 'best CRM for startups',
    },
    includeImages: {
      type: 'boolean',
      description: 'Generate hero image (default: true)',
      required: false,
      default: true,
    },
    contentLength: {
      type: 'string',
      description: 'Target content length: short (1000 words), medium (2000 words), long (3000+ words)',
      required: false,
      default: 'medium',
    },
  },

  steps: [
    // STEP 1: PARALLEL RESEARCH (Target: 30 seconds)
    {
      id: 'instant-research',
      name: 'Research',
      description: 'Gather keyword data, competitor content, and latest statistics in parallel',
      agent: 'research',
      parallel: true,
      tools: [
        {
          name: 'dataforseo_labs_google_keyword_suggestions',
          params: {
            keyword: '{{keyword}}',
            location_name: 'United States',
            limit: 20,
          },
          required: true,
        },
        {
          name: 'ai_optimization_keyword_data_search_volume',
          params: {
            keywords: ['{{keyword}}'],
            location_name: 'United States',
            language_code: 'en',
          },
          required: false, // Optional but valuable for AEO
        },
        {
          name: 'serp_organic_live_advanced',
          params: {
            keyword: '{{keyword}}',
            location_name: 'United States',
            language_code: 'en',
            depth: 5, // Top 5 only for speed
          },
          required: true,
        },
        {
          name: 'firecrawl_agent',
          params: {
            task: 'Analyze top 5 ranking pages for "{{keyword}}". Extract: 1) Word count, 2) Main H2 headings, 3) Content structure, 4) Key topics covered, 5) Schema types used',
            startUrls: '{{serp_top_5_urls}}', // Will be populated from SERP
            maxPages: 5,
            formats: ['markdown'],
            extractSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                wordCount: { type: 'number' },
                headings: { type: 'array' },
                keyTopics: { type: 'array' },
                schemaTypes: { type: 'array' }
              }
            },
            maxAge: 604800000, // 7 days cache for stable SERP content
          },
          required: false, // Graceful degradation if agent fails
        },
        {
          name: 'perplexity_search',
          params: {
            query: '{{keyword}} latest statistics 2026',
            search_recency_filter: 'month',
            return_citations: true,
          },
          required: true,
        },
      ],
      systemPrompt: `You are a rapid research agent optimizing for speed.
Your goal is to gather comprehensive data in parallel:
1. Keyword metrics (volume, difficulty, AI search volume)
2. Top 5 competitor analysis (structure, word count, topics, schema)
3. Latest statistics and citations for the topic

Execute ALL tools in parallel using firecrawl_agent for advanced competitor intelligence.
The agent will analyze top 5 competitors simultaneously - extract key insights quickly.
Focus on what's needed for content generation, not exhaustive analysis.`,
      outputFormat: 'json',
    },

    // STEP 2: PARALLEL GENERATION (Target: 90 seconds)
    {
      id: 'instant-generate',
      name: 'Generate',
      description: 'Generate optimized content and hero image in parallel',
      agent: 'content',
      parallel: true,
      dependencies: ['instant-research'],
      tools: [
        {
          name: 'generate_researched_content',
          params: {
            topic: '{{keyword}}',
            keyword: '{{keyword}}',
            researchData: '{{instant-research}}',
            contentType: 'blog-post',
            targetWordCount: '{{contentLength}}',
            includeSchema: true,
            optimizeForAEO: true,
          },
          required: true,
        },
        {
          name: 'generate_hero_image',
          params: {
            topic: '{{keyword}}',
            style: 'professional',
            aspectRatio: '16:9',
          },
          required: false, // Content can exist without image
        },
      ],
      systemPrompt: `You are a content generation agent creating publish-ready content.

Based on the research phase results:
1. Create SEO-optimized content targeting "{{keyword}}"
2. Include E-E-A-T signals (expertise, experience, authority, trust)
3. Structure for AI citation (40-60 word direct answers for key questions)
4. Include statistics with citations from research
5. Generate hero image with topic-relevant visuals

Quality targets:
- Frase optimization score: 80+
- E-E-A-T score: 80+
- AEO compliance: Yes (direct answers, FAQ schema)`,
      outputFormat: 'json',
    },

    // STEP 3: FINALIZATION (Target: 30 seconds)
    {
      id: 'instant-finalize',
      name: 'Finalize',
      description: 'Generate schema markup, meta tags, and optimization score',
      agent: 'seo',
      parallel: true,
      dependencies: ['instant-generate'],
      tools: [
        {
          name: 'generate_schema_markup',
          params: {
            contentType: 'Article',
            content: '{{instant-generate.content}}',
            keyword: '{{keyword}}',
            includeFAQ: true,
            includeHowTo: false,
          },
          required: true,
        },
        {
          name: 'generate_meta_tags',
          params: {
            content: '{{instant-generate.content}}',
            keyword: '{{keyword}}',
            maxTitleLength: 60,
            maxDescriptionLength: 160,
          },
          required: true,
        },
        {
          name: 'calculate_optimization_score',
          params: {
            content: '{{instant-generate.content}}',
            keyword: '{{keyword}}',
            competitors: '{{instant-research.competitors}}',
          },
          required: true,
        },
      ],
      systemPrompt: `You are an SEO finalization agent.

Complete the content package:
1. Generate Article schema with FAQ markup
2. Create optimized meta title and description
3. Calculate final optimization score

Output a complete, publish-ready content package.`,
      outputFormat: 'json',
    },
  ],

  output: {
    content: {
      type: 'string',
      description: 'The generated SEO-optimized content in markdown',
    },
    heroImage: {
      type: 'object',
      description: 'Hero image data (base64 or URL)',
    },
    schema: {
      type: 'object',
      description: 'JSON-LD schema markup',
    },
    meta: {
      type: 'object',
      description: 'Meta title and description',
    },
    optimizationScore: {
      type: 'number',
      description: 'Overall optimization score (0-100)',
    },
    keywords: {
      type: 'array',
      description: 'Related keywords discovered during research',
    },
    citations: {
      type: 'array',
      description: 'Sources and citations used in content',
    },
  },
}
