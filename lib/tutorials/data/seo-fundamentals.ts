/**
 * SEO Fundamentals Tutorial
 * Beginner tutorial covering keyword research basics
 */

import type { Tutorial } from '../types'

export const seoFundamentalsTutorial: Tutorial = {
  id: 'seo-fundamentals-101',
  title: 'SEO Fundamentals: Your First Keyword Research',
  description: 'Learn the basics of keyword research and how to find opportunities for your business',
  difficulty: 'beginner',
  estimatedTime: '15 minutes',
  prerequisites: [],
  enabled: true,
  linkedWorkflow: 'keyword-research',
  outcomes: [
    {
      concept: 'Search Intent',
      skillGained: 'Understanding different types of search intent (informational, navigational, transactional, commercial)',
      realWorldApplication: 'Identify what users are looking for when they search, helping you create content that matches their needs'
    },
    {
      concept: 'Keyword Research',
      skillGained: 'Finding and evaluating keyword opportunities using data and tools',
      realWorldApplication: 'Discover keywords your target audience searches for, with realistic ranking potential'
    },
    {
      concept: 'Keyword Metrics',
      skillGained: 'Understanding search volume, keyword difficulty, and competition',
      realWorldApplication: 'Prioritize keywords that offer the best balance of traffic potential and ranking feasibility'
    }
  ],
  steps: [
    {
      id: 'understanding-search-intent',
      title: 'Understanding Search Intent',
      content: `Before we find keywords, we need to understand WHY people search. Search intent is the goal behind a user's search query.

There are four main types of search intent:

1. **Informational** - Users want to learn something (e.g., "what is SEO")
2. **Navigational** - Users want to find a specific website (e.g., "facebook login")
3. **Transactional** - Users want to buy something (e.g., "buy running shoes")
4. **Commercial** - Users are researching before buying (e.g., "best CRM software")

Understanding intent helps you create content that matches what users actually want.`,
      action: 'EXPLAIN',
      interactive: {
        question: 'What type of intent does "buy running shoes" have?',
        options: ['Informational', 'Navigational', 'Transactional', 'Commercial'],
        correct: 'Transactional',
        explanation: 'The word "buy" signals clear purchase intent. Users are ready to make a purchase, not just researching.'
      },
      estimatedTime: '3 minutes'
    },
    {
      id: 'finding-seed-keywords',
      title: 'Finding Your Seed Keywords',
      content: `Seed keywords are the starting point for your research. They're broad terms related to your business.

For example, if you run a fitness blog, your seed keywords might be:
- "workout routines"
- "nutrition tips"
- "fitness equipment"

Let's use FlowIntent's keyword research tool to expand from a seed keyword. I'll demonstrate with your business context.`,
      action: 'TOOL_DEMO',
      tool: 'dataforseo_labs_google_keyword_ideas',
      highlightParams: ['seed_keyword', 'location_name'],
      liveDemo: true,
      estimatedTime: '5 minutes'
    },
    {
      id: 'evaluating-keyword-opportunities',
      title: 'Evaluating Keyword Opportunities',
      content: `Not all keywords are created equal. You need to evaluate:

1. **Search Volume** - How many people search for this monthly?
2. **Keyword Difficulty** - How hard is it to rank? (0-100 scale)
3. **Business Relevance** - Does this match what you offer?

A good keyword opportunity has:
- Decent search volume (100+ monthly searches)
- Medium difficulty (30-60)
- High relevance to your business

Let's analyze the keywords we found and identify the best opportunities.`,
      action: 'PRACTICE',
      estimatedTime: '4 minutes'
    },
    {
      id: 'selecting-target-keywords',
      title: 'Selecting Your Target Keywords',
      content: `Now that you understand keyword research, it's time to select 1-3 keywords to target.

Choose keywords that:
- Have realistic ranking potential (difficulty < 60 for beginners)
- Match your business goals
- Have enough search volume to be worth the effort

Remember: It's better to rank #1 for a keyword with 500 monthly searches than #50 for one with 50,000 searches.`,
      action: 'REVIEW',
      estimatedTime: '3 minutes'
    }
  ]
}

