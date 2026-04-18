import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { getCaseStudy, getCaseStudySlugs } from '@/lib/webflow'

interface CaseStudyPageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 300

export async function generateStaticParams() {
  const slugs = await getCaseStudySlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params
  const study = await getCaseStudy(slug)
  if (!study) {
    return { title: 'Case Study Not Found | FlowIntent' }
  }
  return buildPageMetadata({
    title: `${study.name} | Case Studies | FlowIntent`,
    description: `Read how ${study.name} improved their SEO and AI visibility with FlowIntent.`,
    path: `/case-studies/${study.slug}`,
    type: 'article',
  })
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params
  const study = await getCaseStudy(slug)

  if (!study) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <article className="container mx-auto px-4 py-16 pt-32 max-w-3xl">
        <Link
          href="/case-studies"
          className="text-blue-400 hover:text-blue-300 mb-8 inline-block text-sm uppercase tracking-wider"
        >
          &larr; Back to Case Studies
        </Link>

        <div className="w-12 h-1 mb-6 bg-blue-400 rounded-full" />

        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{study.name}</h1>

        <div className="text-gray-400 text-sm mb-10">
          {new Date(study.createdOn).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        <div className="bg-gray-800/50 rounded-lg p-8 text-center">
          <p className="text-gray-300">Full case study content coming soon.</p>
        </div>
      </article>
    </div>
  )
}