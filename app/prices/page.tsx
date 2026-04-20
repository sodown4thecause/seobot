import type { Metadata } from 'next'
import { auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { Check, Lock } from 'lucide-react'
import { EmailLink } from '@/components/email-link'
import {
  FLOWINTENT_PRO_PRICE,
  FLOWINTENT_PRO_PRICE_VALUE,
  FLOWINTENT_TRIAL_LABEL,
} from '@/lib/billing/pricing'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata: Metadata = buildPageMetadata({
  title: 'FlowIntent Pricing | AI SEO & AEO Platform',
  description:
    'See FlowIntent pricing for AI SEO and AEO: AI Trust Audits, intent analysis, and content workflows for Google and AI search.',
  path: '/prices',
  keywords: ['AI SEO pricing', 'AEO platform pricing', 'FlowIntent pricing', 'SEO tool pricing'],
})

interface PricesPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function PricesPage({ searchParams }: PricesPageProps) {
  const { userId } = await auth()
  const params = await searchParams
  const requiresSubscription = params.requires_subscription === '1'
  const primaryCtaHref = userId ? '/billing/checkout' : '/sign-up'
  const primaryCtaLabel = userId ? 'Continue to checkout' : 'Start 30-day free trial'

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
          price: FLOWINTENT_PRO_PRICE_VALUE,
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
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <Navbar />

      <main className="container mx-auto px-6 pt-32 pb-20">
        {requiresSubscription && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 flex items-start gap-4">
              <Lock className="h-6 w-6 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-semibold text-yellow-100 mb-1">
                  Subscription Required
                </h2>
                <p className="text-yellow-200/80">
                  The dashboard requires an active subscription. Start your {FLOWINTENT_TRIAL_LABEL.toLowerCase()} to access all features.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Simple Pricing for AI Visibility
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            {FLOWINTENT_TRIAL_LABEL}, then {FLOWINTENT_PRO_PRICE}/month. Billing is handled by Polar.
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-16">
          <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 text-xs font-semibold bg-white/10 text-zinc-300 rounded-full uppercase tracking-wider">
                  Pro
                </span>
                <span className="text-xs text-zinc-500">{FLOWINTENT_TRIAL_LABEL}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">{FLOWINTENT_PRO_PRICE}</span>
                <span className="text-zinc-400">/month</span>
              </div>
              <p className="text-sm text-zinc-400 mt-2">
                Start your free trial now, then keep full access for {FLOWINTENT_PRO_PRICE} per month.
              </p>
            </div>

            <ul className="space-y-3 mb-8 text-zinc-300">
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
              className="block w-full rounded-full bg-white text-black text-center px-6 py-3 font-semibold transition-colors hover:bg-zinc-200"
            >
              {primaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Need More?</h2>
          <p className="text-zinc-400 mb-6">
            Contact us about Enterprise plans with custom limits, dedicated support, and white-label options.
          </p>
          <EmailLink className="inline-block rounded-full border border-white/10 bg-white/[0.03] px-6 py-3 font-semibold text-white transition-colors hover:bg-white/[0.08]">
            Send an Email
          </EmailLink>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-2">What&apos;s included in the free trial?</h3>
              <p className="text-zinc-300">
                You get full access to all Pro features for 30 days. Billing is handled through Polar, and you can cancel before the trial ends.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-2">Can I cancel anytime?</h3>
              <p className="text-zinc-300">
                Yes, you can cancel your subscription at any time. You&apos;ll continue to have access until the end of your billing period.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-2">Do you offer refunds?</h3>
              <p className="text-zinc-300">
                We offer a 7-day money-back guarantee if you&apos;re not satisfied with the service.
              </p>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
              <h3 className="text-lg font-bold mb-2">Why do LLM &quot;mentions&quot; matter?</h3>
              <p className="text-zinc-300">
                Mentions and citations influence trust, clicks, and brand preference in zero-click AI answers. Read the guide:{' '}
                <Link className="underline hover:text-white" href="/blog">
                  Why LLM mentions matter
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-zinc-400 mb-4">
            Questions about pricing or need a custom plan?
          </p>
          <EmailLink className="text-zinc-400 hover:text-white">
            Send an Email -&gt;
          </EmailLink>
        </div>
      </main>
    </div>
  )
}
