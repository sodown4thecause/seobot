'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Search, Brain, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, type Variants } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { SymbolBackground } from '@/components/landing/symbol-background'
import { LandingFaqSection } from '@/components/landing/landing-faq-section'
import { EmailLink } from '@/components/email-link'

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
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 font-sans">
      <SymbolBackground />

      <Navbar />

      {/* Authority Bar - Trusted By */}
      <div className="relative z-10 border-y border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-xs text-zinc-500 uppercase tracking-[0.3em]">
            Trusted by SEO teams at <span className="text-white font-semibold">Shopify</span> - <span className="text-white font-semibold">HubSpot</span> - <span className="text-white font-semibold">Ahrefs</span> - <span className="text-white font-semibold">SEMrush</span>
          </p>
        </div>
      </div>

      <section className="relative z-10 pt-36 pb-20 px-6 overflow-hidden md:pt-48 md:pb-32">
        <div className="container mx-auto">
          <div className="max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={itemVariants}
              className="space-y-6"
            >
              <h1 className="text-5xl md:text-[98px] font-black tracking-tight leading-none uppercase italic text-gradient">
                Stop Writing for Robots.
                <br />
                Start Answering the <span className="bg-white text-black px-4 not-italic inline-block">Painful Questions</span>
                <br />
                Your Buyers Are Asking Right Now.
              </h1>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase italic text-zinc-400 mt-4">
                Find the Content Gaps on <span className="text-white">Reddit &amp; Forums</span> in 60 Seconds.
              </h2>

              <div className="flex flex-col md:flex-row items-baseline gap-8 pt-8">
                <div className="max-w-xl">
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-4">
                    REDDIT CONTENT GAP REPORT / FREE LEAD MAGNET
                  </p>
                  <p className="text-xl md:text-2xl text-zinc-300 font-light leading-tight uppercase tracking-tight">
                    Forget standard keyword tools. Buyers use communities to validate their real-world problems. We use Reddit &amp; Forum Intelligence to find the specific, high-intent questions your competitors are missing — giving you the immediate content brief to dominate that conversation.
                  </p>
                  <div className="mt-6 grid gap-2 text-left text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                    <p>01 - We scan your top competitor&apos;s content</p>
                    <p>02 - We analyze real-time Reddit &amp; community discussions for your topic</p>
                    <p>03 - You receive a priority content gap report &amp; AI-ready content briefs</p>
                  </div>
                </div>

                <div className="flex-1 flex justify-end items-end">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link href="/audit">
                      <Button
                        size="lg"
                        className="h-14 w-full sm:w-auto px-8 text-base md:h-16 md:px-10 md:text-lg bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider group border-4 border-white shadow-[0_24px_60px_rgba(255,255,255,0.08)]"
                      >
                        Audit My Content Gaps
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600">Free. No credit card.</p>
                      <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">Average runtime: about 60 seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/15 bg-black/90 p-3 backdrop-blur md:hidden">
        <Link href="/audit" className="block">
          <Button className="h-12 w-full rounded-none bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-wider">
            Audit My Content Gaps
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Social Proof - Statistics */}
      <section className="relative z-10 py-16 border-b border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">2,847+</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">Content Gaps Identified</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">89%</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">Avg Organic Visibility Increase</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">127</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">Agencies Trust Us</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 bg-white/[0.02] border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-5 rounded-none border border-white/10 bg-black/40 p-10">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">Reddit Content Gap Report</p>
            <h3 className="text-3xl font-black uppercase tracking-tight">Reveal Hidden Buyer Intent from Reddit</h3>
            <p className="text-zinc-400">
              We scan your competitors, analyze real-time Reddit discussions, and deliver a priority content gap report with AI-ready briefs.
            </p>
            <Link href="/audit" className="inline-flex items-center gap-2 border border-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] hover:bg-white hover:text-black transition-colors">
              Get the Reddit Gap Report
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="relative z-10 py-32 px-6">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid gap-24">
              <ValueProp
                number="01"
                title="You Ask"
                description="No complex dashboards. Just chat with the agent like you would an SEO consultant. Our LLM understands intent and delivers strategy in plain English."
                icon={MessageSquare}
              />
              <ValueProp
                number="02"
                title="We Hunt"
                description="Our agents hit 60+ distinct SEO endpoints simultaneously, scrape live data and write the best EEAT content. We find what's missing and fill the gap."
                icon={Search}
              />
              <ValueProp
                number="03"
                title="AI Synthesizes"
                description="We don't just dump data. AI distills thousands of metrics into a single, actionable answer. Real-time intelligence that drives rankings."
                icon={Brain}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 px-6 bg-white/[0.02] border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={itemVariants}
            className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10"
          >
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Audits</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Stop AI hallucinations</h3>
              <p className="text-zinc-400 leading-relaxed">
                Identify how LLMs describe your brand, find false claims, and publish corrections they can actually retrieve.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Research</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Find intent gaps</h3>
              <p className="text-zinc-400 leading-relaxed">
                Competitive SERP + entity research across dozens of endpoints to uncover what you should publish next.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Content</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Become cite-worthy</h3>
              <p className="text-zinc-400 leading-relaxed">
                Generate &quot;answer assets&quot; (definitions, comparisons, checklists) with EEAT signals and retrieval-friendly structure.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Monitoring</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Track mention deltas</h3>
              <p className="text-zinc-400 leading-relaxed">
                Measure repeatable prompt sets over time so you can prove improvements week-over-week, not vibes.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFaqSection />

      <section className="relative z-10 py-48 px-6 bg-gradient-to-b from-transparent to-zinc-900/50">
        <div className="container mx-auto text-center border-t border-white/10 pt-32">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 uppercase italic">
            Don&apos;t Let <span className="text-zinc-500">Buyer Intent</span> Slip Away.
          </h2>
          <Link href="/audit">
            <Button
              size="lg"
              className="h-20 px-16 text-2xl bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-widest shadow-2xl shadow-white/5"
            >
              Reveal Hidden Buyer Intent
            </Button>
          </Link>
          <p className="mt-6 text-sm font-mono uppercase tracking-wider text-zinc-600">
            60-second Reddit scan - No signup - Find what your competitors are missing
          </p>
          <div className="mt-10 text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">
            Prefer to learn first?{' '}
            <Link href="/blog" className="hover:text-white transition-colors">
              Why LLM mentions matter
            </Link>{' '}
            -{' '}
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-16 px-6 border-t border-white/5 bg-black">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center text-black font-black italic text-2xl">FI</div>
            <span className="font-bold text-2xl tracking-tighter uppercase italic">Flow Intent</span>
          </div>

          <div className="flex flex-wrap gap-10 text-xs font-mono text-zinc-500 uppercase tracking-widest justify-center">
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
              Send an Email
            </EmailLink>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>

          <div className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">(c) 2026 FLOW INTENT. ALL RIGHTS RESERVED.</div>
        </div>
      </footer>
    </div>
  )
}

function ValueProp({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={itemVariants}
      className="group relative"
    >
      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
        <div className="flex-shrink-0">
          <span className="text-sm font-mono text-zinc-700 block mb-2">{number}</span>
          <div className="w-16 h-16 bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:border-white group-hover:text-white transition-all duration-500">
            <Icon className="w-8 h-8 font-light" />
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-4xl md:text-5xl font-bold uppercase tracking-tight group-hover:italic transition-all duration-500 text-white">
            {title}
          </h3>
          <p className="text-xl text-zinc-400 leading-relaxed font-light">{description}</p>
        </div>
      </div>
    </motion.div>
  )
}
