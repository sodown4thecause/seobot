'use client'

import { Marquee } from '@/components/magicui/marquee'

const BRANDS = [
  'DataForSEO',
  'Jina',
  'Firecrawl',
  'ChatGPT',
  'Perplexity',
  'Google AI Overviews',
  'Supadata',
  'Reddit',
]

export function SocialProofMarquee() {
  const firstRow = BRANDS.slice(0, BRANDS.length / 2)
  const secondRow = BRANDS.slice(BRANDS.length / 2)

  return (
    <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-12 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <p className="mb-8 text-center text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">
          Powered by best-in-class data sources
        </p>
        <div className="relative flex flex-col gap-4">
          <Marquee pauseOnHover className="[--duration:30s]">
            {firstRow.map((brand) => (
              <span
                key={brand}
                className="mx-8 text-xl font-bold uppercase tracking-tight text-zinc-400 transition-colors hover:text-white"
              >
                {brand}
              </span>
            ))}
          </Marquee>
          <Marquee reverse pauseOnHover className="[--duration:30s]">
            {secondRow.map((brand) => (
              <span
                key={brand}
                className="mx-8 text-xl font-bold uppercase tracking-tight text-zinc-400 transition-colors hover:text-white"
              >
                {brand}
              </span>
            ))}
          </Marquee>
        </div>
      </div>
    </section>
  )
}