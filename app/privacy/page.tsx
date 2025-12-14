import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | FlowIntent',
  description: 'FlowIntent privacy policy. Learn how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-gray-400">
            Last updated: December 14, 2025
          </p>
        </div>

        <div className="prose prose-invert max-w-none">
          <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-6 mb-8">
            <p className="mb-0 text-gray-300">
              At FlowIntent, we take your privacy seriously. This policy explains how we collect, use, and protect your information.
            </p>
          </div>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>
          <h3 className="text-xl font-semibold mt-6 mb-3">Account Information</h3>
          <p className="text-gray-300 mb-4">
            When you create a FlowIntent account, we collect:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li>Email address</li>
            <li>Password (encrypted)</li>
            <li>Account preferences</li>
            <li>Usage limits and subscription status</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Usage Data</h3>
          <p className="text-gray-300 mb-4">
            To provide and improve our service, we collect:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li>Chat conversations and queries</li>
            <li>Generated content and research data</li>
            <li>API usage metrics and costs</li>
            <li>Feature usage and interaction patterns</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">Technical Information</h3>
          <p className="text-gray-300 mb-4">
            We automatically collect:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li>IP address (for rate limiting and security)</li>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>Access times and session duration</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
          <p className="text-gray-300 mb-4">
            We use collected information to:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li><strong>Provide the service:</strong> Process your queries, generate content, and deliver AI Trust Audits</li>
            <li><strong>Improve the platform:</strong> Analyze usage patterns to enhance features and fix bugs</li>
            <li><strong>Enforce usage limits:</strong> Monitor API usage to prevent abuse and ensure fair access</li>
            <li><strong>Communicate:</strong> Send service updates, security alerts, and respond to inquiries</li>
            <li><strong>Secure the platform:</strong> Detect fraud, block malicious activity, and prevent unauthorized access</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Sharing and Third Parties</h2>
          <p className="text-gray-300 mb-4">
            We <strong>do not sell</strong> your personal information. We share data only in these limited circumstances:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li><strong>Service providers:</strong> Supabase (database), Upstash (rate limiting), and DataForSEO (SEO data) process data on our behalf</li>
            <li><strong>AI providers:</strong> Your queries may be sent to Anthropic (Claude), OpenAI (GPT), or Perplexity for processing</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law or to protect our rights</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Retention</h2>
          <p className="text-gray-300 mb-6">
            We retain your data as long as your account is active. When you delete your account:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li>Personal information is deleted within 30 days</li>
            <li>Anonymized usage data may be retained for analytics</li>
            <li>Backups are purged within 90 days</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Security</h2>
          <p className="text-gray-300 mb-6">
            We implement industry-standard security measures:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li>Encryption in transit (HTTPS/TLS)</li>
            <li>Encrypted data at rest</li>
            <li>Row-level security (RLS) in our database</li>
            <li>Rate limiting to prevent abuse</li>
            <li>IP blocking for detected threats</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Your Rights</h2>
          <p className="text-gray-300 mb-4">
            You have the right to:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li><strong>Access:</strong> Request a copy of your data</li>
            <li><strong>Correction:</strong> Update inaccurate information</li>
            <li><strong>Deletion:</strong> Request account and data deletion</li>
            <li><strong>Export:</strong> Download your content and research data</li>
            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
          </ul>
          <p className="text-gray-300 mb-6">
            To exercise these rights, contact us at <a href="mailto:privacy@flowintent.com" className="text-blue-400 hover:text-blue-300">privacy@flowintent.com</a>.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Cookies and Tracking</h2>
          <p className="text-gray-300 mb-6">
            We use essential cookies for:
          </p>
          <ul className="text-gray-300 space-y-2 mb-6">
            <li>Authentication and session management</li>
            <li>Security and fraud prevention</li>
            <li>Basic analytics (page views, feature usage)</li>
          </ul>
          <p className="text-gray-300 mb-6">
            We do not use third-party advertising or tracking cookies.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Children's Privacy</h2>
          <p className="text-gray-300 mb-6">
            FlowIntent is not intended for users under 13. We do not knowingly collect information from children. If you believe we have inadvertently collected data from a child, contact us immediately.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Changes to This Policy</h2>
          <p className="text-gray-300 mb-6">
            We may update this privacy policy as our service evolves. Material changes will be announced via email and prominently on our website. Continued use after changes constitutes acceptance.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p className="text-gray-300 mb-4">
            Questions about this privacy policy or your data?
          </p>
          <p className="text-gray-300 mb-6">
            Email: <a href="mailto:privacy@flowintent.com" className="text-blue-400 hover:text-blue-300">privacy@flowintent.com</a>
          </p>

          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700 mt-8">
            <p className="text-gray-300 mb-4">
              <strong>Related:</strong>
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                Terms of Service →
              </Link>
              <Link href="/contact" className="text-blue-400 hover:text-blue-300">
                Contact Us →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

