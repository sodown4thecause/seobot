import { AuditFlow } from '@/components/audit/AuditFlow'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata = buildPageMetadata({
  title: 'AI Visibility Audit | FlowIntent',
  description:
    'Find out whether AI buyers are seeing your brand or your competitors across Perplexity, Grok, and Gemini.',
  path: '/audit',
  keywords: ['AI visibility audit', 'LLM competitor audit', 'Perplexity citation audit', 'brand visibility'],
})

export default function AuditPage() {
  return <AuditFlow />
}
