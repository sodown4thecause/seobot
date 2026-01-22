import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Why LLM Mentions Matter (2026): The New SEO KPI | FlowIntent',
  description:
    'A practical guide to why LLM mentions and citations matter, how to measure them, and the levers that increase your visibility in AI answers.',
  keywords: [
    'LLM mentions',
    'AI citations',
    'answer engine optimization',
    'AEO',
    'ChatGPT mentions',
    'Perplexity citations',
    'AI Overviews',
    'brand visibility',
  ],
}

export default function LLMMentionsGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-16 pt-32 max-w-4xl">
        <div className="mb-12">
          <Link href="/guides" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Guides
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Why LLM Mentions Matter (and how to earn more)
          </h1>
          <p className="text-xl text-gray-400">
            The KPI that shows up before traffic—and often replaces it.
          </p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6 mb-10">
            <p className="text-lg mb-0">
              In AI answers, the user often never sees a SERP. If you are not named (and ideally cited), you are not in
              the consideration set.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4">Mentions vs citations</h2>
          <ul className="text-gray-300 space-y-2">
            <li>
              <strong>LLM mention:</strong> the model references your brand or product in its answer.
            </li>
            <li>
              <strong>Citation:</strong> the model links to your site as a source (best-case).
            </li>
          </ul>
          <p className="text-gray-300 leading-relaxed mt-4">
            Citations drive measurable clicks. Mentions drive recall and preference (and often precede citations). You
            want both.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4">Why mentions matter so much now</h2>
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <ul className="text-gray-300 space-y-3">
              <li>
                <strong>Zero-click answers:</strong> the “result” is a response, not a list of links.
              </li>
              <li>
                <strong>Shortlists:</strong> LLMs commonly recommend 3–7 options. Being named is the new page-one.
              </li>
              <li>
                <strong>Trust transfer:</strong> users borrow the model’s confidence. If it cites you, you inherit
                credibility.
              </li>
              <li>
                <strong>Compounding brand effect:</strong> repeated exposure across prompts builds preference even when
                clicks are low.
              </li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4">How to measure LLM mentions (the right way)</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            There is no perfect global counter for “mentions in ChatGPT”. The useful metric is a repeatable proxy:
          </p>
          <ol className="text-gray-300 space-y-2">
            <li>
              Build a prompt set by <strong>topic</strong> and <strong>intent</strong> (informational, comparison, buyer,
              troubleshooting).
            </li>
            <li>Run the same prompts weekly (same model + settings where possible).</li>
            <li>Record who gets mentioned, who gets cited, and what claims are repeated.</li>
            <li>Track deltas: more mentions, more citations, fewer hallucinations.</li>
          </ol>
          <p className="text-gray-300 leading-relaxed mt-4">
            FlowIntent’s AI Trust Audit is designed for this baseline-and-delta workflow.
          </p>

          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-800/50 mt-10">
            <h3 className="text-2xl font-bold mb-4">Get a baseline in minutes</h3>
            <p className="text-gray-300 mb-6">
              Run a free AI Trust Audit to see how AI platforms describe your brand and what to fix first.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/audit"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Run Free Audit
              </Link>
              <Link
                href="/prices"
                className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                See Pricing
              </Link>
            </div>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4">The levers that increase mentions</h2>
          <h3 className="text-2xl font-bold mt-8 mb-3">1) Entity clarity</h3>
          <p className="text-gray-300 leading-relaxed">
            Make it unambiguous who you are. Keep your name, positioning, and core facts consistent across your About,
            Product, pricing, and schema. Models struggle with inconsistencies.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-3">2) Source-first “answer assets”</h3>
          <p className="text-gray-300 leading-relaxed">
            Publish one canonical page per major question: crisp definition, clear structure, quotable bullets, and
            referenced claims. LLMs prefer clean extraction.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-3">3) Corroboration (third-party validation)</h3>
          <p className="text-gray-300 leading-relaxed">
            Mentions increase when other credible sites repeat the same facts about you. The goal is corroboration, not
            random links.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-3">4) Retrieval-friendly formatting</h3>
          <p className="text-gray-300 leading-relaxed">
            Use direct answers, lists, tables, FAQs, and clean HTML. The easier your content is to parse, the more
            likely it becomes a source.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4">What to do next</h2>
          <ul className="text-gray-300 space-y-2">
            <li>
              Read the implementation checklist: <Link className="text-blue-400 hover:text-blue-300" href="/guides/aeo-audit-playbook">AEO Audit Playbook</Link>
            </li>
            <li>
              Learn the foundations: <Link className="text-blue-400 hover:text-blue-300" href="/guides/answer-engine-optimization">What is AEO?</Link>
            </li>
            <li>
              Establish your baseline: <Link className="text-blue-400 hover:text-blue-300" href="/audit">Run an AI Trust Audit</Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

