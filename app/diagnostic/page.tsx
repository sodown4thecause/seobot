import { buildPageMetadata } from '@/lib/seo/metadata'

import { DiagnosticPageClient } from './diagnostic-page-client'

export const metadata = buildPageMetadata({
  title: 'Free AI Trust Audit | FlowIntent',
  description:
    'See how ChatGPT, Perplexity, and Google AI describe your brand, then get an instant AI Influence Snapshot.',
  path: '/diagnostic',
  keywords: [
    'AI trust audit',
    'AI influence diagnostic',
    'LLM citation audit',
    'brand perception audit',
  ],
})

export default function DiagnosticPage() {
  return <DiagnosticPageClient />
}
