import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SEO & AEO Guides | FlowIntent',
  description: 'Learn how to optimize for traditional search engines and AI answer engines. Comprehensive guides on AEO, GEO, ChatGPT SEO, and modern search optimization.',
}

export default function GuidesPage() {
  const guides = [
    {
      title: 'Answer Engine Optimization (AEO)',
      description: 'Complete guide to optimizing for AI search engines like ChatGPT, Perplexity, and Gemini. Learn the fundamentals of AEO and why it matters for modern SEO.',
      href: '/guides/answer-engine-optimization',
      category: 'Fundamentals',
      readTime: '10 min read',
    },
    {
      title: 'AEO vs GEO: Understanding the Difference',
      description: 'Learn the key differences between Answer Engine Optimization and Generative Engine Optimization, and when to use each strategy.',
      href: '/guides/aeo-vs-geo',
      category: 'Strategy',
      readTime: '8 min read',
    },
    {
      title: 'ChatGPT SEO: Optimization Guide',
      description: 'How to optimize your content for ChatGPT search and ensure accurate citations in AI-generated answers.',
      href: '/guides/chatgpt-seo',
      category: 'Platform-Specific',
      readTime: '12 min read',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            SEO & AEO Guides
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Master the art of optimizing for both traditional search engines and AI answer engines. 
            Learn strategies that work in the age of AI search.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {guides.map((guide, idx) => (
            <Link
              key={idx}
              href={guide.href}
              className="bg-gray-800/50 hover:bg-gray-800 rounded-lg p-6 transition-all border border-gray-700 hover:border-blue-500 group"
            >
              <div className="mb-3">
                <span className="text-sm text-blue-400 font-semibold">
                  {guide.category}
                </span>
                <span className="text-sm text-gray-500 ml-3">
                  {guide.readTime}
                </span>
              </div>
              <h2 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors">
                {guide.title}
              </h2>
              <p className="text-gray-400 leading-relaxed">
                {guide.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-800/50">
          <h2 className="text-2xl font-bold mb-4">New to Answer Engine Optimization?</h2>
          <p className="text-gray-300 mb-6">
            Start with our foundational guide to understand how AI search engines work and why AEO is critical for modern SEO strategy.
          </p>
          <Link
            href="/guides/answer-engine-optimization"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Start with AEO Basics →
          </Link>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 mb-4">
            Want hands-on help optimizing your content?
          </p>
          <Link
            href="/audit"
            className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Get Your Free AI Trust Audit
          </Link>
        </div>
      </div>
    </div>
  )
}

