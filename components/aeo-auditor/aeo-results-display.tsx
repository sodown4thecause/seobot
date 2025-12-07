'use client'

import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, AlertTriangle, TrendingUp, Shield, Zap, FileText, MessageSquare, Bot, RefreshCw, Target, Sparkles, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import type { AuditReport } from './types'

// Product features that map to recommendations
const PRODUCT_FEATURES = {
  schema: { name: 'Schema Generator', icon: FileText, description: 'Auto-generate Organization, FAQ, and Product schema markup' },
  content: { name: 'AI Content Writer', icon: Sparkles, description: 'Create AI-optimized content that gets cited by LLMs' },
  monitoring: { name: 'AI Visibility Monitor', icon: Target, description: 'Track how often AI platforms mention your brand' },
  competitor: { name: 'Competitor Intelligence', icon: TrendingUp, description: 'See how competitors rank in AI responses' },
  chat: { name: 'SEO Chat Assistant', icon: MessageSquare, description: 'Get instant answers about improving your SEO' },
}

export function AEOResultsDisplay({ report, brandName, onReset }: { report: AuditReport; brandName: string; onReset: () => void }) {
  const { scoreCard, hallucinations, knowledgeGraphStatus, actionPlan, summary } = report
  const getGradeColor = (g: string) => ({ A: 'from-green-500 to-emerald-500', B: 'from-emerald-500 to-teal-500', C: 'from-yellow-500 to-amber-500', D: 'from-orange-500 to-red-500' }[g] || 'from-red-500 to-rose-500')
  const getScoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : s >= 40 ? 'text-orange-400' : 'text-red-400'

  return (
    <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative z-10 space-y-8">
      {/* Score Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br ${getGradeColor(scoreCard.grade)} mb-4`}>
          <div className="w-28 h-28 rounded-2xl bg-black/50 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{scoreCard.grade}</span>
            <span className="text-sm text-white/70">{scoreCard.aeoScore}/100</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{brandName} - {scoreCard.verdict}</h3>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto">{summary}</p>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Entity Recognition', value: scoreCard.breakdown.entityRecognition, max: 25 },
          { label: 'Accuracy', value: scoreCard.breakdown.accuracyScore, max: 25 },
          { label: 'Citation Strength', value: scoreCard.breakdown.citationStrength, max: 25 },
          { label: 'Technical Readiness', value: scoreCard.breakdown.technicalReadiness, max: 25 },
        ].map((item, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-zinc-500 mb-1">{item.label}</div>
            <div className={`text-2xl font-bold ${getScoreColor((item.value / item.max) * 100)}`}>{item.value}/{item.max}</div>
            <Progress value={(item.value / item.max) * 100} className="h-1 mt-2" />
          </div>
        ))}
      </div>

      {/* Knowledge Graph & Hallucinations */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`rounded-xl p-5 border ${knowledgeGraphStatus.exists ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            {knowledgeGraphStatus.exists ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
            <span className="font-semibold text-white">Knowledge Graph</span>
          </div>
          <p className="text-sm text-zinc-400">{knowledgeGraphStatus.message}</p>
        </div>
        <div className={`rounded-xl p-5 border ${hallucinations.isHallucinating ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
          <div className="flex items-center gap-2 mb-2">
            {hallucinations.isHallucinating ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Shield className="w-5 h-5 text-green-400" />}
            <span className="font-semibold text-white">AI Accuracy</span>
          </div>
          <p className="text-sm text-zinc-400">{hallucinations.isHallucinating ? `${hallucinations.positive.length + hallucinations.negative.length} inaccuracies detected (${hallucinations.riskLevel} risk)` : 'No hallucinations detected - AI is accurate about your brand'}</p>
        </div>
      </div>

      {/* Action Plan with Product Features */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" />Action Plan - How Flow Intent Can Help</h4>
        <div className="space-y-3">
          {actionPlan.slice(0, 4).map((action, i) => {
            const feature = getFeatureForAction(action.category)
            return (
              <div key={i} className="bg-white/5 rounded-xl p-5 border border-white/10 hover:border-purple-500/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${action.priority === 'Critical' ? 'bg-red-500/20 text-red-300' : action.priority === 'High' ? 'bg-orange-500/20 text-orange-300' : 'bg-blue-500/20 text-blue-300'}`}>{action.priority}</span>
                      <span className="text-xs text-zinc-500">{action.category}</span>
                    </div>
                    <p className="text-white font-medium mb-1">{action.task}</p>
                    <p className="text-sm text-zinc-400 mb-3">{action.fix}</p>
                    {feature && (
                      <div className="flex items-center gap-2 bg-purple-500/10 rounded-lg px-3 py-2 border border-purple-500/20">
                        <feature.icon className="w-4 h-4 text-purple-400" />
                        <span className="text-sm text-purple-300"><strong>{feature.name}:</strong> {feature.description}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-zinc-500">Impact</div>
                    <div className="text-sm text-green-400">{action.impact.slice(0, 40)}...</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 rounded-2xl p-8 border border-purple-500/20 text-center">
        <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h4 className="text-xl font-bold text-white mb-2">Ready to Improve Your AI Visibility?</h4>
        <p className="text-zinc-400 mb-6 max-w-md mx-auto">Flow Intent gives you all the tools to optimize for ChatGPT, Perplexity, Google AI and more.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl">
              Start Free Trial<ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={onReset} className="border-white/10 text-white hover:bg-white/10 rounded-xl">
            <RefreshCw className="mr-2 w-4 h-4" />Audit Another Brand
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

function getFeatureForAction(category: string) {
  const mapping: Record<string, keyof typeof PRODUCT_FEATURES> = { Technical: 'schema', Content: 'content', Authority: 'monitoring', Accuracy: 'chat' }
  return PRODUCT_FEATURES[mapping[category]] || PRODUCT_FEATURES.chat
}

