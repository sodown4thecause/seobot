'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { SymbolBackground } from '@/components/landing/symbol-background'
import { ModeSkillPicker } from '@/components/landing/mode-skill-picker'
import { LandingFaqSection } from '@/components/landing/landing-faq-section'
import { Hero } from '@/components/landing/sections/hero'
import { StatsStrip } from '@/components/landing/sections/stats-strip'
import { FeaturesBento } from '@/components/landing/sections/features-bento'
import { SocialProofMarquee } from '@/components/landing/sections/social-proof-marquee'
import { FinalCta } from '@/components/landing/sections/final-cta'
import { EmailLink } from '@/components/email-link'

export function LandingPageClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const authError = searchParams.get('error')
    if (!authError) return

    const params = new URLSearchParams(searchParams.toString())
    router.replace(`/login?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-black font-sans text-white selection:bg-white/20">
      <SymbolBackground />
      <Navbar />

      <Hero />
      <SocialProofMarquee />
      <FeaturesBento />
      <StatsStrip />

      {/* Interactive three-mode picker */}
      <section className="relative z-10 px-6 py-20">
        <div className="container mx-auto">
          <ModeSkillPicker />
        </div>
      </section>

      {/* Product demo */}
      <section className="relative z-10 border-b border-white/5 px-6 py-20">
        <div className="container mx-auto">
          <div className="mx-auto max-w-4xl space-y-6 text-center">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">
              Product Demo
            </p>
            <h2 className="text-3xl font-bold uppercase tracking-tight md:text-4xl">
              See it in action
            </h2>
            <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="https://www.youtube.com/embed/Wix-qhO3kkk?rel=0&modestbranding=1"
                title="FlowIntent Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <LandingFaqSection />

      <FinalCta />

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-black px-6 py-16">
        <div className="container mx-auto flex flex-col items-center justify-between gap-12 md:flex-row">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center bg-white text-2xl font-black italic text-black">
              FI
            </div>
            <span className="text-2xl font-bold uppercase italic tracking-tighter">
              Flow Intent
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-10 text-xs font-mono uppercase tracking-widest text-zinc-500">
            <Link href="/blog" className="transition-colors hover:text-white">Blog</Link>
            <Link href="/aeo-auditor" className="transition-colors hover:text-white">AEO Auditor</Link>
            <Link href="/#faq" className="transition-colors hover:text-white">FAQ</Link>
            <Link href="/case-studies" className="transition-colors hover:text-white">Case Studies</Link>
            <EmailLink className="transition-colors hover:text-white">Send an Email</EmailLink>
            <Link href="/privacy" className="transition-colors hover:text-white">Privacy</Link>
            <Link href="/terms" className="transition-colors hover:text-white">Terms</Link>
          </div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-600">
            (c) 2026 FLOW INTENT. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  )
}