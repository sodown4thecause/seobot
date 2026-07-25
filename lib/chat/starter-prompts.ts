import type { ChatMode } from '@/lib/chat/modes'

export interface StarterPrompt {
  id: string
  text: string
  icon: 'lightbulb' | 'search' | 'file' | 'sparkles' | 'target' | 'trending' | 'zap'
}

export const STARTER_PROMPTS_BY_MODE: Record<ChatMode, StarterPrompt[]> = {
  seo: [
    {
      id: 'keyword-gap',
      text: 'Analyze flowintent.com and tell me the top 5 keyword opportunities I’m missing vs my competitors',
      icon: 'target',
    },
    {
      id: 'keyword-target',
      text: 'What keywords should I target to rank for "AI SEO tools" — give me search volume, difficulty, and intent',
      icon: 'search',
    },
    {
      id: 'competitor-scrape',
      text: 'Run a full competitor analysis for the keyword "content marketing platform" and scrape the top 3 ranking pages',
      icon: 'lightbulb',
    },
    {
      id: 'backlink-profile',
      text: 'Check the backlink profile for ahrefs.com and identify their top referring domains',
      icon: 'zap',
    },
  ],
  geo: [
    {
      id: 'ai-brand-visibility',
      text: 'My brand is "FlowIntent" (flowintent.com) — check if I appear across ChatGPT, Perplexity, and Google AI Overviews for "best AI SEO tools"',
      icon: 'sparkles',
    },
    {
      id: 'geo-competitor',
      text: 'Track my brand "FlowIntent" for the query "alternatives to Ahrefs" and tell me which competitors appear',
      icon: 'target',
    },
    {
      id: 'geo-fix-cycle',
      text: 'Start a fix cycle for the question "Why doesn’t ChatGPT recommend my brand?"',
      icon: 'zap',
    },
    {
      id: 'geo-optimize',
      text: 'How can I optimize my content to get cited in AI-generated answers?',
      icon: 'search',
    },
  ],
  content: [
    {
      id: 'pillar-page',
      text: 'Write a comprehensive pillar page on "AI SEO" — research top-ranking competitors first',
      icon: 'lightbulb',
    },
    {
      id: 'comparison-article',
      text: 'Create a comparison article for the top 5 AI writing tools, targeting "best AI writer" (check search volume first)',
      icon: 'target',
    },
    {
      id: 'faq-page',
      text: 'Write an FAQ page targeting "People Also Ask" questions for the keyword "content marketing strategy"',
      icon: 'sparkles',
    },
    {
      id: 'blog-post',
      text: 'Generate a blog post about Core Web Vitals optimization — include current Google benchmarks',
      icon: 'zap',
    },
  ],
  social: [
    {
      id: 'x-mentions',
      text: 'Search X for recent mentions of FlowIntent and summarize the main narratives, praise, complaints, and opportunities',
      icon: 'sparkles',
    },
    {
      id: 'reddit-pain-points',
      text: 'Search Reddit for pain points around AI SEO tools and group them into content opportunities',
      icon: 'target',
    },
    {
      id: 'competitor-social',
      text: 'Compare social reactions to Ahrefs and Semrush launches and find positioning gaps we can use',
      icon: 'search',
    },
    {
      id: 'social-trends',
      text: 'Find emerging social-web trends for GEO and AI search across X, Reddit, and forums',
      icon: 'zap',
    },
  ],
}
