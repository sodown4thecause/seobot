import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Documentation - How FlowIntent Works | FlowIntent',
  description: 'Learn how FlowIntent optimizes for traditional search engines and AI answer engines. Platform architecture, features, and technical documentation.',
}

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Documentation
          </h1>
          <p className="text-xl text-gray-400">
            Learn how FlowIntent works and how to get the most out of the platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">Platform Overview</h2>
            <p className="text-gray-300 mb-4">
              FlowIntent combines specialized AI agents with 70+ DataForSEO API endpoints to deliver research-driven, EEAT-optimized content that ranks in both search engines and AI answer engines.
            </p>
            <Link href="/guides/answer-engine-optimization" className="text-blue-400 hover:text-blue-300">
              Learn about AEO →
            </Link>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Quick Start</h2>
            <p className="text-gray-300 mb-4">
              Get started with FlowIntent in minutes. Run an AI Trust Audit to see how AI chatbots represent your brand, then explore content optimization features.
            </p>
            <Link href="/audit" className="text-blue-400 hover:text-blue-300">
              Get Free AI Trust Audit →
            </Link>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Core Features</h2>
          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-bold mb-2">AI Trust Audits</h3>
              <p className="text-gray-300">
                Discover how AI chatbots like ChatGPT, Perplexity, and Claude represent your brand. Identify hallucinations, incorrect information, and gaps in AI knowledge about your business.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border-l-4 border-purple-500">
              <h3 className="text-xl font-bold mb-2">Multi-Agent SEO Intelligence</h3>
              <p className="text-gray-300">
                Specialized research agents gather and analyze SEO data from 70+ DataForSEO endpoints, then seamlessly hand off to content writing agents that create optimized articles.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border-l-4 border-green-500">
              <h3 className="text-xl font-bold mb-2">EEAT-Focused Content Quality</h3>
              <p className="text-gray-300">
                Measure and optimize content against concrete EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) metrics. Improve quality scores from 35 to 85+ in just a few iterations.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border-l-4 border-yellow-500">
              <h3 className="text-xl font-bold mb-2">Answer Engine Optimization</h3>
              <p className="text-gray-300">
                Optimize content specifically for AI search engines like Perplexity, ChatGPT, and Gemini by analyzing how these platforms structure and surface information.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6 border-l-4 border-red-500">
              <h3 className="text-xl font-bold mb-2">RAG-Powered Knowledge Base</h3>
              <p className="text-gray-300">
                Build institutional knowledge that improves with every project. Reference previous research, maintain consistent brand voice, and leverage past competitive analysis.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">How It Works</h2>
          <div className="bg-gray-800/50 rounded-lg p-8">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Conversational Interface</h3>
                  <p className="text-gray-300">
                    Interact with specialized AI agents through natural language. Ask questions, request research, or generate content—no technical knowledge required.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Intelligent Routing</h3>
                  <p className="text-gray-300">
                    FlowIntent automatically routes queries to the right specialist agent—research, writing, or both—based on context and need.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Data-Driven Insights</h3>
                  <p className="text-gray-300">
                    Access real-time SERP data, search intent analysis, competitor intelligence, and AI search trends through 70+ DataForSEO endpoints.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center font-bold">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Optimized Output</h3>
                  <p className="text-gray-300">
                    Receive content that ranks in Google while ensuring accurate representation in AI answer engines like ChatGPT and Perplexity.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 rounded-lg p-6 border border-blue-700/50">
            <h3 className="text-xl font-bold mb-3">Guides</h3>
            <p className="text-gray-300 mb-4">
              In-depth tutorials on AEO, SEO strategies, and platform features.
            </p>
            <Link href="/guides" className="text-blue-400 hover:text-blue-300">
              Browse Guides →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-lg p-6 border border-purple-700/50">
            <h3 className="text-xl font-bold mb-3">FAQ</h3>
            <p className="text-gray-300 mb-4">
              Common questions about AEO, FlowIntent, and AI search optimization.
            </p>
            <Link href="/faq" className="text-purple-400 hover:text-purple-300">
              View FAQ →
            </Link>
          </div>

          <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-lg p-6 border border-green-700/50">
            <h3 className="text-xl font-bold mb-3">Support</h3>
            <p className="text-gray-300 mb-4">
              Need help? Get in touch with our team for personalized assistance.
            </p>
            <Link href="/contact" className="text-green-400 hover:text-green-300">
              Contact Us →
            </Link>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-800/50 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-gray-300 mb-6">
            Sign up for free beta access and discover how AI represents your brand.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/audit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Get Free AI Trust Audit
            </Link>
            <Link
              href="/prices"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

