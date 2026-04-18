'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/logo'

export function AuditPageClient() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/6 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-zinc-800/40 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none" />
      </div>

      <nav className="relative z-20 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo />
            <span className="text-lg font-semibold text-white group-hover:text-white transition-colors">Flow Intent</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pb-20">
        <div className="max-w-4xl mx-auto px-6 pt-12">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic text-center mb-6">Free AI Trust Audit</h1>
          <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-10">
            See how ChatGPT, Perplexity, and Google AI describe your brand - and what to publish to earn more accurate mentions.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
            <p className="text-xs font-mono uppercase tracking-[0.35em] text-zinc-500">Canonical Flow</p>
            <h2 className="mt-3 text-2xl font-bold">Start the full audit on the /reddit-gap page</h2>
            <p className="mt-3 text-zinc-400">
              The lead magnet now runs in one place so visibility controls and share artifacts stay consistent.
            </p>
            <Link
              href="/reddit-gap"
              className="mt-6 inline-flex items-center justify-center bg-white px-8 py-4 rounded-none font-black uppercase tracking-[0.1em] text-black hover:bg-zinc-200 transition-colors"
            >
              Go to /reddit-gap
            </Link>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto px-6 mt-12 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Results in 30 seconds
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Actionable insights
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto px-6 mt-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">What We Analyze</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'AI Mentions', description: 'How often ChatGPT, Perplexity, and Claude mention your brand in responses', icon: 'BOT' },
              { title: 'Knowledge Graph', description: "Whether Google's Knowledge Graph recognizes your brand as an entity", icon: 'GRAPH' },
              { title: 'Technical Readiness', description: 'Schema markup, FAQs, and structured data that AIs can understand', icon: 'SCHEMA' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/30 transition-colors">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm space-y-2">
          <div>(c) {new Date().getFullYear()} Flow Intent. All rights reserved.</div>
          <div className="text-xs">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy
            </Link>{' '}
            -{' '}
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
