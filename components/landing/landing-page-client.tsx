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

      {/* Authority Bar */}
      <div className="relative z-10 border-y border-white/10 bg-white/[0.02] backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <p className="text-center text-xs text-zinc-500 uppercase tracking-[0.3em]">
            SEO + AEO in one workflow — <span className="text-white font-semibold">Google</span> · <span className="text-white font-semibold">ChatGPT</span> · <span className="text-white font-semibold">Perplexity</span> · <span className="text-white font-semibold">Gemini</span> · <span className="text-white font-semibold">Grok</span>
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
                Do AI Engines
                <br />
                Recommend You <span className="bg-white text-black px-4 not-italic inline-block">or Your</span>
                <br />
                Competitors?
              </h1>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase italic text-zinc-400 mt-4">
                Find out in 60 seconds — then <span className="text-white">fix it.</span>
              </h2>

              <div className="flex flex-col md:flex-row items-baseline gap-8 pt-8">
                <div className="max-w-xl">
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-4">
                    Free AI Visibility Audit
                  </p>
                  <p className="text-xl md:text-2xl text-zinc-300 font-light leading-tight uppercase tracking-tight">
                    Most SEO tools can&apos;t tell you if ChatGPT or Perplexity is sending buyers to your competitors. FlowIntent audits your brand across AI answer engines and shows you exactly where you&apos;re missing.
                  </p>
                  <div className="mt-6 grid gap-2 text-left text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                    <p>01 - Check if AI models mention your brand</p>
                    <p>02 - Compare your visibility against competitors</p>
                    <p>03 - Get a scorecard with prioritized next actions</p>
                  </div>
                </div>

                <div className="flex-1 flex justify-end items-end">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link href="/reddit-gap">
                      <Button
                        size="lg"
                        className="h-14 w-full sm:w-auto px-8 text-base md:h-16 md:px-10 md:text-lg bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider group border-4 border-white shadow-[0_24px_60px_rgba(255,255,255,0.08)]"
                      >
                        Run My Free AI Audit
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <div className="text-center sm:text-left">
                      <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600">Free. No credit card.</p>
                      <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">Typical runtime: 60 seconds</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/15 bg-black/90 p-3 backdrop-blur md:hidden">
        <Link href="/reddit-gap" className="block">
          <Button className="h-12 w-full rounded-none bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-wider">
            Run My Free AI Audit
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* What you get - quick wins */}
      <section className="relative z-10 py-16 border-b border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">60s</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">To Your First Visibility Score</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">70+</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">SEO & AEO Data Endpoints</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">4</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">AI Engines Audited Per Run</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 bg-white/[0.02] border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-5 rounded-none border border-white/10 bg-black/40 p-10">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">Free AI Visibility Audit</p>
            <h3 className="text-3xl font-black uppercase tracking-tight">Is Your Brand Invisible to AI Answer Engines?</h3>
            <p className="text-zinc-400">
              When buyers ask ChatGPT or Perplexity to recommend a tool, who gets cited — you or a competitor? Run a free audit across Perplexity, Grok, and Gemini to get your baseline visibility score and a clear list of what to fix first.
            </p>
            <Link href="/reddit-gap" className="inline-flex items-center gap-2 border border-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] hover:bg-white hover:text-black transition-colors">
              Get My Free Visibility Score
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
                title="Describe Your Goal"
                description="No dashboards to learn. Tell FlowIntent what you want — rank a keyword, beat a competitor, or get cited by AI — and the right workflow starts automatically."
                icon={MessageSquare}
              />
              <ValueProp
                number="02"
                title="We Gather Intelligence"
                description="Specialist agents query 70+ SEO and AEO data endpoints in parallel — live SERP data, competitor signals, AI citation checks, and content gaps — all in one pass."
                icon={Search}
              />
              <ValueProp
                number="03"
                title="You Get a Plan"
                description="Not a data dump. FlowIntent turns thousands of signals into a prioritized action list: what to publish, what to fix, and what will move the needle first."
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
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">AI Trust Audits</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">See what AI says about you</h3>
              <p className="text-zinc-400 leading-relaxed">
                Find out how Perplexity, Grok, and Gemini currently describe your brand. Spot inaccurate claims before buyers do, then publish the corrections AI can actually retrieve.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Competitive Research</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Know what to publish next</h3>
              <p className="text-zinc-400 leading-relaxed">
                Live SERP and entity research across 70+ endpoints surfaces the exact topics and questions your competitors rank for — and you don&apos;t yet.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Content Engine</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Generate content AI wants to cite</h3>
              <p className="text-zinc-400 leading-relaxed">
                Create definitions, comparisons, and how-to content structured for EEAT and AI retrieval — the formats that get picked up as citations, not buried in search results.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Visibility Monitoring</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Prove progress week over week</h3>
              <p className="text-zinc-400 leading-relaxed">
                Run the same prompt sets on a schedule and track your mention and citation count over time. Show stakeholders real movement — not just gut feel.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <LandingFaqSection />

      <section className="relative z-10 py-48 px-6 bg-gradient-to-b from-transparent to-zinc-900/50">
        <div className="container mx-auto text-center border-t border-white/10 pt-32">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 uppercase italic">
            Your Competitors Are <span className="text-zinc-500">Already</span> Getting Cited.
          </h2>
          <Link href="/reddit-gap">
            <Button
              size="lg"
              className="h-20 px-16 text-2xl bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-widest shadow-2xl shadow-white/5"
            >
              Run My Free AI Audit
            </Button>
          </Link>
          <p className="mt-6 text-sm font-mono uppercase tracking-wider text-zinc-600">
            60 seconds — no signup — see exactly where you stand
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
