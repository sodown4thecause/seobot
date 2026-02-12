/**
 * Instant Campaign: Beat This Competitor
 * 
 * Streamlined 3-step workflow to outrank a competitor URL
 * Input: competitor_url → Output: better content that fills gaps
 */

import { Workflow } from '../types'

export const instantBeatCompetitorWorkflow: Workflow = {
  id: 'instant-beat-competitor',
  name: 'Beat This Competitor',
  description: 'Enter a competitor URL → Get content that covers everything they have PLUS what they missed',
  icon: '🎯',
  category: 'instant',
  estimatedTime: '3-5 minutes',
  tags: ['Instant', 'Competitor', 'Content', 'Gap Analysis', 'Outrank'],
  requiredTools: [
    'firecrawl_agent',
    'dataforseo_labs_google_ranked_keywords',
    'serp_organic_live_advanced',
    'perplexity_search',
    'generate_researched_content',
  ],
  requiredAPIs: ['dataforseo', 'firecrawl', 'perplexity'],

  parameters: {
    competitor_url: {
      type: 'string',
      description: 'URL of the competitor content to outrank',
      required: true,
      example: 'https://competitor.com/best-crm-guide',
    },
    includeImages: {
      type: 'boolean',
      description: 'Generate hero image (default: true)',
      required: false,
      default: true,
    },
  },

  steps: [
    // STEP 1: COMPETITOR ANALYSIS (Target: 30 seconds)
    {
      id: 'instant-competitor-analysis',
      name: 'Analyze Competitor',
      description: 'Scrape competitor content, extract keyword, and analyze their rankings',
      agent: 'research',
      parallel: true,
      tools: [
        {
          name: 'firecrawl_agent',
          params: {
            task: 'Deep analysis of competitor content at {{competitor_url}}. Extract: 1) All H1, H2, H3 headings with full hierarchy, 2) Word count, 3) Key topics and subtopics covered, 4) Content structure and sections, 5) Schema types, 6) Internal/external links count, 7) Image count, 8) FAQ sections if any, 9) Statistics mentioned, 10) Content gaps or missing topics',
            startUrls: ['{{competitor_url}}'],
            maxPages: 1,
            formats: ['markdown', 'html'],
            extractSchema: {
              type: 'object',
              properties: {
                url: { type: 'string' },
                title: { type: 'string' },
                h1: { type: 'string' },
                headings: { type: 'array' },
                wordCount: { type: 'number' },
                keyTopics: { type: 'array' },
                structure: { type: 'object' },
                schemaTypes: { type: 'array' },
                internalLinks: { type: 'number' },
                externalLinks: { type: 'number' },
                imageCount: { type: 'number' },
                hasFAQ: { type: 'boolean' },
                statistics: { type: 'array' }
              }
            },
            maxAge: 86400000, // 1 day cache - competitor content may change
          },
          required: true,
        },
        {
          name: 'extract_keyword_from_content',
          params: {
            url: '{{competitor_url}}',
          },
          required: true,
        },
        {
          name: 'dataforseo_labs_google_ranked_keywords',
          params: {
            target: '{{competitor_domain}}', // Extracted from URL
            location_name: 'United States',
            limit: 50,
            include_serp_info: true,
          },
          required: false, // Valuable but not critical
        },
      ],
      systemPrompt: `You are a competitive analysis agent using advanced web intelligence.

Your tasks:
1. Use firecrawl_agent to perform deep analysis of competitor's content
2. Extract comprehensive content structure, topics, and technical details
3. Identify their primary target keyword from title/H1/content
4. Understand their complete topic coverage and content depth
5. Get their domain's other ranking keywords for context

The agent provides structured data extraction - use it to identify precise GAPS in their coverage.
Focus on understanding WHAT they cover (and what they DON'T) so we can create superior content.`,
      outputFormat: 'json',
    },

    // STEP 2: GAP IDENTIFICATION + CONTENT (Target: 90 seconds)
    {
      id: 'instant-gap-content',
      name: 'Find Gaps & Generate',
      description: 'Identify content gaps and generate superior content',
      agent: 'content',
      parallel: true,
      dependencies: ['instant-competitor-analysis'],
      tools: [
        {
          name: 'serp_organic_live_advanced',
          params: {
            keyword: '{{extracted_keyword}}',
            location_name: 'United States',
            language_code: 'en',
            depth: 10,
          },
          required: true,
        },
        {
          name: 'perplexity_search',
          params: {
            query: '{{extracted_keyword}} what most guides miss OR common mistakes OR advanced tips',
            search_recency_filter: 'month',
            return_citations: true,
          },
          required: true,
        },
        {
          name: 'generate_researched_content',
          params: {
            topic: '{{extracted_keyword}}',
            keyword: '{{extracted_keyword}}',
            competitorContent: '{{instant-competitor-analysis.content}}',
            competitorGaps: '{{identified_gaps}}',
            contentType: 'comprehensive-guide',
            targetWordCount: 'longer_than_competitor',
            includeSchema: true,
            optimizeForAEO: true,
            beatCompetitor: true,
          },
          required: true,
        },
        {
          name: 'generate_hero_image',
          params: {
            topic: '{{extracted_keyword}}',
            style: 'professional',
            aspectRatio: '16:9',
          },
          required: false,
        },
      ],
      systemPrompt: `You are a content strategist creating content to OUTRANK a competitor.

Based on the competitor analysis:
1. Identify topics the competitor DIDN'T cover (gaps)
2. Find latest information they're missing
3. Create content that covers EVERYTHING they have PLUS:
   - Additional subtopics they missed
   - More recent statistics and examples
   - Better E-E-A-T signals
   - More comprehensive FAQ section
   - Better structure for AI citations

Your content MUST be more comprehensive than theirs.
Target word count: At least 20% more than competitor.`,
      outputFormat: 'json',
    },

    // STEP 3: FINALIZATION + COMPARISON (Target: 30 seconds)
    {
      id: 'instant-finalize-compare',
      name: 'Finalize & Compare',
      description: 'Generate schema, meta tags, and comparison summary',
      agent: 'seo',
      parallel: true,
      dependencies: ['instant-gap-content'],
      tools: [
        {
          name: 'generate_schema_markup',
          params: {
            contentType: 'Article',
            content: '{{instant-gap-content.content}}',
            keyword: '{{extracted_keyword}}',
            includeFAQ: true,
            includeHowTo: true,
          },
          required: true,
        },
        {
          name: 'generate_meta_tags',
          params: {
            content: '{{instant-gap-content.content}}',
            keyword: '{{extracted_keyword}}',
            competitorMeta: '{{instant-competitor-analysis.meta}}',
            maxTitleLength: 60,
            maxDescriptionLength: 160,
          },
          required: true,
        },
        {
          name: 'generate_comparison_summary',
          params: {
            yourContent: '{{instant-gap-content.content}}',
            competitorContent: '{{instant-competitor-analysis.content}}',
            keyword: '{{extracted_keyword}}',
          },
          required: true,
        },
      ],
      systemPrompt: `You are an SEO finalization agent.

Complete the content package and generate a comparison report:
1. Create comprehensive schema markup (Article + FAQ + HowTo if applicable)
2. Write meta tags that are MORE compelling than competitor's
3. Generate a comparison summary showing:
   - Word count: yours vs theirs
   - Topics covered: yours vs theirs
   - Additional topics you added
   - E-E-A-T improvements
   - Why your content should rank higher`,
      outputFormat: 'json',
    },
  ],

  output: {
    content: {
      type: 'string',
      description: 'The generated content that outranks competitor',
    },
    heroImage: {
      type: 'object',
      description: 'Hero image data',
    },
    schema: {
      type: 'object',
      description: 'JSON-LD schema markup',
    },
    meta: {
      type: 'object',
      description: 'Meta title and description',
    },
    comparison: {
      type: 'object',
      description: 'Detailed comparison with competitor content',
      properties: {
        yourWordCount: { type: 'number' },
        competitorWordCount: { type: 'number' },
        topicsYouCover: { type: 'array' },
        topicsCompetitorCovers: { type: 'array' },
        additionalTopics: { type: 'array' },
        advantagesSummary: { type: 'string' },
      },
    },
    competitorAnalysis: {
      type: 'object',
      description: 'Analysis of the competitor content',
    },
    gapsIdentified: {
      type: 'array',
      description: 'Content gaps found in competitor content',
    },
  },
}
