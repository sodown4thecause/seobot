'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Loader2, Shield, AlertTriangle, CheckCircle2, Sparkles, Target, FileText, Bot, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AEOResultsDisplay } from './aeo-results-display'
import type { AuditReport } from './types'
import { generateSessionId, trackAuditStarted, trackAuditCompleted, trackAuditFailed, trackEmailCaptured, trackResultsViewed } from '@/lib/analytics/audit-tracker'

type AuditStep = 'input' | 'loading' | 'email' | 'results'

export function AEOAuditor() {
  const [step, setStep] = useState<AuditStep>('input')
  const [url, setUrl] = useState('')
  const [brandName, setBrandName] = useState('')
  const [email, setEmail] = useState('')
  const [report, setReport] = useState<AuditReport | null>(null)
  const [toolsUsed, setToolsUsed] = useState<string[]>([])
  const [apiCost, setApiCost] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const sessionIdRef = useRef<string>(generateSessionId())

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !brandName) return
    setError(null)
    setStep('loading')
    const sessionId = sessionIdRef.current

    // Track audit started
    trackAuditStarted({ sessionId, brandName, url })

    try {
      const response = await fetch('/api/audit/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, brandName }),
      })
      if (!response.ok) {
        const errorData = await response.json()
        // Handle rate limit specially
        if (response.status === 429) {
          throw new Error(errorData.error || 'You have already used your free audit today. Sign up for unlimited audits!')
        }
        throw new Error(errorData.error || 'Audit failed')
      }
      const data = await response.json()
      setReport(data.report)
      setToolsUsed(data.toolsUsed || [])
      setApiCost(data.apiCost || 0)
      setStep('email')
      // Track audit completed
      trackAuditCompleted({ sessionId, brandName, url, score: data.report.scoreCard.aeoScore, grade: data.report.scoreCard.grade })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('input')
      // Track audit failed
      trackAuditFailed({ sessionId, brandName, url, properties: { error: err instanceof Error ? err.message : 'Unknown error' } })
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !report) return
    setIsSubmitting(true)
    const sessionId = sessionIdRef.current
    try {
      await fetch('/api/audit/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, brandName, url, score: report.scoreCard.aeoScore, grade: report.scoreCard.grade, report, source: 'landing_page' }),
      })
      // Track email captured
      trackEmailCaptured({ sessionId, brandName, url, email, score: report.scoreCard.aeoScore, grade: report.scoreCard.grade })
    } catch (err) {
      console.error('Failed to save lead:', err)
    }
    setIsSubmitting(false)
    setStep('results')
    // Track results viewed
    trackResultsViewed({ sessionId, brandName, url, email, score: report.scoreCard.aeoScore, grade: report.scoreCard.grade })
  }

  const resetAudit = () => {
    sessionIdRef.current = generateSessionId() // New session for new audit
    setStep('input')
    setUrl('')
    setBrandName('')
    setEmail('')
    setReport(null)
    setError(null)
  }

  return (
    <section className="py-32 px-6 relative z-10 font-sans" id="aeo-audit">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-xs font-mono uppercase tracking-[0.4em] text-white mb-10">
            <Shield className="w-4 h-4 text-white" /> Free AI Trust Audit
          </div>
          <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter uppercase italic leading-tight text-white">
            Is AI Lying About Your <span className="text-white bg-zinc-900 border border-white/20 px-4">Brand?</span>
          </h2>
          <p className="text-zinc-400 text-xl md:text-2xl font-light max-w-3xl mx-auto leading-tight uppercase tracking-tight">
            Discover how ChatGPT, Perplexity, and Google AI perceive your brand.
            <span className="block font-mono text-sm mt-4 text-white font-bold tracking-[0.2em] bg-white/5 py-3 inline-block px-6 border border-white/10">GET ACTIONABLE FIXES IN 30 SECONDS</span>
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="bg-zinc-950 border-2 border-white/10 relative overflow-hidden group hover:border-white/40 transition-all duration-700 shadow-2xl">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.03] blur-[120px] pointer-events-none" />

          <div className="p-8 md:p-20">
            <AnimatePresence mode="wait">
              {step === 'input' && <AuditInputForm url={url} brandName={brandName} error={error} onUrlChange={setUrl} onBrandChange={setBrandName} onSubmit={handleAuditSubmit} />}
              {step === 'loading' && <AuditLoadingState brandName={brandName} />}
              {step === 'email' && report && <EmailCaptureForm email={email} score={report.scoreCard.aeoScore} grade={report.scoreCard.grade} isSubmitting={isSubmitting} onEmailChange={setEmail} onSubmit={handleEmailSubmit} />}
              {step === 'results' && report && <AEOResultsDisplay report={report} brandName={brandName} onReset={resetAudit} sessionId={sessionIdRef.current} toolsUsed={toolsUsed} apiCost={apiCost} />}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function AuditInputForm({ url, brandName, error, onUrlChange, onBrandChange, onSubmit }: {
  url: string; brandName: string; error: string | null; onUrlChange: (v: string) => void; onBrandChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <motion.form key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={onSubmit} className="relative z-10 space-y-16">
      <div className="grid md:grid-cols-2 gap-16">
        <div className="space-y-6">
          <label className="text-xs font-mono uppercase tracking-[0.4em] text-white block font-black">Website URL / Domain</label>
          <Input
            type="url"
            placeholder="WWW.YOURCOMPANY.COM"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
            required
            className="h-20 bg-transparent border-0 border-b-2 border-white/20 text-white placeholder:text-zinc-700 rounded-none focus-visible:ring-0 focus-visible:border-white px-0 text-2xl font-black transition-all uppercase tracking-tighter"
          />
        </div>
        <div className="space-y-6">
          <label className="text-xs font-mono uppercase tracking-[0.4em] text-white block font-black">Brand Identity</label>
          <Input
            type="text"
            placeholder="YOUR COMPANY NAME"
            value={brandName}
            onChange={(e) => onBrandChange(e.target.value)}
            required
            className="h-20 bg-transparent border-0 border-b-2 border-white/20 text-white placeholder:text-zinc-700 rounded-none focus-visible:ring-0 focus-visible:border-white px-0 text-2xl font-black transition-all uppercase tracking-tighter"
          />
        </div>
      </div>
      {error && <div className="flex items-center gap-4 text-white text-sm bg-red-950 border-2 border-red-500/50 p-8 uppercase tracking-widest font-mono italic shadow-lg"><AlertTriangle className="w-6 h-6 shrink-0 text-red-500" />{error}</div>}

      <div className="flex flex-col md:flex-row items-center justify-between gap-12 pt-10 border-t-2 border-white/5">
        <div className="space-y-2">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em] font-black italic">
            SYSTEM STATUS: [ ACTIVE ]
          </p>
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.3em] font-black italic">
            LATENCY: 30 SECONDS
          </p>
        </div>
        <Button type="submit" size="lg" className="h-24 px-20 text-2xl bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-[0.1em] group transition-all shrink-0 border-4 border-white shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 active:scale-95">
          Analyze Brand Trust<ArrowRight className="ml-4 w-8 h-8 group-hover:translate-x-3 transition-transform" />
        </Button>
      </div>
    </motion.form>
  )
}

function AuditLoadingState({ brandName }: { brandName: string }) {
  const steps = [{ icon: Globe, label: 'WEB RECONNAISSANCE...' }, { icon: Bot, label: 'LLM PERCEPTION CHECK...' }, { icon: Target, label: 'ANOMALY DETECTION...' }, { icon: FileText, label: 'DATA SYNTHESIS...' }]
  const [currentStep, setCurrentStep] = useState(0)
  useEffect(() => { const i = setInterval(() => setCurrentStep((p) => (p < steps.length - 1 ? p + 1 : p)), 8000); return () => clearInterval(i) }, [steps.length])
  return (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 py-12 text-center">
      <div className="w-24 h-24 mx-auto mb-12 relative">
        <div className="absolute inset-0 border border-white/10 animate-[spin_3s_linear_infinite]" />
        <div className="absolute inset-4 border border-white/20 animate-[spin_2s_linear_infinite_reverse]" />
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-black">{Math.floor(((currentStep + 1) / steps.length) * 100)}%</div>
      </div>
      <h3 className="text-3xl font-black text-white mb-4 italic uppercase tracking-tighter">Analyzing {brandName}</h3>
      <p className="text-[10px] font-mono text-zinc-600 mb-12 uppercase tracking-[0.4em]">Processing verified endpoints...</p>

      <div className="max-w-md mx-auto grid gap-4">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center justify-between p-4 border transition-all duration-500 font-mono text-[10px] uppercase tracking-widest ${i === currentStep ? 'bg-white text-black border-white' : i < currentStep ? 'border-zinc-800 text-zinc-500 line-through opacity-50' : 'border-zinc-900 text-zinc-800'}`}>
            <span>{s.label}</span>
            {i < currentStep ? <CheckCircle2 className="w-3 h-3" /> : i === currentStep ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>PENDING</span>}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

function EmailCaptureForm({ email, score, grade, isSubmitting, onEmailChange, onSubmit }: { email: string; score: number; grade: string; isSubmitting: boolean; onEmailChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void }) {
  return (
    <motion.div key="email" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 py-8 text-center bg-black">
      <div className="mb-12">
        <div className="w-32 h-32 bg-white flex items-center justify-center text-black mx-auto mb-8">
          <span className="text-7xl font-black italic">{grade}</span>
        </div>
        <h3 className="text-4xl font-black text-white mb-4 uppercase tracking-tighter italic">AEO Score: {score}/100</h3>
        <p className="text-zinc-500 font-light max-w-sm mx-auto uppercase tracking-tighter leading-tight">
          System has detected critical gaps in your AI trust footprint. Enter your credentials to unlock the full intelligence report.
        </p>
      </div>
      <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-8">
        <div className="space-y-2 text-left">
          <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600 block">Intelligence Recipient / Email</label>
          <Input
            type="email"
            placeholder="YOUR@EMAIL.COM"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            className="h-16 bg-transparent border-0 border-b border-white/10 text-white placeholder:text-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-white px-0 text-xl font-bold transition-all uppercase text-center"
          />
        </div>
        <Button type="submit" disabled={isSubmitting} className="w-full h-20 text-xl bg-white text-black hover:bg-zinc-200 rounded-none font-black uppercase tracking-[0.1em] transition-all">
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'Decrypt Intelligence Report'}</Button>
        <p className="text-[10px] font-mono text-zinc-700 uppercase tracking-widest mt-6 italic">
          * CONFIDENTIAL DATA • SECURE TRANSMISSION *
        </p>
      </form>
    </motion.div>
  )
}

