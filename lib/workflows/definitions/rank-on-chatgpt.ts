// Workflow: How to Rank on ChatGPT/Claude/Perplexity

import { Workflow } from '../types'

export const rankOnChatGPTWorkflow: Workflow = {
  id: 'rank-on-chatgpt',
  name: 'How to Rank on ChatGPT',
  description: 'Complete strategy to rank your content on AI search engines (ChatGPT, Claude, Perplexity)',
  icon: '🤖',
  category: 'seo',
  estimatedTime: '2-3 minutes',
  tags: ['AI Search', 'ChatGPT', 'AEO', 'EEAT', 'Citations'],
  requiredTools: ['ai_keyword_search_volume', 'keyword_search_volume', 'google_rankings'],
  requiredAPIs: ['jina', 'perplexity'],
  
  steps: [
    // PHASE 1: RESEARCH (Parallel Execution)
    {
      id: 'research-phase',
      name: 'Research Phase',
      description: 'Gather comprehensive data about AI search volume, Google rankings, and current SERP',
      agent: 'research',
      parallel: true, // Execute all tools in parallel
      tools: [
        {
          name: 'ai_keyword_search_volume',
          params: {
            // Will be populated from user query
            keyword: '{{keyword}}',
            location_name: 'United States',
          },
          required: true,
        },
        {
          name: 'keyword_search_volume',
          params: {
            keyword: '{{keyword}}',
            location_name: 'United States',
          },
          required: true,
        },
        {
          name: 'google_rankings',
          params: {
            keyword: '{{keyword}}',
            location_name: 'United States',
          },
          required: true,
        },
      ],
      systemPrompt: `You are a research agent gathering data about AI search optimization.
Your goal is to collect comprehensive data about:
1. AI platform search volume (ChatGPT, Claude, Perplexity)
2. Traditional Google search volume for comparison
3. Current SERP results to see what's ranking

Execute all tools in parallel for maximum efficiency.`,
      outputFormat: 'json',
    },

    // PHASE 2: CONTENT ANALYSIS (Sequential with Jina)
    {
      id: 'content-analysis',
      name: 'Content Analysis',
      description: 'Scrape and analyze top 3 ranking pages to understand what content is working',
      agent: 'research',
      parallel: true, // Scrape top 3 in parallel
      dependencies: ['research-phase'],
      tools: [
        {
          name: 'jina_reader',
          params: {
            url: '{{serp_result_1_url}}', // From previous step
          },
        },
        {
          name: 'jina_reader',
          params: {
            url: '{{serp_result_2_url}}',
          },
        },
        {
          name: 'jina_reader',
          params: {
            url: '{{serp_result_3_url}}',
          },
        },
      ],
      systemPrompt: `You are analyzing the top-ranking content to identify:
1. Content structure and format
2. EEAT signals (expertise, experience, authoritativeness, trustworthiness)
3. Citation patterns and sources
4. Content depth and comprehensiveness
5. Unique angles and perspectives

Look for patterns across all three pages.`,
      outputFormat: 'json',
    },

    // PHASE 3: CITATION RESEARCH (Perplexity)
    {
      id: 'citation-research',
      name: 'Citation Research',
      description: 'Find authoritative sources and recent data to cite in content',
      agent: 'research',
      parallel: false,
      dependencies: ['content-analysis'],
      tools: [
        {
          name: 'perplexity_search',
          params: {
            query: 'Latest statistics and research about {{keyword}} from authoritative sources',
            search_recency_filter: 'month', // Recent data only
          },
        },
      ],
      systemPrompt: `You are finding authoritative sources to cite in the content.
Focus on:
1. Recent statistics and data (last 6 months)
2. Academic or industry research
3. Expert opinions and quotes
4. Government or institutional sources
5. Well-known publications

These citations will strengthen EEAT signals.`,
      outputFormat: 'json',
    },

    // PHASE 4: STRATEGY GENERATION
    {
      id: 'strategy-generation',
      name: 'Strategy Generation',
      description: 'Analyze all data and create actionable ranking strategy',
      agent: 'strategy',
      parallel: false,
      dependencies: ['research-phase', 'content-analysis', 'citation-research'],
      tools: [], // No external tools, pure analysis
      systemPrompt: `You are a strategy agent creating an actionable plan to rank on AI search engines.

Based on the research data, content analysis, and citation research, create a comprehensive strategy that includes:

1. **AI Search Opportunity Analysis**
   - Compare AI platform volume vs Google volume
   - Identify if this keyword is worth targeting for AI search
   - Highlight unique opportunities in AI search

2. **Content Gap Analysis**
   - What are top-ranking pages doing well?
   - What are they missing?
   - What unique angle can we take?

3. **EEAT Strategy**
   - What expertise signals to include
   - What experience indicators to add
   - How to demonstrate authoritativeness
   - Trust signals needed (citations, sources)

4. **Content Structure Recommendations**
   - Optimal content format
   - Key sections to include
   - Depth and comprehensiveness needed
   - Multimedia elements to add

5. **Citation Strategy**
   - Which authoritative sources to cite
   - How to integrate citations naturally
   - Expert quotes to include
   - Data points to reference

6. **Optimization Checklist**
   - Technical optimizations
   - On-page elements
   - Schema markup recommendations
   - Internal linking strategy

Make this ACTIONABLE - specific steps the user can take immediately.`,
      outputFormat: 'component',
      componentType: 'ContentStrategy',
    },

    // PHASE 5: CITATION RECOMMENDATIONS
    {
      id: 'citation-recommendations',
      name: 'Citation Recommendations',
      description: 'Provide specific sources to cite with context',
      agent: 'strategy',
      parallel: false,
      dependencies: ['citation-research', 'strategy-generation'],
      tools: [],
      systemPrompt: `Based on the citation research, provide specific recommendations for sources to cite.

For each recommended citation, include:
1. Source name and URL
2. Why it's authoritative
3. What specific data/quote to use
4. Where in the content to place it
5. How it strengthens EEAT

Format as a clear, actionable list.`,
      outputFormat: 'component',
      componentType: 'CitationRecommendations',
    },
  ],
}

