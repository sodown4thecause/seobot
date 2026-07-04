import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { getCaseStudy, getCaseStudySlugs } from '@/lib/case-studies'
import { CHAT_MODE_UI, CHAT_MODE_ACCENT_CLASSES } from '@/lib/chat/modes'

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getCaseStudySlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params
  const study = getCaseStudy(slug)
  if (!study) {
    return { title: 'Case Study Not Found | FlowIntent' }
  }
  return buildPageMetadata({
    title: `${study.title} | Case Studies | FlowIntent`,
    description: study.summary,
    path: `/case-studies/${study.slug}`,
    type: 'article',
    imagePath: study.image,
  })
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params
  const study = getCaseStudy(slug)

  if (!study) notFound()

  const accent = CHAT_MODE_ACCENT_CLASSES[CHAT_MODE_UI[study.mode].accent]

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <article className="container mx-auto max-w-3xl px-6 py-16 pt-32">
        <Link
          href="/case-studies"
          className="mb-8 inline-block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
        >
          &larr; Back to Case Studies
        </Link>

        <p className={`mb-4 font-mono text-[11px] uppercase tracking-[0.3em] ${accent.textLabel}`}>
          {CHAT_MODE_UI[study.mode].selectorLabel} · {study.client}
        </p>

        <h1 className="mb-6 text-4xl font-black uppercase italic leading-tight tracking-tight md:text-5xl">
          {study.title}
        </h1>

        <p className="mb-8 text-xl text-zinc-400">{study.summary}</p>

        <div className="relative mb-10 aspect-video w-full overflow-hidden rounded-none border border-white/10">
          <Image
            src={study.image}
            alt={study.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <div className={`mb-12 grid grid-cols-3 gap-px overflow-hidden rounded-none border ${accent.borderPanel}`}>
          {study.metrics.map((metric) => (
            <div key={metric.label} className="bg-white/[0.02] p-5 text-center">
              <div className={`text-2xl font-black md:text-3xl ${accent.textLabel}`}>
                {metric.value}
              </div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-10">
          {study.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 text-2xl font-bold uppercase tracking-tight text-white">
                {section.heading}
              </h2>
              <p className="text-lg leading-relaxed text-zinc-400">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-16 border-t border-white/10 pt-10 text-center">
          <Link
            href="/reddit-gap"
            className="inline-flex items-center gap-2 border border-white bg-white px-8 py-3 text-sm font-black uppercase tracking-[0.18em] text-black transition-colors hover:bg-zinc-200"
          >
            Start with a free Reddit gap audit
          </Link>
        </div>
      </article>
    </div>
  )
}
