import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, Check } from 'lucide-react'
import { Navbar } from '@/components/navbar'

export const metadata: Metadata = {
  title: 'Pricing Plans - AI SEO & AEO Platform | FlowIntent',
  description:
    'FlowIntent pricing: start free with weekly usage limits. Upgrade to Pro for higher limits and priority support. Optimize for Google and AI answer engines.',
}

export default function PricesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />

      <div className="container mx-auto px-4 py-16 pt-32">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start free. Upgrade when you need more capacity and faster iteration.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Beta Plan */}
          <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Free Beta</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-gray-400">forever</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>$1 USD in API usage per week</span>
              </li>
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
                <span>Response limits to protect capacity</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="text-yellow-400 mt-1 h-4 w-4" />
                <span>7-day pause when usage limit is reached</span>
              </li>
            </ul>

            <Link 
              href="/signup"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Start Free Beta
            </Link>
          </div>

          {/* Pro Plan - Coming Soon */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-8 border border-purple-500 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
              COMING SOON
            </div>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Pro</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">$40</span>
                <span className="text-gray-400">/month</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-8 text-gray-300">
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Everything in Free Beta</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Higher usage limits</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>No weekly pause</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="text-green-400 mt-1 h-4 w-4" />
                <span>Higher response limits</span>
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

            <button 
              disabled
              className="block w-full bg-gray-700 text-gray-400 text-center px-6 py-3 rounded-lg font-semibold cursor-not-allowed"
            >
              Join the waitlist
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Email{' '}
              <a className="underline hover:text-white" href="mailto:support@flowintent.com">
                support@flowintent.com
              </a>{' '}
              for early access.
            </p>
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Need More?</h2>
          <p className="text-gray-400 mb-6">
            Contact us about Enterprise plans with custom limits, dedicated support, and white-label options.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Contact Sales
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">What happens when I hit my beta limit?</h3>
              <p className="text-gray-300">
                When you reach the $1 weekly limit, your account is paused for 7 days. You can email support@flowintent.com to request early Pro access or wait for the automatic reset.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">How does the $1 usage limit work?</h3>
              <p className="text-gray-300">
                The limit tracks total API costs for AI queries, research, and data fetching. Use it for quick audits and experiments; upgrade when you want to run larger, more frequent workflows.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">When will Pro be available?</h3>
              <p className="text-gray-300">
                Pro is launching soon. Email support@flowintent.com to get early access or be notified when it's available.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Do you offer refunds?</h3>
              <p className="text-gray-300">
                The free beta has no cost, so refunds don't apply. When Pro launches, we plan to offer a 7-day money-back guarantee.
              </p>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-2">Why do LLM “mentions” matter?</h3>
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
          <Link href="/contact" className="text-blue-400 hover:text-blue-300">
            Get in touch →
          </Link>
        </div>
      </div>
    </div>
  )
}
