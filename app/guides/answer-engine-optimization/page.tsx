import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Answer Engine Optimization (AEO) Guide | FlowIntent',
  description: 'Complete guide to Answer Engine Optimization. Learn how to optimize content for ChatGPT, Perplexity, Claude, and other AI search engines.',
  keywords: ['answer engine optimization', 'AEO', 'AI search optimization', 'ChatGPT SEO', 'Perplexity optimization'],
}

export default function AEOGuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-16 pt-32 max-w-4xl">
        <div className="mb-12">
          <Link href="/guides" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Guides
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            What is Answer Engine Optimization (AEO)?
          </h1>
          <p className="text-xl text-gray-400">
            The complete guide to optimizing for AI search engines
          </p>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6 mb-8">
            <p className="text-lg mb-0">
              <strong>Answer Engine Optimization (AEO)</strong> is the practice of optimizing content to be accurately cited and referenced by AI-powered answer engines like ChatGPT, Perplexity, Claude, and Google Gemini.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4">Why AEO Matters in 2025</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            The way people search for information is fundamentally changing. Millions of searches now happen directly in AI chat interfaces rather than traditional search engines. According to recent data:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li>ChatGPT processes over 100 million searches per day</li>
            <li>Perplexity has grown to 15+ million monthly active users</li>
            <li>Google's AI Overviews now appear for 15% of search queries</li>
            <li>Users increasingly trust AI-generated answers over traditional search results</li>
          </ul>
          <p className="text-gray-300 leading-relaxed mb-6">
            <strong>If you're not optimized for AI answer engines, you're invisible to this rapidly growing segment of searchers</strong>—even if you rank #1 on Google.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4">AEO vs Traditional SEO</h2>
          <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-bold mb-3 text-blue-400">Traditional SEO</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>✓ Focus: Rankings in SERPs</li>
                  <li>✓ Goal: Drive clicks and traffic</li>
                  <li>✓ Optimization: Keywords, backlinks, technical SEO</li>
                  <li>✓ Success metric: Position #1, organic traffic</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 text-purple-400">Answer Engine Optimization</h3>
                <ul className="text-gray-300 space-y-2 text-sm">
                  <li>✓ Focus: Citations in AI answers</li>
                  <li>✓ Goal: Be the trusted source</li>
                  <li>✓ Optimization: Entity clarity, EEAT signals, structured data</li>
                  <li>✓ Success metric: Citation frequency, answer accuracy</li>
                </ul>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4">Core AEO Principles</h2>
          
          <h3 className="text-2xl font-bold mt-8 mb-3">1. Entity Clarity & Disambiguation</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            AI models need to understand <em>what</em> your business is and <em>how</em> it relates to other entities. Use clear, consistent entity definitions across all content. Implement structured data (Schema.org) to disambiguate your brand from competitors.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-3">2. EEAT Signals</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            AI engines prioritize content with strong <strong>E</strong>xperience, <strong>E</strong>xpertise, <strong>A</strong>uthoritativeness, and <strong>T</strong>rustworthiness signals. This includes author credentials, citations to authoritative sources, and transparent about-us information.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-3">3. Answer-First Content Structure</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Structure content to directly answer questions. Lead with concise, factual answers before expanding into detail. Use clear headings that mirror natural language queries.
          </p>

          <h3 className="text-2xl font-bold mt-8 mb-3">4. Crawlable & Machine-Readable</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Ensure AI crawlers can access and parse your content. Avoid blocking LLM bots in robots.txt, provide clean HTML structure, and consider creating an <code className="bg-gray-800 px-2 py-1 rounded">/llms.txt</code> file to guide AI models to your most important content.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-4">How to Implement AEO</h2>
          
          <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Step 1: Audit Your AI Visibility</h3>
            <p className="text-gray-300 mb-4">
              Start by understanding how AI currently represents your brand. Ask ChatGPT, Perplexity, and Claude about your products, services, and company. Identify hallucinations, gaps, and inaccuracies.
            </p>
            <Link href="/audit" className="text-blue-400 hover:text-blue-300">
              → Get a Free AI Trust Audit
            </Link>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Step 2: Optimize Entity Data</h3>
            <p className="text-gray-300 mb-4">
              Implement structured data markup (JSON-LD) for your Organization, Products, and key entities. Ensure consistent NAP (Name, Address, Phone) citations across the web. Build authoritative backlinks from trusted sources.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Step 3: Create Answer-Optimized Content</h3>
            <p className="text-gray-300 mb-4">
              Write content that directly answers user questions with clear, factual information. Use FAQ schemas, concise summaries, and authoritative citations. Optimize for featured snippets—they often become AI answer sources.
            </p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4">Step 4: Monitor & Iterate</h3>
            <p className="text-gray-300 mb-4">
              Continuously monitor how AI engines cite your content. Track citation frequency, answer accuracy, and brand sentiment in AI responses. Adjust your strategy based on what works.
            </p>
          </div>

          <h2 className="text-3xl font-bold mt-12 mb-4">Common AEO Mistakes to Avoid</h2>
          <ul className="text-gray-300 space-y-3 mb-8">
            <li><strong>Blocking AI crawlers:</strong> Don't disallow GPTBot, ClaudeBot, or PerplexityBot unless you have a specific reason. This makes you invisible to AI search.</li>
            <li><strong>Over-optimization for keywords:</strong> AI models understand context and semantics better than keyword density. Focus on clarity and expertise, not keyword stuffing.</li>
            <li><strong>Ignoring EEAT signals:</strong> AI engines heavily weight trustworthiness. Weak author credentials or lack of citations will hurt your visibility.</li>
            <li><strong>Assuming SEO = AEO:</strong> Traditional SEO tactics don't always translate to AEO. You need a dedicated strategy for AI answer engines.</li>
          </ul>

          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-800/50 mt-12">
            <h2 className="text-2xl font-bold mb-4">Ready to Optimize for AI Search?</h2>
            <p className="text-gray-300 mb-6">
              FlowIntent automates AEO with AI-powered audits, content optimization, and competitive analysis. See how AI represents your brand and get actionable recommendations.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                href="/audit"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Get Free AI Trust Audit
              </Link>
              <Link
                href="/guides"
                className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                View More Guides
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

