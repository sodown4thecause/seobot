import type { Workflow } from '@/lib/workflows/types'

export const REDDIT_CONTENT_GAP_AUDIT_WORKFLOW_ID = 'reddit-content-gap-audit'

export function buildRedditContentGapAuditWorkflow(topic: string, subreddits?: string[]): Workflow {
  return {
    id: REDDIT_CONTENT_GAP_AUDIT_WORKFLOW_ID,
    name: 'Reddit Content Gap Audit',
    description: `Analyzes Reddit discussions on "${topic}" to find content gaps your competitors are missing.`,
    category: 'audit',
    tags: ['reddit', 'content-gap', 'lead-magnet', 'competitive'],
    steps: [
      {
        id: 'discover-subreddits',
        name: 'Discover relevant subreddits',
        tools: [
          {
            id: 'reddit_search_subreddits',
            name: 'reddit_search',
            params: { query: topic, type: 'sr', limit: 10 },
            required: true,
          },
        ],
      },
      {
        id: 'search-threads',
        name: 'Search for high-engagement threads',
        parallel: true,
        tools: subreddits
          ? subreddits.slice(0, 5).flatMap((sub) => [
            {
              id: `reddit_search_${sub}`,
              name: 'reddit_search_posts',
              params: { query: topic, subreddit: sub, sort: 'relevance', time: 'year', limit: 10 },
              required: true,
            },
            {
              id: `reddit_top_${sub}`,
              name: 'reddit_top_posts',
              params: { subreddit: sub, time: 'month', limit: 10 },
              required: false,
            },
          ])
          : [
            {
              id: 'reddit_search_all',
              name: 'reddit_search_posts',
              params: { query: topic, sort: 'relevance', time: 'year', limit: 25 },
              required: true,
            },
          ],
      },
      {
        id: 'scrape-content',
        name: 'Extract thread content and questions',
        parallel: true,
        tools: [
          {
            id: 'supadata_scrape_threads',
            name: 'supadata_scrape',
            params: { source: 'reddit' },
            required: false,
          },
        ],
      },
      {
        id: 'analyze-gaps',
        name: 'Analyze content gaps and score opportunities',
        tools: [
          {
            id: 'gap_analysis',
            name: 'content_gap_analyzer',
            params: { topic },
            required: true,
          },
        ],
      },
    ],
  }
}