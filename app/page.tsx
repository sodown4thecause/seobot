import type { Metadata } from 'next'
import { LandingPageClient } from '@/components/landing/landing-page-client'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'Intent-Based Marketing & AI SEO Platform | FlowIntent',
  description:
    'FlowIntent is the AI-powered intent marketing platform for answer engine optimization (AEO). Optimize for Google, ChatGPT, Perplexity and Gemini with AI trust audits, buyer intent analysis, and automated content creation.',
  path: '/',
  keywords: [
    'intent based marketing',
    'answer engine optimization',
    'AI SEO platform',
    'buyer intent data',
    'intent marketing',
    'AEO',
    'ChatGPT SEO',
    'Perplexity SEO',
    'AI content optimizer',
    'AI search optimization',
    'EEAT optimization',
    'LLM citations',
  ],
})

export default function LandingPage() {
  return <LandingPageClient />
}
