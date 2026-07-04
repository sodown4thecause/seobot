import Link from 'next/link'
import Image from 'next/image'
import { Navbar } from '@/components/navbar'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { getCaseStudies } from '@/lib/case-studies'
import { CHAT_MODE_UI, CHAT_MODE_ACCENT_CLASSES } from '@/lib/chat/modes'

export const metadata = buildPageMetadata({
  title: 'Case Studies | FlowIntent',
  description:
    'How teams use FlowIntent — SEO, GEO / AEO, and Content modes — to find gaps, publish, and get cited by AI answer engines.',
  path: '/case-studies',
  type: 'website',
})

export default function CaseStudiesPage() {
  const caseStudies = getCaseStudies()

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="container mx-auto max-w-6xl px-6 py-16 pt-32">
        <div className="mb-12">
          <Link
            href="/"
            className="mb-4 inline-block font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-white"
          >
            &larr; Back to Home
          </Link>
          <h1 className="text-4xl font-black uppercase italic tracking-tight md:text-6xl">
            Case Studies
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            Real workflows across the three modes — from a free Reddit gap audit
            to AI Overview citations.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {caseStudies.map((study) => {
            const accent = CHAT_MODE_ACCENT_CLASSES[CHAT_MODE_UI[study.mode].accent]
            return (
              <Link
                key={study.slug}
                href={`/case-studies/${study.slug}`}
                className={`group block overflow-hidden rounded-none border ${accent.borderPanel} bg-white/[0.02] transition-colors hover:bg-white/[0.04]`}
              >
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={study.image}
                    alt={study.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="p-6">
                  <p className={`mb-3 font-mono text-[11px] uppercase tracking-[0.3em] ${accent.textLabel}`}>
                    {CHAT_MODE_UI[study.mode].selectorLabel} · {study.client}
                  </p>
                  <h2 className="mb-2 text-xl font-bold leading-tight tracking-tight text-white">
                    {study.title}
                  </h2>
                  <p className="line-clamp-2 text-sm text-zinc-400">{study.summary}</p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
