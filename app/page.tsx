import type { Metadata } from 'next'
import { Suspense } from 'react'
import Script from 'next/script'
import { AuthErrorRedirect } from '@/components/landing/landing-page-client'
import { LandingPageContent } from '@/components/landing/landing-page-content'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { faqSchema } from '@/lib/faq'

export const metadata: Metadata = buildPageMetadata({
  title: 'Intent-Based Marketing & AI SEO Platform | FlowIntent',
  description:
    'FlowIntent unifies SEO, GEO and AEO research for Google, ChatGPT, Perplexity and Google AI Overviews, with live data and content workflows.',
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
  return (
    <>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPageContent />
      <Suspense fallback={null}>
        <AuthErrorRedirect />
      </Suspense>
    </>
  )
}
