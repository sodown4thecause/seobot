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
    <section className="py-20 px-6 relative z-10" id="aeo-audit">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 text-xs font-medium text-purple-300 mb-6">
            <Shield className="w-3.5 h-3.5" />Free AI Trust Audit
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
            Is AI Lying About Your Brand?
          </h2>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Discover how ChatGPT, Perplexity, and Google AI perceive your brand. Get actionable fixes in 30 seconds.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-8 md:p-12 border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[80px] pointer-events-none" />

          <AnimatePresence mode="wait">
            {step === 'input' && <AuditInputForm url={url} brandName={brandName} error={error} onUrlChange={setUrl} onBrandChange={setBrandName} onSubmit={handleAuditSubmit} />}
            {step === 'loading' && <AuditLoadingState brandName={brandName} />}
            {step === 'email' && report && <EmailCaptureForm email={email} score={report.scoreCard.aeoScore} grade={report.scoreCard.grade} isSubmitting={isSubmitting} onEmailChange={setEmail} onSubmit={handleEmailSubmit} />}
            {step === 'results' && report && <AEOResultsDisplay report={report} brandName={brandName} onReset={resetAudit} sessionId={sessionIdRef.current} toolsUsed={toolsUsed} apiCost={apiCost} />}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}

function AuditInputForm({ url, brandName, error, onUrlChange, onBrandChange, onSubmit }: {
  url: string; brandName: string; error: string | null; onUrlChange: (v: string) => void; onBrandChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <motion.form key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={onSubmit} className="relative z-10 space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Website URL</label>
          <Input type="url" placeholder="https://yourcompany.com" value={url} onChange={(e) => onUrlChange(e.target.value)} required className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-300">Brand Name</label>
          <Input type="text" placeholder="Your Company" value={brandName} onChange={(e) => onBrandChange(e.target.value)} required className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl" />
        </div>
      </div>
      {error && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
      <Button type="submit" size="lg" className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/25">
        Analyze My Brand Trust<ArrowRight className="ml-2 w-5 h-5" />
      </Button>
      <p className="text-center text-xs text-zinc-500">Free audit • No credit card required • Results in 30 seconds</p>
    </motion.form>
  )
}

function AuditLoadingState({ brandName }: { brandName: string }) {
  const steps = [{ icon: Globe, label: 'Scraping your website...' }, { icon: Bot, label: 'Querying AI platforms...' }, { icon: Target, label: 'Analyzing perception...' }, { icon: FileText, label: 'Generating report...' }]
  const [currentStep, setCurrentStep] = useState(0)
  useEffect(() => { const i = setInterval(() => setCurrentStep((p) => (p < steps.length - 1 ? p + 1 : p)), 8000); return () => clearInterval(i) }, [steps.length])
  return (
    <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 py-12 text-center">
      <div className="w-20 h-20 mx-auto mb-8 relative">
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/20" /><div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center"><Sparkles className="w-8 h-8 text-purple-400" /></div>
      </div>
      <h3 className="text-2xl font-bold text-white mb-2">Auditing {brandName}</h3><p className="text-zinc-400 mb-8">This usually takes 30-45 seconds</p>
      <div className="max-w-sm mx-auto space-y-3">
        {steps.map((s, i) => (<div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${i === currentStep ? 'bg-purple-500/10 border border-purple-500/30' : i < currentStep ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/5 border border-white/5'}`}>
          {i < currentStep ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : i === currentStep ? <Loader2 className="w-5 h-5 text-purple-400 animate-spin" /> : <s.icon className="w-5 h-5 text-zinc-500" />}
          <span className={i <= currentStep ? 'text-white' : 'text-zinc-500'}>{s.label}</span></div>))}
      </div>
    </motion.div>
  )
}

function EmailCaptureForm({ email, score, grade, isSubmitting, onEmailChange, onSubmit }: { email: string; score: number; grade: string; isSubmitting: boolean; onEmailChange: (v: string) => void; onSubmit: (e: React.FormEvent) => void }) {
  const getGradeColor = (g: string) => ({ A: 'text-green-400 bg-green-500/20', B: 'text-emerald-400 bg-emerald-500/20', C: 'text-yellow-400 bg-yellow-500/20', D: 'text-orange-400 bg-orange-500/20' }[g] || 'text-red-400 bg-red-500/20')
  return (
    <motion.div key="email" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative z-10 py-8 text-center">
      <div className="mb-8"><div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl ${getGradeColor(grade)} mb-4`}><span className="text-5xl font-bold">{grade}</span></div>
        <h3 className="text-3xl font-bold text-white mb-2">Your AEO Score: {score}/100</h3><p className="text-zinc-400">Your detailed report is ready! Enter your email to unlock insights.</p></div>
      <form onSubmit={onSubmit} className="max-w-md mx-auto space-y-4">
        <Input type="email" placeholder="your@email.com" value={email} onChange={(e) => onEmailChange(e.target.value)} required className="h-14 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 rounded-xl text-center" />
        <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock My Full Report'}</Button>
        <p className="text-xs text-zinc-500">We&apos;ll also send you weekly AI visibility tips. Unsubscribe anytime.</p>
      </form>
    </motion.div>
  )
}

