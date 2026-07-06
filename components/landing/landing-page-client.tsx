'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Search, Brain, PenLine, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, type Variants } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { SymbolBackground } from '@/components/landing/symbol-background'
import { ModeSkillPicker } from '@/components/landing/mode-skill-picker'
import { LandingFaqSection } from '@/components/landing/landing-faq-section'
import { EmailLink } from '@/components/email-link'
import {
  FLOWINTENT_ELEVATOR_PITCH,
  FLOWINTENT_PLATFORM_MODES_INTRO,
} from '@/lib/product/elevator-pitch'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'circOut',
    },
  },
}

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
    <div className="min-h-screen bg-black text-white selection:bg-white/20 font-sans">
      <SymbolBackground />

      <Navbar />

      {/* Hero */}
      <section className="relative z-10 pt-36 pb-24 px-6 overflow-hidden md:pt-44 md:pb-32">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={itemVariants}
              className="space-y-6"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Free Reddit content gap audit — no signup, 60 seconds
              </p>

              <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter leading-[1.05] text-gradient">
                Your audience is on Reddit,
                <br />
                asking questions your
                <br />
                competitors ignore.
              </h1>

              <p className="mx-auto max-w-2xl text-lg md:text-xl text-zinc-400 leading-relaxed">
                We scan thousands of Reddit discussions to find the exact questions your
                audience is asking — and your competitors aren&apos;t answering. Get a
                prioritized content brief in 60 seconds.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <Link href="/reddit-gap">
                  <Button
                    size="lg"
                    className="h-12 px-7 text-[15px] bg-white text-black hover:bg-zinc-200 rounded-lg font-medium group shadow-[0_0_40px_rgba(255,255,255,0.12)]"
                  >
                    Find my content gaps
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 px-7 text-[15px] rounded-lg border-white/15 bg-white/[0.02] text-white hover:bg-white/[0.06] hover:text-white font-medium"
                  >
                    Open the platform
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-zinc-500">
                <span>Scan relevant subreddits for real questions</span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span>Find gaps competitors miss</span>
                <span className="hidden sm:inline text-zinc-700">·</span>
                <span>Ranked brief with sources + action items</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/90 p-3 backdrop-blur md:hidden">
        <Link href="/reddit-gap" className="block">
          <Button className="h-11 w-full rounded-lg bg-white text-black hover:bg-zinc-200 font-medium">
            Find my content gaps
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Product Demo */}
      <section className="relative z-10 py-20 px-6 border-b border-white/[0.06]">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={itemVariants}
            className="max-w-4xl mx-auto space-y-6 text-center"
          >
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">Product demo</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">See it in action</h2>
            <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black shadow-2xl" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src="https://www.youtube.com/embed/Wix-qhO3kkk?rel=0&modestbranding=1"
                title="FlowIntent Product Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* What you get - quick wins */}
      <section className="relative z-10 py-16 border-b border-white/[0.06]">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-2">60s</div>
              <div className="text-sm text-zinc-500">To your content gap report</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-2">1000s</div>
              <div className="text-sm text-zinc-500">Reddit threads analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-2">50+</div>
              <div className="text-sm text-zinc-500">Subreddits available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Reddit audit callout */}
      <section className="relative z-10 py-20 border-b border-white/[0.06]">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-white/10 bg-white/[0.02] p-10 backdrop-blur-sm">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">Reddit content gap audit</p>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Find what Reddit is asking that your competitors ignore</h3>
            <p className="text-zinc-400 leading-relaxed">
              We scan thousands of Reddit discussions across relevant subreddits, identify high-intent questions your competitors aren&apos;t answering, and deliver a ranked content brief with sources and action items.
            </p>
            <Link
              href="/reddit-gap"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
            >
              Get my free content gap report
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Modes Intro */}
      <section className="relative z-10 py-24 px-6 border-b border-white/[0.06]">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={itemVariants}
            className="max-w-3xl mx-auto text-center space-y-5 mb-16"
          >
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">The platform</p>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter">
              Three modes. One platform.
              <br />
              <span className="text-zinc-500">No other SEO tool does this.</span>
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              {FLOWINTENT_ELEVATOR_PITCH}
            </p>
            <p className="text-zinc-500 text-sm leading-relaxed max-w-2xl mx-auto">
              {FLOWINTENT_PLATFORM_MODES_INTRO}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                href="/sign-up"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
              >
                Open the platform
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/reddit-gap"
                className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.02] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
              >
                Try free Reddit audit
              </Link>
            </div>
          </motion.div>

          {/* Interactive mode + subskill picker (Cursor-composer pattern) */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={itemVariants}
            className="mt-16"
          >
            <ModeSkillPicker />
          </motion.div>
        </div>
      </section>

      <section id="features" className="relative z-10 py-32 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-20">
              <ValueProp
                number="01"
                label="SEO Mode"
                title="Rank higher, faster"
                description="Deep keyword research, live SERP analysis, competitor gap identification and technical SEO audits — all powered by DataForSEO. Ask in plain English, get actionable data back instantly."
                icon={Search}
                accent="emerald"
              />
              <ValueProp
                number="02"
                label="GEO / AEO Mode"
                title="Own the AI answer box"
                description="Track mentions and citations in ChatGPT, Perplexity, and Google AI Overviews—the engines we run today—so you know whether AI answers name you or your competitors."
                icon={Brain}
                accent="violet"
              />
              <ValueProp
                number="03"
                label="Content Mode"
                title="Publish in minutes"
                description="Content Mode is AI SDK 6 chat for publishing—drafts, hero image, and thumbnail. Save artifacts to your workspace or export Markdown for your CMS."
                icon={PenLine}
                accent="amber"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 px-6 border-y border-white/[0.06]">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={itemVariants}
            className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4"
          >
            <div className="rounded-xl border border-emerald-500/15 bg-white/[0.02] p-8 transition-colors hover:border-emerald-500/30">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
                <Search className="h-4 w-4 text-emerald-400" />
              </div>
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-emerald-500 mb-2">SEO Mode</p>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-white">SERP & keyword intelligence</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Live keyword volumes, difficulty scores, competitor rankings, backlink profiles and SERP feature tracking — queried conversationally.
              </p>
            </div>
            <div className="rounded-xl border border-violet-500/15 bg-white/[0.02] p-8 transition-colors hover:border-violet-500/30">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                <Brain className="h-4 w-4 text-violet-400" />
              </div>
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-violet-500 mb-2">GEO / AEO Mode</p>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-white">AI visibility tracking</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Monitor brand mentions and citations in ChatGPT, Perplexity, and Google AI Overviews—with more engines as integrations scale.
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/15 bg-white/[0.02] p-8 transition-colors hover:border-amber-500/30">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                <PenLine className="h-4 w-4 text-amber-400" />
              </div>
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-amber-500 mb-2">Content Mode</p>
              <h3 className="text-lg font-semibold tracking-tight mb-2 text-white">Blog posts with images</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Chat in Content Mode, preview artifacts in the side panel, save to workspace—export when you are ready.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFaqSection />

      {/* Final CTA */}
      <section className="relative z-10 py-40 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tighter mb-6 text-gradient">
            Your competitors are already getting cited.
          </h2>
          <p className="text-lg text-zinc-400 mb-10">
            60-second scan — no signup — see what your audience is asking on Reddit.
          </p>
          <Link href="/reddit-gap">
            <Button
              size="lg"
              className="h-14 px-10 text-lg bg-white text-black hover:bg-zinc-200 rounded-lg font-medium shadow-[0_0_60px_rgba(255,255,255,0.15)]"
            >
              Find my content gaps
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-10 text-sm text-zinc-500">
            Prefer to learn first?{' '}
            <Link href="/blog" className="text-zinc-400 underline underline-offset-4 hover:text-white transition-colors">
              Why Reddit content gaps matter
            </Link>{' '}
            ·{' '}
            <Link href="/blog" className="text-zinc-400 underline underline-offset-4 hover:text-white transition-colors">
              Blog
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-14 px-6 border-t border-white/[0.06] bg-black">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center text-black font-bold text-xs">FI</div>
            <span className="font-semibold text-[15px] tracking-tight">FlowIntent</span>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-zinc-500 justify-center">
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/aeo-auditor" className="hover:text-white transition-colors">
              AEO Auditor
            </Link>
            <Link href="/#faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/case-studies" className="hover:text-white transition-colors">
              Case Studies
            </Link>
            <EmailLink className="hover:text-white transition-colors">
              Contact
            </EmailLink>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>

          <div className="text-xs text-zinc-600">© 2026 FlowIntent. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

const ACCENT_COLORS: Record<string, { border: string; text: string; icon: string; bg: string }> = {
  emerald: { border: 'group-hover:border-emerald-500/40', text: 'text-emerald-400', icon: 'group-hover:text-emerald-400', bg: 'bg-emerald-500/10' },
  violet: { border: 'group-hover:border-violet-500/40', text: 'text-violet-400', icon: 'group-hover:text-violet-400', bg: 'bg-violet-500/10' },
  amber: { border: 'group-hover:border-amber-500/40', text: 'text-amber-400', icon: 'group-hover:text-amber-400', bg: 'bg-amber-500/10' },
}

function ValueProp({
  number,
  label,
  title,
  description,
  icon: Icon,
  accent = 'emerald',
}: {
  number: string
  label?: string
  title: string
  description: string
  icon: LucideIcon
  accent?: string
}) {
  const colors = ACCENT_COLORS[accent] ?? ACCENT_COLORS.emerald
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={itemVariants}
      className="group relative"
    >
      <div className="flex flex-col md:flex-row gap-8 md:gap-14 items-start">
        <div className="flex-shrink-0">
          <span className="text-sm font-mono text-zinc-700 block mb-2">{number}</span>
          <div className={`w-14 h-14 rounded-xl ${colors.bg} border border-white/10 flex items-center justify-center text-zinc-400 ${colors.icon} ${colors.border} transition-all duration-300`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
        <div className="space-y-3">
          {label && (
            <p className={`text-xs font-mono uppercase tracking-[0.2em] ${colors.text}`}>{label}</p>
          )}
          <h3 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            {title}
          </h3>
          <p className="text-lg text-zinc-400 leading-relaxed">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}
