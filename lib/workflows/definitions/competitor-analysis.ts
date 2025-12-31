import { Workflow } from '../types'

export const competitorAnalysisWorkflow: Workflow = {
  id: 'competitor-analysis',
  name: 'Competitor Analysis',
  description: 'Analyze competitors to identify strengths, weaknesses, and opportunities',
  icon: '⚔️',
  category: 'seo',
  estimatedTime: '3-5 minutes',
  tags: ['Competitor', 'Analysis', 'Strategy', 'Keywords'],
  requiredTools: [
    'domain_overview', 
    'keyword_search_volume', 
    'google_rankings',
    'dataforseo_labs_google_ranked_keywords',
  ],
  requiredAPIs: ['dataforseo'],
  
  steps: [
    // PHASE 1: COMPETITOR DISCOVERY (Parallel)
    {
      id: 'competitor-discovery',
      name: 'Competitor Discovery',
      description: 'Identify key competitors and their market positioning',
      agent: 'research',
      parallel: true,
      tools: [
        {
          name: 'domain_overview',
          params: {
            domain: '{{domain}}',
            location_name: 'United States',
          },
          required: true,
        },
        {
          name: 'google_rankings',
          params: {
            keyword: '{{keyword}}', // Main keyword to find who ranks
            location_name: 'United States',
          },
          required: true,
        }
      ],
      systemPrompt: `You are a competitor analysis agent.
Your goal is to:
1. Analyze the target domain's current standing
2. Identify top competitors ranking for the main keyword
3. Gather baseline metrics (traffic, keywords, authority)

Output a clear summary of the competitive landscape.`,
      outputFormat: 'json',
    },

    // PHASE 2: DEEP DIVE ANALYSIS (Sequential)
    {
      id: 'competitor-deep-dive',
      name: 'Deep Dive Analysis',
      description: 'Analyze specific competitors found in the previous step',
      agent: 'research',
      parallel: false,
      dependencies: ['competitor-discovery'],
      tools: [
        {
          name: 'domain_overview',
          params: {
            domain: '{{competitor_1}}', // Extracted from previous step
            location_name: 'United States',
          },
        },
        {
          name: 'domain_overview',
          params: {
            domain: '{{competitor_2}}',
            location_name: 'United States',
          },
        }
      ],
      systemPrompt: `Analyze the top 2 identified competitors.
Compare them against the user's domain in terms of:
1. Organic Traffic
2. Keyword overlap
3. Backlink profile (if available)
4. Content strategy

Highlight their strengths and weaknesses.`,
      outputFormat: 'json',
    },

    {
      id: 'keyword-profile-analysis',
      name: 'Keyword Profile Analysis',
      description: 'Build comprehensive keyword profiles for target and competitor domains',
      agent: 'research',
      parallel: false,
      dependencies: ['competitor-deep-dive'],
      tools: [
        {
          name: 'dataforseo_labs_google_ranked_keywords',
          params: {
            target: '{{domain}}',
            location_name: 'United States',
            limit: 500,
            order_by: ['metrics.organic.count,desc'],
          },
          required: true,
        },
        {
          name: 'dataforseo_labs_google_ranked_keywords',
          params: {
            target: '{{competitor_1}}',
            location_name: 'United States',
            limit: 500,
            order_by: ['metrics.organic.count,desc'],
          },
        },
        {
          name: 'dataforseo_labs_google_ranked_keywords',
          params: {
            target: '{{competitor_2}}',
            location_name: 'United States',
            limit: 500,
            order_by: ['metrics.organic.count,desc'],
          },
        },
      ],
      systemPrompt: `You are analyzing keyword profiles for domains.

For each domain, extract:
1. Total keywords ranking
2. Position distribution (top 3, top 10, top 20, top 50)
3. Estimated traffic by position tier
4. Top performing keywords
5. Keyword intent breakdown (informational, transactional, commercial, navigational)

Compare profiles to identify:
- Keyword gaps (competitors rank for keywords you don't)
- Position gaps (competitors rank higher for same keywords)
- Traffic opportunities

Output comprehensive keyword profiles with gap analysis.`,
      outputFormat: 'component',
      componentType: 'DomainKeywordProfile',
    },

    // PHASE 3: STRATEGY FORMULATION
    {
      id: 'strategy-formulation',
      name: 'Strategy Formulation',
      description: 'Create a winning strategy based on competitor analysis',
      agent: 'strategy',
      parallel: false,
      dependencies: ['competitor-discovery', 'competitor-deep-dive', 'keyword-profile-analysis'],
      tools: [],
      systemPrompt: `You are a strategic SEO consultant.
Based on the competitor analysis:
1. Identify "Low Hanging Fruit" keywords where competitors are weak
2. Recommend content gaps to fill
3. Suggest specific actions to outrank competitors
4. Estimate effort vs impact for each recommendation

Create a prioritized action plan.`,
      outputFormat: 'component',
      componentType: 'ContentStrategy',
    },
  ],
}
