import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Metadata } from 'next'
import DOMPurify from 'isomorphic-dompurify'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { absoluteUrl } from '@/lib/seo/site'
import { getCaseStudy, getCaseStudySlugs } from '@/lib/webflow'

interface CaseStudyPageProps {
  params: Promise<{
    slug: string
  }>
}

export const revalidate = 300

function safeJsonLd(input: object): string {
  return JSON.stringify(input)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f')
}

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
    description: study.summary ?? `Read how ${study.name} improved their SEO and AI visibility with FlowIntent.`,
    path: `/case-studies/${study.slug}`,
    type: 'article',
    imagePath: study.thumbnailImage ?? study.mainImage ?? undefined,
  })
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params
  const study = await getCaseStudy(slug)

  if (!study) notFound()

  const caseStudySchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: study.name,
    description: study.summary ?? undefined,
    dateModified: study.lastUpdated,
    datePublished: study.createdOn,
    url: absoluteUrl(`/case-studies/${study.slug}`),
    ...(study.mainImage ? { image: study.mainImage } : {}),
    author: {
      '@type': 'Organization',
      name: 'FlowIntent',
      url: 'https://flowintent.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'FlowIntent',
      logo: {
        '@type': 'ImageObject',
        url: 'https://flowintent.com/logo-new.png',
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Navbar />
      <article className="container mx-auto px-4 py-16 pt-32 max-w-3xl">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(caseStudySchema) }}
        />
        <Link
          href="/case-studies"
          className="text-blue-400 hover:text-blue-300 mb-8 inline-block text-sm uppercase tracking-wider"
        >
          &larr; Back to Case Studies
        </Link>

        <div className="w-12 h-1 mb-6 bg-blue-400 rounded-full" />

        <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{study.name}</h1>

        {study.summary && (
          <p className="text-xl text-gray-400 mb-8">{study.summary}</p>
        )}

        <div className="text-gray-400 text-sm mb-10">
          {new Date(study.createdOn).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>

        {study.mainImage && (
          <div className="relative w-full aspect-video mb-10 rounded-lg overflow-hidden">
            <Image
              src={study.mainImage}
              alt={study.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}

        {study.body ? (
          <div
            className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-a:text-blue-400 hover:prose-a:text-blue-300"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(study.body, { ADD_TAGS: ['img'], ADD_ATTR: ['loading', 'fetchpriority'] }) }}
          />
        ) : (
          <div className="bg-gray-800/50 rounded-lg p-8 text-center">
            <p className="text-gray-300">Full case study content coming soon.</p>
          </div>
        )}
      </article>
    </div>
  )
}
