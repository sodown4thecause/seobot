import { AuditPageClient } from '@/components/landing/audit-page-client'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata = buildPageMetadata({
  title: 'Free AEO/GEO Audit | FlowIntent',
  description:
    'Run an AEO and GEO audit to identify opportunities for better LLM mentions, citations, and AI search visibility.',
  path: '/audit',
  keywords: ['AEO audit', 'GEO audit', 'AI visibility audit', 'LLM citation audit'],
})

export default function AuditPage() {
  return <AuditPageClient />
}

