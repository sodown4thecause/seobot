/**
 * Workflow: Citation Optimization
 * 
 * Focused workflow to maximize citation-worthiness of content.
 * Analyzes competitor citations, identifies gaps, and provides
 * specific recommendations to get cited by AI platforms.
 */

import { Workflow } from '../types'

export const aeoCitationOptimizationWorkflow: Workflow = {
  id: 'aeo-citation-optimization',
  name: 'Citation Optimization',
  description: 'Maximize your content\'s citation-worthiness. Analyzes what gets cited, identifies gaps in your content, and provides specific recommendations to get cited by ChatGPT, Perplexity, Claude, and Gemini.',
  icon: '📚',
  category: 'aeo',
  estimatedTime: '2-3 minutes',
  tags: ['AEO', 'Citations', 'Competitive Analysis', 'Content Optimization'],
  requiredTools: ['aeo_analyze_citations', 'aeo_find_citation_opportunities', 'aeo_optimize_for_citations'],
  requiredAPIs: ['jina', 'perplexity'],
  
  steps: [
    // PHASE 1: UNDERSTAND CITATION LANDSCAPE
    {
      id: 'citation-landscape',
      name: 'Citation Landscape Analysis',
      description: 'Analyze what content gets cited for your topic',
      agent: 'seo_manager',
      parallel: false,
      tools: [
        {
          id: 'aeo_analyze_citations',
          name: 'aeo_analyze_citations',
        },
      ],
      systemPrompt: `Analyze the citation landscape for this topic.`,
      outputFormat: 'json',
    },

    // PHASE 2: ANALYZE YOUR CONTENT
    {
      id: 'analyze-your-content',
      name: 'Your Content Analysis',
      description: 'Scrape and analyze your content for citation-worthiness',
      agent: 'seo_manager',
      parallel: true,
      dependencies: ['citation-landscape'],
      tools: [
        {
          name: 'aeo_analyze_citations',
          platforms: ['perplexity'],
          required: true,
        },
          required: true,
        },
        {
          name: 'aeo_find_citation_opportunities',
          params: {
            yourUrl: '{{url}}',
            topic: '{{topic}}',
          },
          required: true,
        },
      ],
      systemPrompt: `Analyze your content for citation-worthiness.`,
      outputFormat: 'json',
    },

    // PHASE 3: GENERATE OPTIMIZATION PLAN
    {
      id: 'optimization-plan',
      name: 'Citation Optimization Plan',
      description: 'Generate specific recommendations to improve citation-worthiness',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['analyze-your-content'],
      tools: [
        {
          name: 'aeo_optimize_for_citations',
          params: {
            content: '{{content}}',
            topic: '{{topic}}',
            targetPlatforms: ['all'],
          },
          required: true,
        },
      ],
      systemPrompt: `Create a comprehensive citation optimization plan with priority recommendations.`,
      outputFormat: 'structured',
    },
  ],

  parameters: {
    url: {
      type: 'string',
      description: 'URL of your content to optimize',
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

  output: {
    type: 'structured',
    components: [
      'citation-landscape-overview',
      'your-citation-score',
      'optimization-roadmap',
    ],
  },
}

