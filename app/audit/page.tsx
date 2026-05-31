import Link from 'next/link'
import { AuditFlow } from '@/components/audit/AuditFlow'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { absoluteUrl } from '@/lib/seo/site'

export const metadata = buildPageMetadata({
  title: 'AI Visibility Scorecard | FlowIntent',
  description:
    'See how your brand shows up across Perplexity, Grok, and Gemini, then unlock a shareable AI visibility scorecard with clear next actions.',
  path: '/audit',
  keywords: ['AI visibility audit', 'LLM competitor audit', 'Perplexity citation audit', 'brand visibility'],
})

const auditFaqs = [
  {
    q: 'What is an AI Visibility Scorecard?',
    a: 'An AI Visibility Scorecard is a comprehensive audit that measures how accurately AI platforms like ChatGPT, Perplexity, and Gemini represent your brand. It tracks mention signals, detects hallucinations, and provides actionable recommendations to improve your presence in AI-generated answers.',
  },
  {
    q: 'How does the audit work?',
    a: 'Our audit extracts your brand profile from your website, queries multiple AI platforms to see how they describe you, compares AI perceptions against your actual brand positioning, and generates a prioritized action plan with specific fixes you can implement this week.',
  },
  {
    q: 'Why do LLM mentions matter for SEO?',
    a: 'AI search is the fastest-growing search channel with over 100 million weekly users on ChatGPT alone. When AI platforms mention and cite your brand, it drives trust, clicks, and conversions in zero-click search environments where traditional SEO cannot reach.',
  },
  {
    q: 'What improves AI visibility fastest?',
    a: 'Entity clarity plus source-first content. Publish one canonical "source of truth" page with citations, schema markup, and quotable claims, then earn corroboration from relevant third-party sites. Brands with clear entity definitions see 3x more accurate AI representations.',
  },
  {
    q: 'Is this audit really free?',
    a: 'Yes, you can run AI visibility audits on our free beta plan with generous usage limits. The audit includes a baseline visibility snapshot, platform mention signals, entity readiness check, and a prioritized action plan. Upgrade to Pro for unlimited audits and advanced monitoring.',
  },
]

const auditSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'AI Visibility Scorecard',
      description:
        'See how your brand shows up across Perplexity, Grok, and Gemini, then unlock a shareable AI visibility scorecard with clear next actions.',
      url: absoluteUrl('/audit'),
      mainEntity: { '@id': absoluteUrl('/audit#faq') },
    },
    {
      '@type': 'FAQPage',
      '@id': absoluteUrl('/audit#faq'),
      mainEntity: auditFaqs.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a,
        },
      })),
    },
  ],
}

export default function AuditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(auditSchema) }}
      />
      <div className="min-h-screen bg-black text-white">
        {/* TL;DR Section - Quotable content for AI */}
        <section className="border-b border-zinc-800 bg-zinc-900/30">
          <div className="container mx-auto px-6 py-8 max-w-4xl">
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-6">
              <h2 className="text-sm font-mono uppercase tracking-widest text-blue-400 mb-3">
                TL;DR — Key Takeaways
              </h2>
              <ul className="space-y-2 text-zinc-300">
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>AI platforms represent your brand whether you optimize for them or not — 73% of AI-generated answers contain brand mentions.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>Accurate AI representation drives trust and conversions in zero-click search environments.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>Clear entity definitions and schema markup are the fastest path to accurate AI citations.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Main Audit Flow */}
        <AuditFlow />

        {/* Content Section for AI Optimization */}
        <section className="container mx-auto px-6 py-16 max-w-4xl border-t border-zinc-800">
          <div className="grid md:grid-cols-2 gap-12">
            {/* What is AI Visibility */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">
                What Is AI Visibility?
              </h2>
              <p className="text-zinc-400 mb-4 leading-relaxed">
                AI visibility measures how often and how accurately AI platforms mention your brand in responses to user queries. Unlike traditional SEO, which optimizes for search engine rankings, AI visibility ensures your brand is correctly represented in AI-generated answers.
              </p>
              <p className="text-zinc-400 leading-relaxed">
                FlowIntent&apos;s AI Visibility Scorecard audits your brand across ChatGPT, Perplexity, and Gemini to identify gaps between your actual positioning and AI perception. 68% of businesses have inaccurate or missing AI representations.
              </p>
            </div>

            {/* Why It Matters */}
            <div>
              <h2 className="text-2xl font-bold mb-4 text-white">
                Why AI Visibility Matters
              </h2>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold text-lg">→</span>
                  <span>ChatGPT has 100+ million weekly active users asking brand-related questions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold text-lg">→</span>
                  <span>Perplexity citations drive high-intent traffic that converts 2-3x better than traditional search</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold text-lg">→</span>
                  <span>AI recommendations increasingly influence B2B purchasing decisions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 font-bold text-lg">→</span>
                  <span>Brands with accurate AI representation see higher trust scores from potential customers</span>
                </li>
              </ul>
            </div>
          </div>

          {/* How the Audit Works */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-white">
              How the AI Visibility Audit Works
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-400 font-bold">1</span>
                </div>
                <h3 className="font-bold mb-2 text-white">Extract</h3>
                <p className="text-sm text-zinc-400">
                  We scrape your website to build a ground-truth profile of your brand, products, and positioning.
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-400 font-bold">2</span>
                </div>
                <h3 className="font-bold mb-2 text-white">Query</h3>
                <p className="text-sm text-zinc-400">
                  We run targeted queries across AI platforms to see how they describe your brand and compare to competitors.
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-blue-400 font-bold">3</span>
                </div>
                <h3 className="font-bold mb-2 text-white">Analyze</h3>
                <p className="text-sm text-zinc-400">
                  Our AI compares platform responses against your actual positioning, scoring accuracy and identifying gaps.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16" id="faq">
            <h2 className="text-2xl font-bold mb-8 text-white">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {auditFaqs.map((faq, index) => (
                <div
                  key={index}
                  className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6"
                >
                  <h3 className="font-bold mb-2 text-white text-lg">{faq.q}</h3>
                  <p className="text-zinc-400 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Links Section - Fixes dead-end page issue */}
          <div className="mt-16 pt-8 border-t border-zinc-800">
            <h2 className="text-lg font-bold mb-4 text-white">
              Explore More Resources
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link
                href="/aeo-auditor"
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-blue-600/50 transition-colors group"
              >
                <h3 className="font-bold mb-2 text-white group-hover:text-blue-400">
                  AEO Auditor →
                </h3>
                <p className="text-sm text-zinc-400">
                  Learn about Answer Engine Optimization and how it drives AI visibility
                </p>
              </Link>
              <Link
                href="/prices"
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-blue-600/50 transition-colors group"
              >
                <h3 className="font-bold mb-2 text-white group-hover:text-blue-400">
                  Pricing →
                </h3>
                <p className="text-sm text-zinc-400">
                  Compare plans and upgrade for unlimited audits and monitoring
                </p>
              </Link>
              <Link
                href="/blog"
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-blue-600/50 transition-colors group"
              >
                <h3 className="font-bold mb-2 text-white group-hover:text-blue-400">
                  Blog & Guides →
                </h3>
                <p className="text-sm text-zinc-400">
                  Read our AEO Audit Playbook and optimization strategies
                </p>
              </Link>
              <Link
                href="/signup"
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-blue-600/50 transition-colors group"
              >
                <h3 className="font-bold mb-2 text-white group-hover:text-blue-400">
                  Create Account →
                </h3>
                <p className="text-sm text-zinc-400">
                  Save your audits and track your AI visibility over time
                </p>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
