import { AuditFlow } from '@/components/audit/AuditFlow'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata = buildPageMetadata({
  title: 'AI Visibility Scorecard | FlowIntent',
  description:
    'See how your brand shows up across Perplexity, Grok, and Gemini, then unlock a shareable AI visibility scorecard with clear next actions.',
  path: '/audit',
  keywords: ['AI visibility audit', 'LLM competitor audit', 'Perplexity citation audit', 'brand visibility'],
})

export default function AuditPage() {
  return <AuditFlow />
}
