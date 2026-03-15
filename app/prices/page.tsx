import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Check } from 'lucide-react'
import { EmailLink } from '@/components/email-link'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'FlowIntent Pricing | AI SEO & AEO Platform',
  description:
    'See FlowIntent pricing for AI SEO and AEO: AI Trust Audits, intent analysis, and content workflows for Google and AI search.',
  path: '/prices',
  keywords: ['AI SEO pricing', 'AEO platform pricing', 'FlowIntent pricing', 'SEO tool pricing'],
})

export default async function PricesPage() {
  const { userId } = await auth()
  const primaryCtaHref = userId
    ? 'https://buy.polar.sh/polar_cl_Fs9CxUkM7bzvADJLGBl3kCE2x9KcfndfYEwF10UXNgW'
    : '/sign-up'
  const primaryCtaLabel = userId ? 'Continue to Polar Checkout' : 'Create Account to Start Trial'

  const pricingFaqs = [
    {
      q: "What's included in the free trial?",
      a: 'You get full access to all Pro features for 30 days. Billing is handled through Polar, and you can cancel before the trial ends.',
    },
    {
      q: 'Can I cancel anytime?',
      a: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.",
    },
    {
      q: 'Do you offer refunds?',
      a: "We offer a 7-day money-back guarantee if you're not satisfied with the service.",
    },
    {
      q: 'Why do LLM "mentions" matter?',
      a: 'Mentions and citations influence trust, clicks, and brand preference in zero-click AI answers.',
    },
  ]

  const pricingSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: 'FlowIntent Pro',
        description: 'AI-powered intent marketing platform for answer engine optimization. Includes AI Trust Audits, buyer intent data analysis, competitor analysis, and automated content creation.',
        brand: { '@type': 'Brand', name: 'FlowIntent' },
        offers: {
          '@type': 'Offer',
          price: '39',
          priceCurrency: 'USD',
          priceValidUntil: '2026-12-31',
          availability: 'https://schema.org/InStock',
          url: 'https://flowintent.com/prices',
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 7,
          },
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: pricingFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.a,
          },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://flowintent.com' },
          { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://flowintent.com/prices' },
        ],
      },
    ],
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <Navbar />

      <div className="container mx-auto px-4 py-16 pt-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start with a 30-day free trial. Billing is handled by Polar.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-16">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 rounded-lg p-8 border border-gray-600 relative overflow-hidden">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$39</span>
                <span className="text-gray-400">/month</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">1 month free trial</p>
            </div>

            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>AI Trust Audits</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Content optimization</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>SEO research tools</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>DataForSEO integration</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Higher usage limits</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Priority support</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Advanced analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Early access to new agents</span>
              </li>
            </ul>

            <Link
              href={primaryCtaHref}
              className="block w-full bg-gray-900 hover:bg-gray-800 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              {primaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Need More?</h2>
          <p className="text-gray-400 mb-6">
            Contact us about Enterprise plans with custom limits, dedicated support, and white-label options.
          </p>
          <EmailLink className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
            Send an Email
          </EmailLink>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">What&apos;s included in the free trial?</h3>
              <p className="text-gray-300">
                You get full access to all Pro features for 30 days. Billing is handled through Polar, and you can cancel before the trial ends.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-300">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-300">
                We offer a 7-day money-back guarantee if you&apos;re not satisfied with the service.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Why do LLM &quot;mentions&quot; matter?</h3>
              <p className="text-gray-300">
                Mentions and citations influence trust, clicks, and brand preference in zero-click AI answers. Read the guide:{' '}
                <Link className="underline hover:text-white" href="/guides/llm-mentions">
                  Why LLM mentions matter
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">
            Questions about pricing or need a custom plan?
          </p>
          <EmailLink className="text-gray-400 hover:text-white">
            Send an Email -&gt;
          </EmailLink>
        </div>
      </div>
    </div>
  )
}
