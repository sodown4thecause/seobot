/**
 * Workflow: Comprehensive AEO Audit
 * 
 * Complete audit of content for Answer Engine Optimization across all AI platforms.
 * Analyzes citation-worthiness, EEAT signals, platform-specific optimization,
 * and provides actionable recommendations.
 */

import { Workflow } from '../types'

export const aeoComprehensiveAuditWorkflow: Workflow = {
  id: 'aeo-comprehensive-audit',
  name: 'Comprehensive AEO Audit',
  description: 'Complete audit of your content for AI platform visibility. Analyzes citation-worthiness, EEAT signals, and platform-specific optimization across ChatGPT, Perplexity, Claude, and Gemini.',
  icon: '🔍',
  category: 'aeo',
  estimatedTime: '3-4 minutes',
  tags: ['AEO', 'Audit', 'EEAT', 'Citations', 'Multi-Platform'],
  requiredTools: ['aeo_find_citation_opportunities', 'aeo_detect_eeat_signals', 'aeo_compare_platforms'],
  requiredAPIs: ['jina'],
  
  steps: [
    // PHASE 1: CONTENT EXTRACTION
    {
      id: 'extract-content',
      name: 'Extract Content',
      description: 'Scrape and extract clean content from the target URL',
      agent: 'research',
      parallel: false,
      tools: [
        {
          id: 'jina_scrape',
          name: 'jina_scrape',
          params: {
            url: '{{url}}',
          },
          required: true,
        },
      ],
      systemPrompt: `Extract clean content from the URL for AEO analysis.`,
      outputFormat: 'json',
    },

    // PHASE 2: PARALLEL ANALYSIS
    {
      id: 'parallel-analysis',
      name: 'Multi-Dimensional Analysis',
      description: 'Analyze citation opportunities, EEAT signals, and platform optimization in parallel',
      agent: 'seo_manager',
      parallel: true,
      dependencies: ['extract-content'],
      tools: [
        {
          id: 'aeo_find_citation_opportunities',
          name: 'aeo_find_citation_opportunities',
          params: {
            yourUrl: '{{url}}',
            topic: '{{topic}}',
          },
          required: true,
        },
        {
          id: 'aeo_detect_eeat_signals',
          name: 'aeo_detect_eeat_signals',
          params: {
            content: '{{content}}',
            url: '{{url}}',
          },
          required: true,
        },
        {
          id: 'aeo_compare_platforms',
          name: 'aeo_compare_platforms',
          params: {
            content: '{{content}}',
            platforms: ['chatgpt', 'perplexity', 'claude', 'gemini'],
          },
          required: true,
        },
      ],
      systemPrompt: `Analyze the content across three critical dimensions:
1. Citation-worthiness - How likely is this content to be cited by AI platforms?
2. EEAT signals - Does it demonstrate Experience, Expertise, Authoritativeness, Trustworthiness?
3. Platform optimization - How well is it optimized for each AI platform?

Execute all analyses in parallel for efficiency.`,
      outputFormat: 'json',
    },

    // PHASE 3: CITATION PATTERN ANALYSIS
    {
      id: 'citation-analysis',
      name: 'Citation Pattern Analysis',
      description: 'Analyze what content gets cited for this topic',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['parallel-analysis'],
      tools: [
        {
          id: 'aeo_analyze_citations',
          name: 'aeo_analyze_citations',
          params: {
            topic: '{{topic}}',
            platforms: ['perplexity'],
          },
          required: true,
        },
      ],
      systemPrompt: `Analyze citation patterns to understand what makes content citation-worthy for this topic.`,
      outputFormat: 'json',
    },

    // PHASE 4: GENERATE RECOMMENDATIONS
    {
      id: 'generate-recommendations',
      name: 'Generate Action Plan',
      description: 'Synthesize all analysis into prioritized recommendations',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['citation-analysis'],
      tools: [
        {
          id: 'aeo_optimize_for_citations',
          name: 'aeo_optimize_for_citations',
          params: {
            content: '{{content}}',
            topic: '{{topic}}',
            targetPlatforms: ['all'],
          },
          required: true,
        },
        {
          id: 'aeo_enhance_eeat_signals',
          name: 'aeo_enhance_eeat_signals',
          params: {
            content: '{{content}}',
            focusAreas: ['all'],
          },
          required: true,
        },
        {
          id: 'aeo_analyze_sentiment',
          name: 'aeo_analyze_sentiment',
          params: {
            content: '{{content}}',
            url: '{{url}}',
          },
          required: true,
        },
        {
          id: 'aeo_analyze_entities',
          name: 'aeo_analyze_entities',
          params: {
            content: '{{content}}',
            platforms: ['all'],
          },
          required: true,
        },
      ],
      systemPrompt: `Generate a comprehensive action plan with:
1. Priority recommendations (critical, high, medium)
2. Platform-specific optimizations
3. EEAT enhancement strategies
4. Citation-worthiness improvements
5. Quick wins vs. long-term improvements

Present as an actionable roadmap.`,
      outputFormat: 'json',
    },
  ],

  // Expected parameters from user query
  parameters: {
    url: {
      type: 'string',
      description: 'URL of the content to audit',
      required: true,
      example: 'https://example.com/blog/seo-guide',
    },
    topic: {
      type: 'string',
      description: 'Main topic of the content',
      required: true,
      example: 'SEO optimization',
    },
  },

  // Output format
  output: {
    type: 'structured',
    components: [
      'citation-score-card',
      'eeat-breakdown',
      'platform-comparison',
      'action-plan',
    ],
  },
}

