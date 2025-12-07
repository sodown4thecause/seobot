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

  const getGradeColor = (g: string) => ({ A: 'from-green-500 to-emerald-500', B: 'from-emerald-500 to-teal-500', C: 'from-yellow-500 to-amber-500', D: 'from-orange-500 to-red-500' }[g] || 'from-red-500 to-rose-500')
  const getScoreColor = (s: number) => s >= 80 ? 'text-green-400' : s >= 60 ? 'text-yellow-400' : s >= 40 ? 'text-orange-400' : 'text-red-400'

  return (
    <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="relative z-10 space-y-8">
      {/* Score Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-32 h-32 rounded-3xl bg-gradient-to-br ${getGradeColor(scoreCard.grade)} mb-4`}>
          <div className="w-28 h-28 rounded-2xl bg-black/50 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-white">{scoreCard.grade}</span>
            <span className="text-sm text-white/70">{score}/100</span>
          </div>
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">{brandName} - {scoreCard.verdict}</h3>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto mb-3">{summary}</p>
        {/* Urgency Banner */}
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm ${score <= 50 ? 'bg-red-500/20 text-red-300' : score <= 75 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-green-500/20 text-green-300'}`}>
          <AlertCircle className="w-4 h-4" />{urgencyMessage}
        </div>
      </div>

      {/* Score Breakdown with Deficiency Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Entity Recognition', value: entityRecognition, max: 25, feature: 'schema' as const },
          { label: 'Accuracy', value: accuracyScore, max: 25, feature: 'content' as const },
          { label: 'Citation Strength', value: citationStrength, max: 25, feature: 'monitoring' as const },
          { label: 'Technical Readiness', value: technicalReadiness, max: 25, feature: 'chat' as const },
        ].map((item, i) => {
          const pct = (item.value / item.max) * 100
          const needsWork = pct < 60
          return (
            <div key={i} className={`rounded-xl p-4 border transition-all ${needsWork ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40' : 'bg-white/5 border-white/10'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-500">{item.label}</span>
                {needsWork && <AlertTriangle className="w-3 h-3 text-red-400" />}
              </div>
              <div className={`text-2xl font-bold ${getScoreColor(pct)}`}>{item.value}/{item.max}</div>
              <Progress value={pct} className="h-1 mt-2" />
              {needsWork && <p className="text-xs text-red-400 mt-2">Use {PRODUCT_FEATURES[item.feature].name} →</p>}
            </div>
          )
        })}
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
          <p className="text-sm text-zinc-400">{hallucinations.isHallucinating ? `${hallucinations.positive.length + hallucinations.negative.length} inaccuracies detected (${hallucinations.riskLevel} risk)` : 'No hallucinations detected'}</p>
        </div>
      </div>

      {/* Premium APIs Used Section */}
      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl p-5 border border-emerald-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-white">Premium APIs Used in This Audit</span>
          </div>
          <span className="text-sm text-emerald-300 font-medium">
            ${(apiCost || perception?.apiCosts?.total || 0.75).toFixed(2)} value
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {(toolsUsed || [
            'DataForSEO LLM Mentions',
            'DataForSEO ChatGPT Scraper',
            'DataForSEO Knowledge Graph',
            'DataForSEO Competitor Analysis',
            'Perplexity Sonar AI',
            'Firecrawl Web Scraper',
            'Google Gemini 2.0 Flash',
          ]).map((tool, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-zinc-400">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{tool}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500 mt-3">
          This audit analyzed your brand across 7 premium APIs. With Flow Intent, get <strong className="text-emerald-300">unlimited access</strong> to all these tools through simple prompts.
        </p>
      </div>

      {/* Competitor Comparison Section */}
      {perception?.competitors && perception.competitors.length > 0 && (
        <div className="bg-white/5 rounded-xl p-5 border border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-orange-400" />
            <span className="font-semibold text-white">Competitor AI Visibility</span>
          </div>
          <div className="space-y-3">
            {perception.competitors.slice(0, 3).map((comp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-zinc-500" />
                  <span className="text-sm text-white">{comp.domain}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  {comp.organicTraffic && (
                    <span className="text-zinc-400">
                      <BarChart3 className="w-3 h-3 inline mr-1" />
                      {comp.organicTraffic.toLocaleString()} traffic
                    </span>
                  )}
                  {comp.hasSchema !== undefined && (
                    <span className={comp.hasSchema ? 'text-green-400' : 'text-red-400'}>
                      {comp.hasSchema ? '✓ Schema' : '✗ No Schema'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Flow Intent's Competitor Intelligence tool tracks these competitors continuously and alerts you to changes.
          </p>
        </div>
      )}

      {/* Perplexity Insight Section */}
      {perception?.perplexitySummary && (
        <div className="bg-blue-500/10 rounded-xl p-5 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">What Perplexity AI Says</span>
          </div>
          <p className="text-sm text-zinc-300 italic">"{perception.perplexitySummary}"</p>
          {perception.perplexitySources && perception.perplexitySources.length > 0 && (
            <p className="text-xs text-zinc-500 mt-2">
              Sources cited: {perception.perplexitySources.slice(0, 3).join(', ')}
            </p>
          )}
        </div>
      )}

      {/* Quick Wins Section - Personalized Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-400" />Quick Wins with Flow Intent</h4>
          <span className="text-sm text-green-400 flex items-center gap-1"><TrendingUp className="w-4 h-4" />+{potentialImprovement} points possible</span>
        </div>
        <div className="space-y-3">
          {quickWins.map((win, i) => {
            const feature = PRODUCT_FEATURES[win.feature]
            const FeatureIcon = feature.icon
            return (
              <div key={i} className="bg-gradient-to-r from-purple-500/5 to-indigo-500/5 rounded-xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <FeatureIcon className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{win.title}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-300">+{win.impact}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-3">{win.description}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-purple-300 bg-purple-500/10 px-2 py-1 rounded">{feature.name}</span>
                      <span className="text-xs text-zinc-500">{win.cta}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* EEAT Content Highlight */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-bold text-white mb-2">EEAT-Optimized Content Generation</h4>
            <p className="text-sm text-zinc-400 mb-3">
              Flow Intent's AI Content Writer creates content optimized for <strong className="text-purple-300">Experience, Expertise, Authoritativeness, and Trustworthiness</strong> -
              the signals that both Google and AI models use to determine which sources to cite.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['AI Image Generation', 'Structured Data', 'Citation Optimization', 'Fact Verification'].map((tag) => (
                <span key={tag} className="px-2 py-1 text-xs rounded-full bg-white/10 text-zinc-300">{tag}</span>
              ))}
            </div>
            <p className="text-xs text-zinc-500">Every piece of content includes AI-generated images and proper schema markup for maximum AI visibility.</p>
          </div>
        </div>
      </div>

      {/* Competitive Disadvantage Warning */}
      {score < 60 && (
        <div className="bg-red-500/10 rounded-xl p-5 border border-red-500/20">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-300 mb-1">Your Competitors Are Already Optimizing for AI</h4>
              <p className="text-sm text-zinc-400">
                Brands that don't optimize for Answer Engines will lose visibility as AI-powered search grows.
                With a score of {score}, you're at risk of being outranked by competitors in ChatGPT, Perplexity, and Google AI responses.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main CTA */}
      <div className="bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-2xl p-8 border border-purple-500/30 text-center">
        <Bot className="w-12 h-12 text-purple-400 mx-auto mb-4" />
        <h4 className="text-xl font-bold text-white mb-2">Fix All Issues with One Platform</h4>
        <p className="text-zinc-400 mb-2 max-w-lg mx-auto">
          Flow Intent's SEO/AEO chatbot gives you access to Schema Generator, AI Content Writer, Visibility Monitor, and more - all in one conversation.
        </p>
        <p className="text-sm text-purple-300 mb-6">Start improving your AEO score today →</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup" onClick={() => handleCTAClick('start_free_trial')}>
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-purple-500/25">
              Start Free Trial<ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button variant="outline" size="lg" onClick={() => { handleCTAClick('audit_another'); onReset() }} className="border-white/10 text-white hover:bg-white/10 rounded-xl">
            <RefreshCw className="mr-2 w-4 h-4" />Audit Another Brand
          </Button>
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

