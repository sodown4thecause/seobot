import type { ChatMode } from '@/lib/chat/modes'

/**
 * Mode subskills — the "+ menu" surface, modeled on the Cursor composer pattern.
 *
 * Each mode exposes a small set of high-intent quick actions ("subskills").
 * Selecting one seeds the composer with a ready-to-run example prompt.
 *
 * This config is intentionally UI-agnostic so it can power BOTH the landing
 * marketing demo (`components/landing/mode-skill-picker.tsx`) and, later, the
 * real dashboard chat composer.
 *
 * @see docs/specs/platform-modes.md
 * @see lib/chat/modes.ts
 */
export type ModeSkill = {
  /** Stable id, unique within a mode */
  id: string
  /** Short action label shown on the chip */
  label: string
  /** One-line description of what the subskill does */
  description: string
  /** Ready-to-run example prompt that seeds the composer */
  prompt: string
}

export const MODE_SKILLS: Record<ChatMode, ModeSkill[]> = {
  seo: [
    {
      id: 'keyword-gap',
      label: 'Keyword gap finder',
      description: 'Keywords competitors rank for that you do not',
      prompt:
        'Find the keyword gaps between my site and my top 2 competitors, ranked by traffic potential and difficulty.',
    },
    {
      id: 'serp-scan',
      label: 'SERP competitor scan',
      description: 'Who owns page one and which SERP features',
      prompt:
        'Scan the live SERP for my main keyword and break down who ranks top 10, their SERP features, and the gaps I can win.',
    },
    {
      id: 'backlink-audit',
      label: 'Backlink profile audit',
      description: 'Referring domains, anchors, and toxic links',
      prompt:
        'Audit my backlink profile: referring domains, anchor text distribution, and any toxic links I should disavow.',
    },
    {
      id: 'tech-crawl',
      label: 'Technical SEO crawl',
      description: 'Crawlability, Core Web Vitals, and on-page issues',
      prompt:
        'Run a technical SEO audit of my site and prioritize the crawlability, indexation, and Core Web Vitals fixes by impact.',
    },
  ],
  geo: [
    {
      id: 'ai-visibility',
      label: 'AI visibility check',
      description: 'Are you cited in ChatGPT, Perplexity & AI Overviews',
      prompt:
        'Check whether my brand is mentioned or cited in ChatGPT, Perplexity, and Google AI Overviews for my core prompts.',
    },
    {
      id: 'citation-tracker',
      label: 'Citation source tracker',
      description: 'Which URLs the AI engines cite for your topics',
      prompt:
        'Track exactly which URLs the AI answer engines cite for my key topics, and how often each source appears.',
    },
    {
      id: 'share-of-voice',
      label: 'Share-of-voice snapshot',
      description: 'Your presence vs competitors across engines',
      prompt:
        'Give me a GEO share-of-voice snapshot: my presence vs my competitors across ChatGPT, Perplexity, and AI Overviews.',
    },
    {
      id: 'prompt-monitor',
      label: 'Prompt-set monitor',
      description: 'Track answer drift on a set of prompts over time',
      prompt:
        'Set up monitoring for a set of buyer prompts and show how the AI answers and citations drift over time.',
    },
    {
      id: 'ai-crawlability',
      label: 'AI crawlability audit',
      description: 'robots.txt, llms.txt, and AI bot access',
      prompt:
        'Run an AI crawlability audit on my domain — check robots.txt, llms.txt, and whether GPTBot, PerplexityBot, and ClaudeBot can access my site.',
    },
    {
      id: 'schema-entity',
      label: 'Schema for AI entities',
      description: 'Organization, Product, or FAQ JSON-LD',
      prompt:
        'Generate Organization and FAQ JSON-LD schema for my brand so AI engines can recognize and cite us accurately.',
    },
  ],
  content: [
    {
      id: 'blog-package',
      label: 'Blog package',
      description: 'Draft + hero image + thumbnail, saved to workspace',
      prompt:
        'Create a full blog package on my topic: outline, draft, hero image, and thumbnail — then save it to my workspace.',
    },
    {
      id: 'brief-from-gaps',
      label: 'Brief from Reddit gaps',
      description: 'Turn content gaps into a ranked brief',
      prompt:
        'Turn my Reddit content gap findings into a prioritized content brief with angles, sources, and action items.',
    },
    {
      id: 'metadata-schema',
      label: 'Metadata + schema',
      description: 'Titles, meta, and JSON-LD for a page',
      prompt:
        'Generate optimized title tags, meta description, and JSON-LD schema for this page so it is cite-worthy.',
    },
    {
      id: 'repurpose',
      label: 'Repurpose to social',
      description: 'Spin one post into channel-native variants',
      prompt:
        'Repurpose my latest post into channel-native variants for LinkedIn, X, and a newsletter blurb.',
    },
  ],
}

export function getModeSkills(mode: ChatMode): ModeSkill[] {
  return MODE_SKILLS[mode]
}
