'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, Shield, Zap, FileText, MessageSquare, Bot, RefreshCw, Target, Sparkles, Image, Clock, Award, AlertCircle, DollarSign, Globe, BarChart3, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import type { AuditReport, AuditResponse } from './types'
import { trackCTAClicked, generateSessionId } from '@/lib/analytics/audit-tracker'

// Product features with detailed solutions
const PRODUCT_FEATURES = {
  schema: { name: 'Schema Generator', icon: FileText, path: '/dashboard/content?tool=schema', color: 'blue' },
  content: { name: 'AI Content Writer', icon: Sparkles, path: '/dashboard/content?tool=writer', color: 'purple' },
  monitoring: { name: 'AI Visibility Monitor', icon: Target, path: '/dashboard/analytics', color: 'green' },
  competitor: { name: 'Competitor Intelligence', icon: TrendingUp, path: '/dashboard/opportunities', color: 'orange' },
  chat: { name: 'SEO Chat Assistant', icon: MessageSquare, path: '/dashboard', color: 'indigo' },
  images: { name: 'AI Image Generation', icon: Image, path: '/dashboard/content?tool=images', color: 'pink' },
}

interface QuickWin { feature: keyof typeof PRODUCT_FEATURES; title: string; description: string; impact: string; cta: string }

interface AEOResultsDisplayProps {
  report: AuditReport
  brandName: string
  onReset: () => void
  sessionId?: string
  toolsUsed?: string[]
  apiCost?: number
}

export function AEOResultsDisplay({ report, brandName, onReset, sessionId, toolsUsed, apiCost }: AEOResultsDisplayProps) {
  const handleCTAClick = (ctaType: string) => {
    trackCTAClicked({ sessionId: sessionId || generateSessionId(), brandName, score: report.scoreCard.aeoScore, grade: report.scoreCard.grade, ctaType })
  }
  const { scoreCard, hallucinations, knowledgeGraphStatus, summary, perception } = report
  const score = scoreCard.aeoScore
  const { entityRecognition, accuracyScore, citationStrength, technicalReadiness } = scoreCard.breakdown

  // Generate personalized quick wins based on score deficiencies
  const quickWins = generateQuickWins(score, entityRecognition, accuracyScore, citationStrength, technicalReadiness, hallucinations.isHallucinating)
  const urgencyMessage = getUrgencyMessage(score)
  const potentialImprovement = getPotentialImprovement(score)

  const getScoreColor = (s: number) => s >= 80 ? 'text-white' : s >= 60 ? 'text-zinc-300' : s >= 40 ? 'text-zinc-500' : 'text-zinc-600'

  return (
    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative z-10 space-y-12 text-left font-sans">
      {/* Score Header */}
      <div className="flex flex-col md:flex-row items-center gap-12 border-b border-white/10 pb-12">
        <div className="w-40 h-40 bg-white flex flex-col items-center justify-center shrink-0">
          <span className="text-7xl font-black italic text-black leading-none">{scoreCard.grade}</span>
          <span className="text-xs font-mono font-black text-black mt-2 tracking-widest">{score}/100</span>
        </div>
        <div className="space-y-4 text-center md:text-left">
          <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter italic leading-none">{brandName} - {scoreCard.verdict}</h3>
          <p className="text-zinc-400 text-lg font-light leading-tight uppercase tracking-tighter max-w-2xl">{summary}</p>
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-300">
            <AlertCircle className="w-3.5 h-3.5" /> {urgencyMessage}
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-px bg-white/10 border border-white/10">
        {[
          { label: 'ENTITY RECOGNITION', value: entityRecognition, max: 25, feature: 'schema' as const },
          { label: 'ACCURACY SCORE', value: accuracyScore, max: 25, feature: 'content' as const },
          { label: 'CITATION STRENGTH', value: citationStrength, max: 25, feature: 'monitoring' as const },
          { label: 'TECHNICAL READINESS', value: technicalReadiness, max: 25, feature: 'chat' as const },
        ].map((item, i) => {
          const pct = (item.value / item.max) * 100
          const needsWork = pct < 60
          return (
            <div key={i} className="bg-black p-8 group transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-zinc-600 tracking-widest leading-none">{item.label}</span>
                {needsWork && <AlertTriangle className="w-3 h-3 text-red-900" />}
              </div>
              <div className={`text-3xl font-black italic ${getScoreColor(pct)} tracking-tighter`}>{item.value} / {item.max}</div>
              <div className="w-full h-1 bg-zinc-900 mt-4 overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} className="h-full bg-white transition-all shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
              </div>
              {needsWork && <p className="text-[9px] font-mono text-zinc-500 mt-4 tracking-[0.2em] italic uppercase italic">SYSTEM GAP DETECTED</p>}
            </div>
          )
        })}
      </div>

      {/* Competitive Intelligence */}
      <div className="grid md:grid-cols-2 gap-px bg-white/10">
        <div className="bg-black p-8 space-y-4">
          <div className="flex items-center gap-4 text-xs font-mono font-bold uppercase tracking-widest text-white italic">
            <Users className="w-4 h-4 text-zinc-500" /> Competitor Intelligence
          </div>
          <div className="space-y-2">
            {perception?.competitors?.slice(0, 3).map((comp, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.03] text-[10px] font-mono uppercase tracking-widest">
                <span className="text-zinc-500">{comp.domain}</span>
                <span className="text-white italic">DETECTION: ACTIVE</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-black p-8 space-y-4">
          <div className="flex items-center gap-4 text-xs font-mono font-bold uppercase tracking-widest text-white italic">
            <Bot className="w-4 h-4 text-zinc-500" /> Perplexity Analysis
          </div>
          <p className="text-xs text-zinc-500 italic uppercase leading-relaxed font-light font-mono">
            {perception?.perplexitySummary || "Analyzing verified sources for entity mentions and sentiment alignment..."}
          </p>
        </div>
      </div>

      {/* APIS Used Badge */}
      <div className="bg-white/5 border border-white/10 p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-white flex items-center justify-center text-black font-black italic">!</div>
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest block text-white italic">Premium Intelligence Engine</span>
              <p className="text-[10px] font-mono text-zinc-600 mt-1 uppercase tracking-tight">ANALYZED VIA {(toolsUsed?.length || 7)} FEDERATION ENDPOINTS</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest block">REPORT VALUE</span>
            <span className="text-2xl font-black italic text-white">${(apiCost || 0.75).toFixed(2)} USD</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-2">
          {(toolsUsed || ['GPT-4-SONAR', 'FIRE-CRAWL-RECON', 'KG-ENTITIES', 'SEARCH-CONSULTANT-AI']).map((tool, i) => (
            <div key={i} className="text-[9px] font-mono text-zinc-700 uppercase tracking-widest flex items-center gap-2 italic">
              <span className="w-1 h-1 bg-zinc-800" /> {tool}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Wins */}
      <div className="space-y-8">
        <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter italic border-b border-white/10 pb-4">Strategy & Remediation</h4>
        <div className="grid md:grid-cols-2 gap-8 text-left">
          {quickWins.map((win, i) => {
            const feature = PRODUCT_FEATURES[win.feature]
            return (
              <div key={i} className="p-8 border border-white/5 hover:border-white/20 transition-all space-y-4 bg-black group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 font-mono text-[9px] text-zinc-800 italic group-hover:text-zinc-500 transition-colors uppercase tracking-[0.2em]">REMEDY_{i + 1}</div>
                <div className="inline-block px-3 py-1 bg-white text-black text-[9px] font-mono font-black uppercase tracking-widest mb-2 italic">
                  +{win.impact} GAIN
                </div>
                <h5 className="text-xl font-black text-white uppercase italic tracking-tighter leading-tight group-hover:translate-x-2 transition-transform duration-500">{win.title}</h5>
                <p className="text-sm text-zinc-500 font-light uppercase tracking-tighter leading-snug">{win.description}</p>
                <div className="pt-4 border-t border-white/[0.03] text-[10px] font-mono text-zinc-700 uppercase tracking-widest italic group-hover:text-zinc-300 transition-colors">
                  USE {feature.name} TO SYNTHESIZE
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-white p-12 md:p-20 text-center space-y-12">
        <div className="space-y-4">
          <h4 className="text-4xl md:text-6xl font-black text-black uppercase italic tracking-tighter leading-none italic">SECURE YOUR <br /> POSITION</h4>
          <p className="text-zinc-600 text-lg font-light uppercase tracking-tighter leading-tight max-w-xl mx-auto">
            Flow Intent's agentic platform resolves these vulnerabilities continuously. Do not leave your AI footprint to chance.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link href="/signup" onClick={() => handleCTAClick('start_free_trial')}>
            <Button size="lg" className="h-24 px-16 text-2xl bg-black text-white hover:bg-zinc-900 rounded-none font-black uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02]">
              Start Decryption<ArrowRight className="ml-4 w-6 h-6" />
            </Button>
          </Link>
          <button
            onClick={() => { handleCTAClick('audit_another'); onReset() }}
            className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-[0.4em] hover:text-black transition-colors"
          >
            [ RELOAD SYSTEM / AUDIT ANOTHER ]
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function generateQuickWins(score: number, entity: number, accuracy: number, citation: number, technical: number, hasHallucinations: boolean): QuickWin[] {
  const wins: QuickWin[] = []

  // Score 0-25 (F): Foundational AEO setup
  if (score <= 25) {
    wins.push({ feature: 'schema', title: 'Add Organization & FAQ Schema', description: 'Use our Schema Generator to add structured data in one prompt. This helps AI models understand your brand as an entity.', impact: '15-20 pts', cta: 'Generate schema markup instantly' })
    wins.push({ feature: 'content', title: 'Create EEAT-Optimized Content', description: 'Our AI Content Writer generates content with Experience, Expertise, Authoritativeness & Trustworthiness signals that AI models prioritize.', impact: '10-15 pts', cta: 'Write content that AI cites' })
  }
  // Score 26-50 (D): Content optimization
  else if (score <= 50) {
    if (accuracy < 15) wins.push({ feature: 'content', title: 'Fix Accuracy Issues with EEAT Content', description: 'AI is spreading misinformation about your brand. Create authoritative content with proper citations that AI will use as source of truth.', impact: '10-15 pts', cta: 'Correct AI misconceptions' })
    if (citation < 15) wins.push({ feature: 'monitoring', title: 'Track & Improve AI Citations', description: 'Monitor where AI mentions your brand and identify opportunities to get cited more frequently.', impact: '8-12 pts', cta: 'See your AI visibility' })
    wins.push({ feature: 'images', title: 'Add AI-Generated Visuals', description: 'Content with images ranks better. Our AI Image Generator creates branded visuals that enhance content quality.', impact: '5-8 pts', cta: 'Generate branded images' })
  }
  // Score 51-75 (C): Advanced optimization
  else if (score <= 75) {
    wins.push({ feature: 'competitor', title: 'Analyze Competitor AI Presence', description: 'See how competitors rank in AI responses and identify content gaps you can fill to capture their visibility.', impact: '8-12 pts', cta: 'Spy on competitor AI visibility' })
    wins.push({ feature: 'monitoring', title: 'Set Up Continuous Monitoring', description: 'Track your AI visibility over time and get alerts when your brand mentions change.', impact: '5-10 pts', cta: 'Start monitoring now' })
  }
  // Score 76-100 (A-B): Maintenance
  else {
    wins.push({ feature: 'monitoring', title: 'Maintain Your AI Visibility Lead', description: 'You\'re doing great! Set up monitoring to protect your position and catch any new opportunities.', impact: '3-5 pts', cta: 'Protect your position' })
    wins.push({ feature: 'competitor', title: 'Stay Ahead of Competitors', description: 'Monitor competitor movements and be first to capture new AI visibility opportunities.', impact: '3-5 pts', cta: 'Track competitor changes' })
  }

  // Add deficiency-specific recommendations
  if (entity < 15 && !wins.some(w => w.feature === 'schema')) {
    wins.unshift({ feature: 'schema', title: 'Boost Entity Recognition', description: 'AI doesn\'t recognize your brand as an entity. Add Organization, Product, and FAQ schema to establish your digital identity.', impact: '10-15 pts', cta: 'One-click schema generation' })
  }
  if (hasHallucinations && !wins.some(w => w.feature === 'content')) {
    wins.unshift({ feature: 'content', title: 'Stop AI Hallucinations', description: 'AI is making false claims about your brand. Create authoritative, fact-checked content that becomes the source of truth.', impact: '8-12 pts', cta: 'Create corrective content' })
  }
  if (technical < 15 && !wins.some(w => w.feature === 'chat')) {
    wins.push({ feature: 'chat', title: 'Get Technical SEO Guidance', description: 'Our SEO Chat Assistant provides instant technical recommendations tailored to your site.', impact: '5-10 pts', cta: 'Ask our AI assistant' })
  }

  return wins.slice(0, 4) // Return top 4 recommendations
}

function getUrgencyMessage(score: number): string {
  if (score <= 25) return 'Critical: Your brand is nearly invisible to AI - immediate action required'
  if (score <= 50) return 'Warning: Competitors are outranking you in AI responses'
  if (score <= 75) return 'Good progress, but significant opportunities remain'
  return 'Excellent! Focus on maintaining your competitive advantage'
}

function getPotentialImprovement(score: number): string {
  if (score <= 25) return '40-60'
  if (score <= 50) return '25-40'
  if (score <= 75) return '15-25'
  return '5-10'
}

