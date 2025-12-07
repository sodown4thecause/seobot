'use client'

import Link from 'next/link'
import { ArrowRight, MessageSquare, LineChart, Sparkles, Zap, Globe, Lock, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Logo } from '@/components/ui/logo'
import { Navbar } from '@/components/navbar'
import { AEOAuditor } from '@/components/aeo-auditor'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40%] h-[40%] bg-cyan-900/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative z-10 pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.1] text-xs font-medium text-indigo-300 mb-8 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              New: Advanced Competitor Analysis
            </motion.div>

            <motion.h1 variants={itemVariants} className="text-6xl md:text-8xl font-bold tracking-tight mb-8 leading-[1.1]">
              <span className="block text-gradient">Master Your SEO</span>
              <span className="block text-gradient-primary">With AI Intent</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
              Stop guessing. Start ranking. Our AI analyzes search intent, generates optimized content, and tracks your success in real-time.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg bg-white text-black hover:bg-zinc-200 rounded-full shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)] transition-all duration-300">
                  Start Ranking Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#demo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-white/10 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm">
                  <Play className="mr-2 w-4 h-4 fill-current" />
                  View Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AEO Auditor - Lead Magnet */}
      <AEOAuditor />

      {/* Stats/Social Proof */}
      <section className="border-y border-white/[0.05] bg-white/[0.01] backdrop-blur-sm py-16 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12">
          {[
            { label: 'Active Users', value: '2,000+' },
            { label: 'Keywords Tracked', value: '500K+' },
            { label: 'Articles Generated', value: '1M+' },
            { label: 'Avg. Traffic Increase', value: '145%' },
          ].map((stat, i) => (
            <div key={i} className="text-center group cursor-default">
              <div className="text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform duration-300 ease-out">{stat.value}</div>
              <div className="text-sm text-zinc-500 uppercase tracking-wider font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">Everything needed for modern SEO</h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">Comprehensive tools to dominate the search results, built with next-generation AI.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MessageSquare,
                title: 'Conversational Research',
                desc: 'Chat with your SEO data. Ask questions, get insights, and formulate strategies naturally.'
              },
              {
                icon: LineChart,
                title: 'Competitor Intelligence',
                desc: 'Spy on competitors\' keywords and backlink strategies to find your winning edge.'
              },
              {
                icon: Zap,
                title: 'Instant Content',
                desc: 'Generate high-quality, SEO-optimized articles that are ready to publish in seconds.'
              },
              {
                icon: Globe,
                title: 'Global Rank Tracking',
                desc: 'Monitor your keyword positions across any country and language with precise accuracy.'
              },
              {
                icon: Sparkles,
                title: 'AI Suggestions',
                desc: 'Get proactive recommendations on how to improve your existing content and meta tags.'
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                desc: 'Your data is encrypted and secure. Built for teams that value privacy and compliance.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -10 }}
                className="glass-card p-8 rounded-3xl group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center mb-6 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-colors duration-300">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-zinc-400 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          <div className="glass-panel rounded-[2.5rem] p-16 text-center relative overflow-hidden border border-white/10">
            {/* Decorative glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/20 blur-[100px]" />

            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-white">Ready to scale your organic traffic?</h2>
              <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
                Join thousands of marketers who are already using Flow Intent to automate their SEO workflows.
              </p>
              <Link href="/signup">
                <Button size="lg" className="h-16 px-10 text-xl bg-white text-black hover:bg-zinc-200 rounded-full shadow-2xl shadow-white/10">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/[0.05] bg-black/40 backdrop-blur-xl relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Logo className="w-6 h-6" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">Flow Intent</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            <Link href="#" className="hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="text-sm text-zinc-600">
            © 2025 Flow Intent. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}