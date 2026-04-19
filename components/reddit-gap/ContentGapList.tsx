'use client'

import { useState } from 'react'
import { ArrowRight, ExternalLink, Flame, MessageSquare, TrendingUp, Mail, CheckCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RedditGapResults, ContentGap } from '@/lib/reddit-gap/types'

interface ContentGapListProps {
  results: RedditGapResults
  auditId: string | null
  requireEmail?: boolean
}

function GapScoreBar({ score, label }: { score: number; label: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-mono">
        <span>{label}</span>
        <span className={score >= 70 ? 'text-emerald-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'}>
          {score}%
        </span>
      </div>
      <div className="h-2 bg-white/5 border border-white/10">
        <div
          className={`h-full transition-all duration-1000 ${
            score >= 70 ? 'bg-emerald-400' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
          }`}
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  )
}

function IntentBadge({ intent }: { intent: 'high' | 'medium' | 'low' }) {
  const colors = {
    high: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  }
  return (
    <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 border ${colors[intent]}`}>
      {intent} intent
    </span>
  )
}

function CompetitionBadge({ level }: { level: 'low' | 'medium' | 'high' }) {
  const colors = {
    low: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
  }
  return (
    <span className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 border ${colors[level]}`}>
      {level} comp
    </span>
  )
}

function ContentGapCard({ gap, index }: { gap: ContentGap; index: number }) {
  return (
    <div className="border border-white/10 bg-white/[0.02] p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-zinc-500 mb-1">GAP #{index + 1}</p>
          <h3 className="text-lg font-bold text-white">&ldquo;{gap.question}&rdquo;</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <IntentBadge intent={gap.commercialIntent} />
          <CompetitionBadge level={gap.competitionLevel} />
        </div>
      </div>

      {gap.context && (
        <p className="text-sm text-zinc-400">{gap.context}</p>
      )}

      <GapScoreBar score={gap.engagementScore} label="Engagement" />

      <div className="flex flex-wrap gap-3 text-xs font-mono text-zinc-500">
        <span className="flex items-center gap-1">
          <Flame className="w-3 h-3 text-orange-400" />
          {gap.sourceThreads.length} threads
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3 h-3 text-blue-400" />
          asked {gap.frequency}x
        </span>
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-400" />
          {gap.recommendedContentType}
        </span>
      </div>

      {gap.sourceThreads.length > 0 && (
        <div className="pt-2 border-t border-white/5 space-y-1">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-wider">Source threads</p>
          {gap.sourceThreads.slice(0, 2).map((thread) => (
            <a
              key={thread.url}
              href={thread.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-zinc-400 hover:text-white transition-colors truncate"
            >
              r/{thread.subreddit} · {thread.score} upvotes · {thread.title.slice(0, 60)}
              <ExternalLink className="w-2.5 h-2.5 inline ml-1" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

export function ContentGapList({ results, auditId, requireEmail = false }: ContentGapListProps) {
  const { scorecard, contentGaps, discoveredSubreddits, analyzedThreads, totalQuestionsFound, analysisConfidence } = results
  const [email, setEmail] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(!requireEmail)

  const handleSendEmail = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email address')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setIsSending(true)
    setEmailError('')

    try {
      const response = await fetch('/api/reddit-gap/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          results,
          auditId: auditId || undefined
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSent(true)
        setEmail('')
      } else {
        setEmailError(data.error || 'Failed to send email')
      }
    } catch (error) {
      setEmailError('Network error. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  const handleUnlock = async () => {
    if (!email.trim()) {
      setEmailError('Please enter your email address to unlock')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setIsSending(true)
    setEmailError('')

    try {
      const response = await fetch('/api/reddit-gap/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          results,
          auditId: auditId || undefined
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailSent(true)
        setIsUnlocked(true)
      } else {
        setEmailError(data.error || 'Failed to send email')
      }
    } catch (error) {
      setEmailError('Network error. Please try again.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-400 mb-2">
          Analysis Complete
        </p>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight">
          Content Gap Report
        </h2>
        <p className="mt-3 text-zinc-400 max-w-xl mx-auto">
          We analyzed {analyzedThreads} threads across {discoveredSubreddits.length} subreddits and found{' '}
          {contentGaps.length} content gaps your competitors are missing.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/[0.03] border border-white/10 p-4 text-center">
          <div className="text-3xl font-black text-white">{scorecard.overallGapScore}</div>
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">Gap Score</div>
        </div>
        <div className="bg-white/[0.03] border border-white/10 p-4 text-center">
          <div className="text-3xl font-black text-white">{totalQuestionsFound}</div>
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">Questions Found</div>
        </div>
        <div className="bg-white/[0.03] border border-white/10 p-4 text-center">
          <div className="text-3xl font-black text-white">{analyzedThreads}</div>
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">Threads Analyzed</div>
        </div>
        <div className="bg-white/[0.03] border border-white/10 p-4 text-center">
          <div className="text-3xl font-black text-white">{analysisConfidence}%</div>
          <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">Confidence</div>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold uppercase tracking-wider mb-4">Scoring Breakdown</h3>
        <div className="space-y-3">
          <GapScoreBar score={scorecard.opportunityScore} label="Opportunity" />
          <GapScoreBar score={scorecard.engagementDensity} label="Engagement Density" />
          <GapScoreBar score={scorecard.questionCoverage} label="Question Coverage" />
          <GapScoreBar score={scorecard.competitiveAdvantage} label="Competitive Advantage" />
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-3 mb-6">
          <h3 className="text-lg font-bold uppercase tracking-wider">
            {scorecard.momentumCategory.label}
          </h3>
          <span className="text-xs font-mono text-zinc-500">— {scorecard.momentumCategory.summary}</span>
        </div>
      </div>

      <div className="relative">
        <h3 className="text-lg font-bold uppercase tracking-wider mb-4">
          Content Gaps ({contentGaps.length})
        </h3>

        {/* Actual content - shown when unlocked */}
        {isUnlocked && (
          <div className="space-y-4">
            {contentGaps.map((gap, index) => (
              <ContentGapCard key={gap.id} gap={gap} index={index} />
            ))}
          </div>
        )}

        {/* Blur overlay when locked */}
        {!isUnlocked && (
          <>
            <div className="space-y-4 blur-sm opacity-50 pointer-events-none select-none">
              <div className="border border-white/10 bg-white/[0.02] p-5">
                <div className="h-20 bg-white/5 rounded" />
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-5">
                <div className="h-20 bg-white/5 rounded" />
              </div>
              <div className="border border-white/10 bg-white/[0.02] p-5">
                <div className="h-20 bg-white/5 rounded" />
              </div>
            </div>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex items-center justify-center">
              <div className="bg-black border border-emerald-500/30 p-6 max-w-sm w-full mx-4 text-center">
                <Lock className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                  Unlock Full Report
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  Enter your email to see all {contentGaps.length} content gaps
                </p>
                <div className="space-y-2">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError('')
                    }}
                    className={`w-full h-10 px-3 bg-white/[0.03] border text-white placeholder:text-zinc-600 rounded-none text-sm ${
                      emailError ? 'border-red-500' : 'border-white/10'
                    }`}
                    disabled={isSending}
                  />
                  <Button
                    onClick={handleUnlock}
                    disabled={isSending}
                    className="w-full h-10 bg-emerald-500 text-black hover:bg-emerald-400 rounded-none font-bold uppercase tracking-wider text-sm disabled:opacity-50"
                  >
                    {isSending ? 'Unlocking...' : 'Unlock & Email Report'}
                  </Button>
                  {emailError && (
                    <p className="text-xs text-red-400 font-mono">{emailError}</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {isUnlocked && scorecard.strengths.length > 0 && (
        <div>
          <h3 className="text-lg font-bold uppercase tracking-wider mb-4">Key Strengths</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {scorecard.strengths.map((strength, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/10 p-4">
                <h4 className="font-bold text-white text-sm">{strength.title}</h4>
                <p className="text-xs text-zinc-400 mt-1">{strength.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {scorecard.actionPlan && (
        <div>
          <h3 className="text-lg font-bold uppercase tracking-wider mb-4">Action Plan</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/[0.03] border border-white/10 p-4">
              <h4 className="text-sm font-bold text-white mb-2">Next 7 Days</h4>
              <ul className="space-y-1">
                {scorecard.actionPlan.next7Days.map((action, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-4">
              <h4 className="text-sm font-bold text-white mb-2">Next 30 Days</h4>
              <ul className="space-y-1">
                {scorecard.actionPlan.next30Days.map((action, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/[0.03] border border-white/10 p-4">
              <h4 className="text-sm font-bold text-white mb-2">Next 90 Days</h4>
              <ul className="space-y-1">
                {scorecard.actionPlan.next90Days.map((action, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1">
                    <ArrowRight className="w-3 h-3 mt-0.5 text-zinc-400 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="text-center pt-8">
        <p className="text-xs font-mono text-zinc-600 mb-2">
          Want a content brief delivered to your inbox? Enter your email below.
        </p>
        <div className="max-w-md mx-auto space-y-3">
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setEmailError('')
                setEmailSent(false)
              }}
              className={`flex-1 h-12 px-4 bg-white/[0.03] border text-white placeholder:text-zinc-600 rounded-none ${
                emailError ? 'border-red-500' : 'border-white/10'
              }`}
              disabled={isSending || emailSent}
            />
            <Button
              onClick={handleSendEmail}
              disabled={isSending || emailSent}
              className="h-12 bg-white text-black hover:bg-zinc-200 rounded-none font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                  Sending...
                </div>
              ) : emailSent ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Sent!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send Brief
                </div>
              )}
            </Button>
          </div>
          
          {emailError && (
            <p className="text-xs text-red-400 font-mono">{emailError}</p>
          )}
          
          {emailSent && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-none">
              <p className="text-xs text-emerald-400 font-mono">
                ✓ Content gap brief sent successfully! Check your inbox.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}