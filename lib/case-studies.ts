import type { ChatMode } from '@/lib/chat/modes'

/**
 * Case studies — data-driven so the marketing surface stays in sync with the
 * three-mode product story (SEO / GEO-AEO / Content) without hardcoded JSX.
 *
 * These are launch placeholders. Swap copy/metrics as real customer results
 * land; the page templates render whatever is in this list.
 *
 * @see docs/specs/platform-modes.md
 */
export type CaseStudyMetric = {
  label: string
  value: string
}

export type CaseStudy = {
  slug: string
  title: string
  /** Short customer/segment descriptor */
  client: string
  /** Which product mode the story centers on */
  mode: ChatMode
  summary: string
  /** Public image path under /public */
  image: string
  metrics: CaseStudyMetric[]
  /** Body sections rendered in order */
  sections: { heading: string; body: string }[]
  featured?: boolean
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'reddit-gap-to-ai-citations',
    title: 'From Reddit content gaps to AI Overview citations in 6 weeks',
    client: 'B2B SaaS · Series A',
    mode: 'geo',
    summary:
      'A B2B SaaS team used the free Reddit gap audit to find unanswered buyer questions, shipped content in Content Mode, then tracked their rise in ChatGPT and Google AI Overviews with GEO / AEO Mode.',
    image: '/marketing/flowintent-modes-hero.png',
    featured: true,
    metrics: [
      { label: 'AI Overview citations', value: '0 → 18' },
      { label: 'Tracked buyer prompts', value: '42' },
      { label: 'Time to first citation', value: '19 days' },
    ],
    sections: [
      {
        heading: 'The gap',
        body: 'Their audience was asking detailed comparison questions on Reddit that no competitor answered well. Traditional rank tracking missed it entirely because the demand lived in AI answers, not blue links.',
      },
      {
        heading: 'The flow',
        body: 'They started with the free Reddit content gap audit, promoted the highest-intent threads into Content Mode briefs, published the packages, then opened GEO / AEO Mode to monitor mentions and citations across ChatGPT, Perplexity, and Google AI Overviews.',
      },
      {
        heading: 'The result',
        body: 'Within six weeks the brand moved from invisible to cited in 18 AI Overviews across their tracked prompt set — with a repeatable workflow saved as artifacts in their workspace.',
      },
    ],
  },
  {
    slug: 'keyword-gaps-to-pageone',
    title: 'Closing a 200-keyword gap against two incumbents',
    client: 'Ecommerce · DTC',
    mode: 'seo',
    summary:
      'A DTC brand used SEO Mode to map the exact keywords two incumbents ranked for, prioritized by winnable difficulty, and rebuilt their content roadmap around the gaps.',
    image: '/marketing/flowintent-modes-hero.png',
    metrics: [
      { label: 'Keyword gaps surfaced', value: '212' },
      { label: 'Prioritized as winnable', value: '64' },
      { label: 'Page-one wins (90d)', value: '23' },
    ],
    sections: [
      {
        heading: 'The gap',
        body: 'Two incumbents dominated the category. The team could not tell which terms were realistically winnable versus a waste of budget.',
      },
      {
        heading: 'The flow',
        body: 'In SEO Mode they ran a live keyword gap analysis backed by DataForSEO, filtered by difficulty and traffic potential, and exported a ranked roadmap as an artifact.',
      },
      {
        heading: 'The result',
        body: 'Focusing only on the winnable 64 terms produced 23 page-one rankings in the first quarter — without chasing the unwinnable head terms.',
      },
    ],
  },
]

export function getCaseStudies(): CaseStudy[] {
  return CASE_STUDIES
}

export function getCaseStudy(slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.slug === slug)
}

export function getCaseStudySlugs(): string[] {
  return CASE_STUDIES.map((c) => c.slug)
}
