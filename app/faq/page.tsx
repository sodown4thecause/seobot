import type { Metadata } from 'next'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'FAQ - Frequently Asked Questions | FlowIntent',
  description: 'Get answers to common questions about Answer Engine Optimization (AEO), AI search visibility, and the FlowIntent platform.',
}

export default function FAQPage() {
  type FaqLink = { label: string; href: string }
  type FaqItem = { q: string; a: string; links?: FaqLink[] }
  type FaqSection = { category: string; questions: FaqItem[] }

  const faqs: FaqSection[] = [
    {
      category: 'LLM Mentions & Citations',
      questions: [
        {
          q: 'What are “LLM mentions” and “citations”?',
          a: 'A mention is when an AI assistant references your brand in its answer. A citation is when it links to your site as a source. Citations are ideal, but consistent mentions also build recall and preference.',
        },
        {
          q: 'Why do LLM mentions matter for growth?',
          a: 'AI answers are often zero-click. The “winner” is the brand named (and cited) in the response. Mentions influence trust, shortlist inclusion, and downstream conversions—even when users never visit a SERP.',
        },
        {
          q: 'How do you measure mentions if there is no global counter?',
          a: 'You run a repeatable set of prompts (by topic + intent), record who gets mentioned/cited, and track deltas over time. The goal is consistent improvement, not a perfect absolute number.',
        },
        {
          q: 'Where can I learn the full strategy?',
          a: 'Start with the guide, then run an AI Trust Audit to establish your baseline and prioritize fixes.',
          links: [
            { label: 'Read the guide', href: '/guides/llm-mentions' },
            { label: 'Run an audit', href: '/audit' },
          ],
        },
      ],
    },
    {
      category: 'Answer Engine Optimization',
      questions: [
        {
          q: 'What is Answer Engine Optimization (AEO)?',
          a: 'Answer Engine Optimization (AEO) is the practice of optimizing content to rank in AI-powered answer engines like ChatGPT, Perplexity, Claude, and Google Gemini. Unlike traditional SEO which focuses on search engine rankings, AEO ensures your content is accurately cited and referenced when AI assistants answer user questions.',
        },
        {
          q: 'How is AEO different from traditional SEO?',
          a: 'Traditional SEO focuses on ranking in search results pages (SERPs) to drive clicks and traffic. AEO focuses on being the cited source in AI-generated answers, as AI keeps users on-platform. AEO requires structured data, clear entity relationships, and EEAT signals that AI models can understand and trust.',
        },
        {
          q: 'Why do I need AEO if I already do SEO?',
          a: 'AI answer engines (ChatGPT, Perplexity, Claude) and Google’s AI Overviews are changing how people discover information. More queries end in an on-platform answer instead of a click. If you’re not optimized for these systems, you’re invisible to a rapidly growing segment of demand—even if you rank #1 on Google.',
        },
      ],
    },
    {
      category: 'FlowIntent Platform',
      questions: [
        {
          q: 'What does FlowIntent do?',
          a: 'FlowIntent is an AI-powered SEO platform that optimizes for both traditional search engines (Google, Bing) and AI answer engines (ChatGPT, Perplexity, Gemini). We provide AI Trust Audits to show how AI represents your brand, automated content optimization, and competitor analysis tailored for the AI search era.',
        },
        {
          q: 'What is an AI Trust Audit?',
          a: 'An AI Trust Audit reveals how AI chatbots like ChatGPT and Perplexity represent your brand, products, and services. It identifies hallucinations, incorrect information, and gaps in AI knowledge about your business. This lets you fix data issues before they damage your reputation.',
        },
        {
          q: 'How does FlowIntent optimize content?',
          a: 'FlowIntent uses specialized AI agents combined with 70+ DataForSEO endpoints to analyze your content and competitors. We measure EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) signals, identify content gaps, and generate optimized content that ranks in both Google and AI answer engines.',
        },
        {
          q: 'Do I need technical skills to use FlowIntent?',
          a: 'No. FlowIntent is designed for marketers, content creators, and business owners. Our conversational AI interface guides you through audits, research, and content optimization without requiring technical SEO knowledge or coding skills.',
        },
      ],
    },
    {
      category: 'Pricing & Plans',
      questions: [
        {
          q: 'How much does FlowIntent cost?',
          a: 'We currently offer free beta access with usage limits ($1 in API usage per week). A Pro plan at $40/month is coming soon with higher limits, priority support, and more advanced features. Enterprise plans with custom limits are available on request.',
        },
        {
          q: 'What happens when I hit my beta usage limit?',
          a: 'When you reach the $1 beta limit, your account is paused for 7 days. You can email support@flowintent.com to request an upgrade or early access to Pro.',
        },
        {
          q: 'Can I upgrade from the free beta?',
          a: 'Yes. Contact us at support@flowintent.com to discuss Pro or Enterprise options. We’re granting early access to users who need higher limits.',
        },
      ],
    },
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I get started with FlowIntent?',
          a: 'Sign up for a free account and start with an AI Trust Audit. Simply enter your brand name or website, and we\'ll show you how AI chatbots currently represent you. From there, you can explore content optimization, competitor analysis, and AEO strategies.',
        },
        {
          q: 'What data sources does FlowIntent use?',
          a: 'FlowIntent integrates with DataForSEO (70+ endpoints for keyword research, SERP analysis, and competitive intelligence), Perplexity\'s Sonar model for live AI search data, and our proprietary EEAT scoring system. All data is research-backed and verified.',
        },
        {
          q: 'Can FlowIntent help with my existing content?',
          a: 'Absolutely. FlowIntent can audit and optimize existing content to improve both traditional SEO performance and AI answer engine visibility. We identify EEAT gaps, structural issues, and opportunities to enhance citations in AI-generated answers.',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-16 pt-32 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-400">
            Everything you need to know about Answer Engine Optimization and FlowIntent
          </p>
        </div>

        <div className="space-y-12">
          {faqs.map((section, idx) => (
            <div key={idx} className="border-t border-gray-800 pt-8">
              <h2 className="text-2xl font-bold mb-6 text-blue-400">
                {section.category}
              </h2>
              <div className="space-y-6">
                {section.questions.map((faq, qIdx) => (
                  <div key={qIdx} className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3 text-white">
                      {faq.q}
                    </h3>
                    <p className="text-gray-300 leading-relaxed">
                      {faq.a}
                    </p>
                    {faq.links && faq.links.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {faq.links.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-4"
                          >
                            {l.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-gray-800/50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
          <p className="text-gray-400 mb-6">
            Can't find the answer you're looking for? Get in touch with our team.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/contact"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/docs"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

