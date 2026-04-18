import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { getCaseStudies } from '@/lib/webflow'

export const metadata = buildPageMetadata({
  title: 'SEO Case Studies & Results | FlowIntent',
  description:
    'See how teams improved rankings, traffic, and AI visibility with FlowIntent strategies across industries.',
  path: '/case-studies',
  keywords: ['SEO case studies', 'AEO results', 'GEO case study', 'AI visibility examples'],
})

export const revalidate = 300

export default async function CaseStudiesPage() {
  const studies = await getCaseStudies()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <div className="container mx-auto px-4 py-16 pt-32 max-w-6xl">
        <div className="mb-12">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Case Studies</h1>
          <p className="text-xl text-gray-400">
            Real-world results and success stories
          </p>
        </div>

        {studies.length === 0 ? (
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-300 mb-4">Case studies coming soon.</p>
            <p className="text-gray-400 text-sm">
              Check back later for detailed case studies showcasing SEO and AEO results.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studies.map((study) => (
              <Link
                key={study.id}
                href={`/case-studies/${study.slug}`}
                className="group block bg-gray-800/50 rounded-lg p-6 hover:bg-gray-800/70 transition-colors"
              >
                <div className="w-8 h-1 mb-4 bg-blue-400 rounded-full" />
                <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                  {study.name}
                </h3>
                <p className="text-gray-400 text-sm">
                  {new Date(study.createdOn).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}