/**
 * Workflow: Multi-Platform AEO Optimization
 * 
 * Optimize content for all major AI platforms simultaneously.
 * Provides platform-specific recommendations and identifies
 * universal optimizations that work across all platforms.
 */

import { Workflow } from '../types'

export const aeoMultiPlatformOptimizationWorkflow: Workflow = {
  id: 'aeo-multi-platform-optimization',
  name: 'Multi-Platform AEO Optimization',
  description: 'Optimize your content for ChatGPT, Perplexity, Claude, and Gemini simultaneously. Get platform-specific recommendations and universal optimizations.',
  icon: '🌐',
  category: 'aeo',
  estimatedTime: '2-3 minutes',
  tags: ['AEO', 'Multi-Platform', 'ChatGPT', 'Perplexity', 'Claude', 'Gemini'],
  requiredTools: ['aeo_compare_platforms', 'aeo_optimize_for_platform'],
  requiredAPIs: ['jina'],
  
  steps: [
    // PHASE 1: EXTRACT CONTENT
    {
      id: 'extract-content',
      name: 'Extract Content',
      description: 'Scrape content from URL',
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
      systemPrompt: `Extract clean content for multi-platform analysis.`,
      outputFormat: 'json',
    },

    // PHASE 2: MULTI-PLATFORM COMPARISON
    {
      id: 'platform-comparison',
      name: 'Platform Comparison',
      description: 'Compare optimization across all AI platforms',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['extract-content'],
      tools: [
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
      systemPrompt: `Compare how well the content is optimized for each AI platform.`,
      outputFormat: 'json',
    },

    // PHASE 3: PLATFORM-SPECIFIC OPTIMIZATION (Parallel)
    {
      id: 'platform-specific-optimization',
      name: 'Platform-Specific Recommendations',
      description: 'Get detailed recommendations for each platform',
      agent: 'seo_manager',
      parallel: true,
      dependencies: ['platform-comparison'],
      tools: [
        {
          id: 'aeo_optimize_for_chatgpt',
          name: 'aeo_optimize_for_chatgpt',
          params: {
            content: '{{content}}',
            platform: 'chatgpt',
          },
          required: true,
        },
        {
          id: 'aeo_optimize_for_perplexity',
          name: 'aeo_optimize_for_perplexity',
          params: {
            content: '{{content}}',
            platform: 'perplexity',
          },
          required: true,
        },
        {
          id: 'aeo_optimize_for_claude',
          name: 'aeo_optimize_for_claude',
          params: {
            content: '{{content}}',
            platform: 'claude',
          },
          required: true,
        },
        {
          id: 'aeo_optimize_for_gemini',
          name: 'aeo_optimize_for_gemini',
          params: {
            content: '{{content}}',
            platform: 'gemini',
          },
          required: true,
        },
      ],
      systemPrompt: `Generate platform-specific optimization recommendations for all four AI platforms in parallel.`,
      outputFormat: 'json',
    },

    // PHASE 4: SYNTHESIZE RECOMMENDATIONS
    {
      id: 'synthesize-recommendations',
      name: 'Universal Optimization Strategy',
      description: 'Identify universal optimizations and prioritize platform-specific changes',
      agent: 'seo_manager',
      parallel: false,
      dependencies: ['platform-specific-optimization'],
      tools: [],
      systemPrompt: `Synthesize all platform-specific recommendations into:

**Universal Optimizations** (help all platforms):
- Changes that improve performance across all platforms
- High-priority items that benefit everyone

**Platform-Specific Optimizations**:
- ChatGPT: Unique recommendations for ChatGPT only
- Perplexity: Unique recommendations for Perplexity only
- Claude: Unique recommendations for Claude only
- Gemini: Unique recommendations for Gemini only

**Implementation Priority**:
1. Universal optimizations (do these first)
2. Platform-specific for your target platform
3. Nice-to-have platform-specific improvements

Present as an actionable roadmap.`,
      outputFormat: 'json',
    },
  ],

  parameters: {
    url: {
      type: 'string',
      description: 'URL of content to optimize',
      required: true,
      example: 'https://example.com/blog/ai-seo-guide',
    },
  },

  output: {
    type: 'structured',
    components: [
      'platform-comparison-chart',
      'universal-optimizations',
      'platform-specific-recommendations',
      'implementation-roadmap',
    ],
  },
}

