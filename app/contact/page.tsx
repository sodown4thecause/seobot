import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact Us | FlowIntent',
  description: 'Get in touch with the FlowIntent team. Questions about AEO, platform features, or enterprise plans? We\'re here to help.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-400">
            Questions about FlowIntent, AEO, or how we can help? Reach out to our team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">General Inquiries</h2>
            <p className="text-gray-300 mb-6">
              For general questions, support, or feedback about FlowIntent:
            </p>
            <a 
              href="mailto:support@flowintent.com" 
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              support@flowintent.com
            </a>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">Enterprise & Partnerships</h2>
            <p className="text-gray-300 mb-6">
              Interested in enterprise plans, custom integrations, or partnerships:
            </p>
            <a 
              href="mailto:enterprise@flowintent.com" 
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              enterprise@flowintent.com
            </a>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-8 border border-gray-700 mb-16">
          <h2 className="text-2xl font-bold mb-6">Frequently Contacted For</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Beta Usage Upgrades</h3>
              <p className="text-gray-300 text-sm">
                Hit your beta limit and need more capacity? Email support@flowintent.com for Premium access.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">AI Trust Audit Questions</h3>
              <p className="text-gray-300 text-sm">
                Need help interpreting your audit results or implementing recommendations? We're here to assist.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Content Strategy Consulting</h3>
              <p className="text-gray-300 text-sm">
                Looking for hands-on help with AEO strategy? Reach out about consulting packages.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2 text-blue-400">Integration & API Access</h3>
              <p className="text-gray-300 text-sm">
                Want to integrate FlowIntent into your existing workflow? Contact us about API access.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg p-8 border border-blue-800/50 mb-16">
          <h2 className="text-2xl font-bold mb-4">Before You Reach Out</h2>
          <p className="text-gray-300 mb-4">
            You might find your answer faster in these resources:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/faq" 
              className="bg-gray-800/50 hover:bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-all group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-blue-400">FAQ</h3>
              <p className="text-sm text-gray-400">Common questions about AEO and the platform</p>
            </Link>
            <Link 
              href="/docs" 
              className="bg-gray-800/50 hover:bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-all group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-blue-400">Documentation</h3>
              <p className="text-sm text-gray-400">How FlowIntent works and feature guides</p>
            </Link>
            <Link 
              href="/guides" 
              className="bg-gray-800/50 hover:bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-blue-500 transition-all group"
            >
              <h3 className="font-semibold mb-2 group-hover:text-blue-400">Guides</h3>
              <p className="text-sm text-gray-400">In-depth AEO and SEO tutorials</p>
            </Link>
          </div>
        </div>

        <div className="text-center text-gray-400">
          <p className="mb-4">
            We typically respond within 24 hours during business days (Monday-Friday, 9am-5pm EST).
          </p>
          <p className="text-sm">
            For urgent issues affecting your account, please include your account email in your message.
          </p>
        </div>
      </div>
    </div>
  )
}

