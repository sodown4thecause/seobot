import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'AEO Audit Playbook (2026): Earn More ChatGPT & Perplexity Mentions | FlowIntent',
  description:
    'A practical guide to increasing LLM mentions and citations using entity clarity, source-first content, schema, and repeatable monitoring. Includes a 30-day plan.',
  keywords: [
    'AEO audit',
    'answer engine optimization',
    'LLM mentions',
    'ChatGPT mentions',
    'Perplexity citations',
    'AI search optimization',
    'schema',
    'EEAT',
  ],
}

const faqs = [
  {
    q: 'Can you really track “mentions in ChatGPT” and Perplexity?',
    a: 'Not as a perfect global counter. Any “mentions” metric is a repeatable proxy based on sampled prompts, model endpoints, and datasets. The value is tracking improvement week-over-week, not absolute totals.',
  },
  {
    q: 'What is the fastest way to increase mentions and citations?',
    a: 'Publish one “source of truth” page with a crisp definition, 10+ referenced claims, tight formatting (lists/tables/FAQs), and the right schema. Then distribute it so other sites corroborate it.',
  },
  {
    q: 'Do backlinks still matter for AEO?',
    a: 'Yes, but they matter most when they validate your identity (entity corroboration) and cite your data. Random directory links are far less useful than niche, relevant citations.',
  },
  {
    q: 'What should I fix first if AI is hallucinating about my brand?',
    a: 'Create an “AI facts” page (or upgrade your About/Product pages) with verifiable claims, citations, and a visible update cadence. Then correct third‑party listings that spread wrong information.',
  },
  {
    q: 'Do I need to block AI crawlers?',
    a: 'Usually no. If your goal is to earn mentions and citations, you want your best “answer assets” to be crawlable and easy to parse.',
  },
]

export default function AEOAuditPlaybookPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-16 pt-32 max-w-4xl">
        <div className="mb-10">
          <Link href="/guides" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Guides
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">The AEO Audit Playbook (2026)</h1>
          <p className="text-xl text-gray-400">
            How to earn more ChatGPT + Perplexity mentions and become cite‑worthy.
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-800/50 mb-10">
          <h2 className="text-2xl font-bold mb-3">Start with a baseline</h2>
          <p className="text-gray-300 mb-6">
            Run the free AEO audit to see how AI platforms currently describe your brand and where you’re losing
            mentions.
          </p>
          <div className="flex gap-4 flex-wrap">
            <Link
              href="/audit"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Run Free AEO Audit
            </Link>
            <Link
              href="/prices"
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              See Pricing
            </Link>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <h2 className="text-3xl font-bold mt-12 mb-4">What is an AEO audit?</h2>
          <p className="text-gray-300 leading-relaxed">
            An Answer Engine Optimization (AEO) audit checks whether AI systems can identify your brand, repeat your
            facts accurately, and cite your pages as sources. Traditional SEO audits focus on rankings; AEO audits focus
            on being the answer.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4">What “LLM mentions” means</h2>
          <ul className="text-gray-300 space-y-2">
            <li>
              <strong>Mentions:</strong> the model references your brand in its answer.
            </li>
            <li>
              <strong>Citations:</strong> the model links to your domain as a source.
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            Any “mentions” metric is a proxy. The key is using a repeatable baseline so you can measure improvement
            over time.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4">The levers that increase mentions</h2>
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <ul className="text-gray-300 space-y-3">
              <li>
                <strong>Entity clarity:</strong> a canonical About/Product identity + Organization schema + consistent
                facts everywhere.
              </li>
              <li>
                <strong>Source-first content:</strong> benchmarks, definitions, and quotable claims backed by citations.
              </li>
              <li>
                <strong>Retrieval-friendly structure:</strong> direct answers, lists/tables, FAQs, and relevant schema.
              </li>
              <li>
                <strong>Corroboration:</strong> third-party mentions that repeat your facts and cite your data.
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4">A 30-day implementation plan</h2>
          <ol className="text-gray-300 space-y-2">
            <li>
              <strong>Week 1:</strong> fix identity + truth (About, schema, facts, screenshots).
            </li>
            <li>
              <strong>Week 2:</strong> publish 1 definition + 1 comparison + 1 checklist (answer assets).
            </li>
            <li>
              <strong>Week 3:</strong> ship a proof asset (benchmark/dataset) and add “last updated” + changelog.
            </li>
            <li>
              <strong>Week 4:</strong> distribute and re-run the audit; track deltas and iterate.
            </li>
          </ol>

          <h2 className="text-3xl font-bold mt-12 mb-4">How to upsell without being pushy</h2>
          <p className="text-gray-300 leading-relaxed">
            A conversion-friendly flow is: <strong>diagnosis → prescription → implementation</strong>. The audit gives a
            clear diagnosis. The report should map each fix to a workflow or feature that helps the user execute faster.
          </p>
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <ul className="text-gray-300 space-y-2">
              <li>
                Low entity recognition → <strong>generate Organization/Product/FAQ schema</strong>
              </li>
              <li>
                Hallucinations → <strong>publish corrective, cited EEAT pages</strong>
              </li>
              <li>
                Low citation strength → <strong>data-led assets + internal linking</strong>
              </li>
              <li>
                No repeatable process → <strong>monitoring + scheduled refreshes</strong>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-800/50 mt-12">
            <h2 className="text-2xl font-bold mb-4">Get your baseline in minutes</h2>
            <p className="text-gray-300 mb-6">
              Run the free AEO audit to see platform mentions, entity signals, and a prioritized action plan.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/audit"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Run Free AEO Audit
              </Link>
              <Link
                href="/aeo-auditor"
                className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                AEO Auditor Overview
              </Link>
            </div>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-6">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="bg-gray-800/30 rounded-lg p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold mb-2">{f.q}</h3>
                <p className="text-gray-300">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
