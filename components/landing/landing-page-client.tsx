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
            Powered by <span className="text-white font-semibold">Supadata</span> · <span className="text-white font-semibold">Reddit API</span> · <span className="text-white font-semibold">Real-Time Analysis</span>
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
                Your Audience Is on Reddit
                <br />
                <span className="bg-white text-black px-4 not-italic inline-block">Asking Questions</span>
                <br />
                Your Competitors Ignore.
              </h1>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase italic text-zinc-400 mt-4">
                Find the Content Gaps They&apos;re <span className="text-white">Missing</span> — Before They Do.
              </h2>

              <div className="flex flex-col md:flex-row items-baseline gap-8 pt-8">
                <div className="max-w-xl">
                  <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.4em] mb-4">
                    REDDIT CONTENT GAP AUDIT / FREE LEAD MAGNET
                  </p>
                  <p className="text-xl md:text-2xl text-zinc-300 font-light leading-tight uppercase tracking-tight">
                    Stop guessing what content to create. We scan thousands of Reddit discussions to find the exact questions your audience is asking — and your competitors aren&apos;t answering. Get a prioritized content brief in 60 seconds.
                  </p>
                  <div className="mt-6 grid gap-2 text-left text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                    <p>01 - We scan relevant subreddits for real questions</p>
                    <p>02 - We find content gaps your competitors miss</p>
                    <p>03 - You get a ranked brief with thread sources + action items</p>
                  </div>
                </div>

                <div className="flex-1 flex justify-end items-end">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Link href="/reddit-gap">
                      <Button
                        size="lg"
                        className="h-14 w-full sm:w-auto px-8 text-base md:h-16 md:px-10 md:text-lg bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-wider group border-4 border-white shadow-[0_24px_60px_rgba(255,255,255,0.08)]"
                      >
                        Find My Content Gaps
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
            Find My Content Gaps
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Product Demo */}
      <section className="relative z-10 py-20 px-6 border-b border-white/5">
        <div className="container mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={itemVariants}
            className="max-w-4xl mx-auto space-y-6 text-center"
          >
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">Product Demo</p>
            <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight">See It In Action</h2>
            <div className="relative w-full overflow-hidden border border-white/10 bg-black" style={{ paddingBottom: '56.25%' }}>
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
      <section className="relative z-10 py-16 border-b border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">60s</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">To Your Content Gap Report</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">1000s</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">Reddit Threads Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black text-white mb-2">50+</div>
              <div className="text-sm font-mono uppercase tracking-widest text-zinc-500">Subreddits Available</div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 bg-white/[0.02] border-y border-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl space-y-5 rounded-none border border-white/10 bg-black/40 p-10">
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">Reddit Content Gap Audit</p>
            <h3 className="text-3xl font-black uppercase tracking-tight">Find What Reddit Is Asking That Your Competitors Ignore</h3>
            <p className="text-zinc-400">
              We scan thousands of Reddit discussions across relevant subreddits, identify high-intent questions your competitors aren&apos;t answering, and deliver a ranked content brief with sources and action items.
            </p>
            <Link href="/reddit-gap" className="inline-flex items-center gap-2 border border-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] hover:bg-white hover:text-black transition-colors">
              Get My Free Content Gap Report
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
                title="Enter Your Topic"
                description="Tell us what you sell or write about. No complex setup — just a topic and optional competitor URL to focus the analysis."
                icon={MessageSquare}
              />
              <ValueProp
                number="02"
                title="We Scan Reddit"
                description="Our agents discover relevant subreddits, analyze thousands of threads in real-time, and extract high-intent questions your competitors are ignoring."
                icon={Search}
              />
              <ValueProp
                number="03"
                title="Get Your Brief"
                description="Receive a prioritized content gap report with source threads, engagement scores, and a 7/30/90-day action plan — ready to execute or hand to your team."
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
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Discovery</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Find hidden subreddits</h3>
              <p className="text-zinc-400 leading-relaxed">
                Auto-detect the communities where your audience hangs out. We surface relevant subreddits you might not even know exist.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Analysis</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Extract real questions</h3>
              <p className="text-zinc-400 leading-relaxed">
                Parse thousands of threads to find the exact questions your audience asks — ranked by engagement, intent, and competitive gap.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Briefs</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Get ready-to-publish briefs</h3>
              <p className="text-zinc-400 leading-relaxed">
                Each content gap comes with source threads, recommended content type, and priority ranking — everything you need to start writing.
              </p>
            </div>
            <div className="bg-black/40 border border-white/10 p-8 rounded-none">
              <p className="text-sm font-mono uppercase tracking-widest text-zinc-500 mb-3">Scorecard</p>
              <h3 className="text-2xl font-bold uppercase tracking-tight mb-3">Measure your gap score</h3>
              <p className="text-zinc-400 leading-relaxed">
                Get an overall gap score, opportunity breakdown, and 7/30/90-day action plan prioritized by effort and impact.
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
              Find My Content Gaps
            </Button>
          </Link>
          <p className="mt-6 text-sm font-mono uppercase tracking-wider text-zinc-600">
            60-second scan — no signup — see what your audience is asking on Reddit
          </p>
          <div className="mt-10 text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">
            Prefer to learn first?{' '}
            <Link href="/blog" className="hover:text-white transition-colors">
              Why Reddit content gaps matter
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
