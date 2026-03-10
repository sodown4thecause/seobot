import { AuditFlow } from '@/components/audit/AuditFlow'
import { buildPageMetadata } from '@/lib/seo/metadata'
import Link from 'next/link'

export const metadata = buildPageMetadata({
  title: 'AI Visibility Audit | FlowIntent',
  description:
    'Find out whether AI buyers are seeing your brand or your competitors across Perplexity, Grok, and Gemini.',
  path: '/audit',
  keywords: ['AI visibility audit', 'LLM competitor audit', 'Perplexity citation audit', 'brand visibility'],
})

export default function AuditPage() {
  return (
    <>
      <AuditFlow />
      <section className="border-t border-white/10 bg-black px-4 py-8 text-zinc-300 md:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Related resources</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/guides/llm-mentions" className="hover:text-white transition-colors">
              Why LLM Mentions Matter
            </Link>
            <Link href="/guides/aeo-audit-playbook" className="hover:text-white transition-colors">
              AEO Audit Playbook
            </Link>
            <Link href="/guides/answer-engine-optimization" className="hover:text-white transition-colors">
              Answer Engine Optimization Guide
            </Link>
            <Link href="/resources" className="hover:text-white transition-colors">
              SEO Resources and Templates
            </Link>
            <Link href="/case-studies" className="hover:text-white transition-colors">
              Case Studies
            </Link>
            <Link href="/prices" className="hover:text-white transition-colors">
              Pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
