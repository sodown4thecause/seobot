'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, Search, Brain, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion, type Variants } from 'framer-motion'
import { Navbar } from '@/components/navbar'
import { AEOAuditor } from '@/components/aeo-auditor'
import { SymbolBackground } from '@/components/landing/symbol-background'

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "circOut"
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20 font-sans">
      <SymbolBackground />

      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-48 pb-32 px-6 overflow-hidden">
        <div className="container mx-auto">
          <div className="max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={itemVariants}
              className="space-y-6"
            >
              <h1 className="text-6xl md:text-[110px] font-black tracking-tight leading-none uppercase italic">
                Rank on Google.<br />
                Be the <span className="bg-white text-black px-4 not-italic inline-block">Answer</span> on AI.
              </h1>

              <div className="flex flex-col md:flex-row items-baseline gap-8 pt-8">
                <div className="max-w-xl">
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-4">
                    SEO AGENTIC CLOUD / v2.0
                  </p>
                  <p className="text-2xl md:text-3xl text-zinc-300 font-light leading-tight uppercase tracking-tighter">
                    Turn rankings into LLM mentions, citations, and revenue.
                  </p>
                </div>

                <div className="flex-1 flex justify-end items-end">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link href="/signup">
                      <Button size="lg" className="h-16 px-10 text-lg bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider group border-4 border-white">
                        Get Started
                        <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                    <Link href="/guides/llm-mentions" className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 hover:text-white transition-colors">
                      Read: Why LLM mentions matter →
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Lead Magnet Section */}
      <section className="relative z-10 py-20 bg-white/[0.02] border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <AEOAuditor />
        </div>
      </section>

      {/* Value Propositions / Process Section */}
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

      {/* Proof / What you get */}
      <section className="relative z-10 py-24 px-6 bg-white/[0.02] border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={itemVariants}
            className="max-w-5xl mx-auto"
          >
            <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-10">
              <div className="max-w-2xl">
                <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-3">OUTCOMES</p>
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight uppercase italic">
                  Earn more <span className="text-zinc-500">mentions</span>.
                </h2>
              </div>
              <div className="flex gap-4 flex-wrap">
                <Link href="/prices">
                  <Button size="lg" className="h-12 px-8 bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider border-2 border-white">
                    View Pricing
                  </Button>
                </Link>
                <Link href="/faq">
                  <Button size="lg" variant="outline" className="h-12 px-8 rounded-none font-black uppercase tracking-wider border-2 border-white/20 text-white hover:bg-white/10">
                    Read FAQ
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-black/40 border border-white/10 p-8 rounded-none">
                <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">AI Trust</p>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Spot hallucinations</h3>
                <p className="text-zinc-400 leading-relaxed">
                  See how ChatGPT/Perplexity describe you, where facts drift, and what pages to publish so models repeat the truth.
                </p>
              </div>
              <div className="bg-black/40 border border-white/10 p-8 rounded-none">
                <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Content</p>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Become cite-worthy</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Generate “answer assets” (definitions, comparisons, checklists) with EEAT signals and retrieval-friendly structure.
                </p>
              </div>
              <div className="bg-black/40 border border-white/10 p-8 rounded-none">
                <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Monitoring</p>
                <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Track mention deltas</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Measure repeatable prompt sets over time so you can prove improvements week-over-week, not vibes.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-48 px-6 bg-gradient-to-b from-transparent to-zinc-900/50">
        <div className="container mx-auto text-center border-t border-white/10 pt-32">
          <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 uppercase italic">
            Ready to <span className="text-zinc-500">Evolve?</span>
          </h2>
          <Link href="/signup">
            <Button size="lg" className="h-20 px-16 text-2xl bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-widest shadow-2xl shadow-white/5">
              Secure Your Position
            </Button>
          </Link>
          <div className="mt-10 text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">
            Prefer to learn first?{' '}
            <Link href="/guides/llm-mentions" className="hover:text-white transition-colors">
              Why LLM mentions matter
            </Link>
            {' '}·{' '}
            <Link href="/guides" className="hover:text-white transition-colors">
              Guides
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16 px-6 border-t border-white/5 bg-black">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white flex items-center justify-center text-black font-black italic text-2xl">
              FI
            </div>
            <span className="font-bold text-2xl tracking-tighter uppercase italic">Flow Intent</span>
          </div>

          <div className="flex flex-wrap gap-10 text-xs font-mono text-zinc-500 uppercase tracking-widest justify-center">
            <Link href="/guides" className="hover:text-white transition-colors">Guides</Link>
            <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            <Link href="/resources" className="hover:text-white transition-colors">Resources</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>

          <div className="text-[10px] font-mono text-zinc-600 tracking-widest uppercase">
            © 2026 FLOW INTENT AGENTIC SEO. ALL RIGHTS SECURED.
          </div>
        </div>
      </footer>
    </div>
  )
}

function ValueProp({ number, title, description, icon: Icon }: { number: string; title: string, description: string, icon: LucideIcon }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
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
          <p className="text-xl text-zinc-400 leading-relaxed font-light">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
