import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'

export const metadata = buildPageMetadata({
  title: 'SEO Resources, Templates & Checklists | FlowIntent',
  description:
    'Access downloadable SEO resources, checklists, and templates for AEO, GEO, and AI search optimization workflows.',
  path: '/resources',
  keywords: ['SEO templates', 'AEO checklist', 'GEO resources', 'AI SEO toolkit'],
})

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16 pt-32 max-w-4xl">
        <div className="mb-12">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Resources
          </h1>
          <p className="text-xl text-gray-400">
            Free tools and templates for SEO & AEO
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-8 text-center">
          <p className="text-gray-300 mb-4">
            Resources coming soon. We're setting up our content management system.
          </p>
          <p className="text-gray-400 text-sm">
            Check back later for free templates, checklists, and tools.
          </p>
        </div>
      </div>
    </div>
  )
}
