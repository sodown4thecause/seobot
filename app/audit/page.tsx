'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AEOAuditor } from '@/components/aeo-auditor'
import { Logo } from '@/components/ui/logo'

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.015] pointer-events-none" />
      </div>

      {/* Navigation */}
      <nav className="relative z-20 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <Logo />
            <span className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">Flow Intent</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Home
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pb-20">
        <AEOAuditor />

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="max-w-4xl mx-auto px-6 mt-12 text-center"
        >
          <div className="flex flex-wrap items-center justify-center gap-8 text-zinc-500 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Results in 30 seconds
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Actionable insights
            </div>
          </div>
        </motion.div>

        {/* What we check */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-4xl mx-auto px-6 mt-16"
        >
          <h2 className="text-2xl font-bold text-white text-center mb-8">What We Analyze</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'AI Mentions', description: 'How often ChatGPT, Perplexity, and Claude mention your brand in responses', icon: '🤖' },
              { title: 'Knowledge Graph', description: "Whether Google's Knowledge Graph recognizes your brand as an entity", icon: '🔍' },
              { title: 'Technical Readiness', description: 'Schema markup, FAQs, and structured data that AIs can understand', icon: '⚙️' },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-colors">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-zinc-500 text-sm">
          © {new Date().getFullYear()} Flow Intent. All rights reserved.
        </div>
      </footer>
    </div>
  )
}

