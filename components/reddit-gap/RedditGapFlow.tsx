'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { TopicForm } from './TopicForm'
import { SubredditDiscovery } from './SubredditDiscovery'
import { ProgressStages } from './ProgressStages'
import { ContentGapList } from './ContentGapList'
import { EmailGate } from './EmailGate'
import { Button } from '@/components/ui/button'
import type {
  SubredditDiscovery as SubredditDiscoveryType,
  RedditGapResults,
} from '@/lib/reddit-gap/types'

type Stage = 'form' | 'discovery' | 'loading' | 'preview' | 'gate' | 'results'
type AnalysisPhase = 'idle' | 'searching-reddit' | 'scraping-threads' | 'analyzing-gaps' | 'scoring' | 'done' | 'done'

export function RedditGapFlow() {
  const [stage, setStage] = useState<Stage>('form')
  const [topic, setTopic] = useState('')
  const [url, setUrl] = useState('')
  const [discoveredSubreddits, setDiscoveredSubreddits] = useState<SubredditDiscoveryType[]>([])
  const [selectedSubreddits, setSelectedSubreddits] = useState<string[]>([])
  const [results, setResults] = useState<RedditGapResults | null>(null)
  const [auditId, setAuditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState<AnalysisPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [gateEmail, setGateEmail] = useState('')

  const handleDetect = async (inputTopic: string, inputUrl?: string) => {
    setTopic(inputTopic)
    if (inputUrl) setUrl(inputUrl)
    setLoading(true)
    setPhase('searching-reddit')
    setError(null)

    try {
      const response = await fetch('/api/reddit-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'detect', topic: inputTopic, url: inputUrl }),
      })

      const payload = await response.json()

      if (!response.ok || !payload.detected) {
        throw new Error(payload.message || 'No subreddits found for this topic.')
      }

      setDiscoveredSubreddits(payload.detected)
      setSelectedSubreddits(payload.detected.slice(0, 5).map((s: SubredditDiscoveryType) => s.name))
      setStage('discovery')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed. Please try again.')
    } finally {
      setLoading(false)
      setPhase('idle')
    }
  }

  const handleRun = async () => {
    setLoading(true)
    setPhase('searching-reddit')
    setError(null)

    const phaseProgression: AnalysisPhase[] = ['searching-reddit', 'scraping-threads', 'analyzing-gaps', 'scoring']

    const phaseTimer = setInterval(() => {
      setPhase((prev) => {
        const currentIndex = phaseProgression.indexOf(prev)
        if (currentIndex < phaseProgression.length - 1) {
          return phaseProgression[currentIndex + 1]
        }
        return prev
      })
    }, 4000)

    try {
      const response = await fetch('/api/reddit-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          topic,
          url: url || undefined,
          email: gateEmail,
          confirmedSubreddits: selectedSubreddits,
        }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.message || 'Analysis failed. Please try again.')
      }

      setResults(payload.results)
      setAuditId(payload.auditId || null)
      setPhase('done')
      setStage('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.')
      setPhase('idle')
    } finally {
      clearInterval(phaseTimer)
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (email: string) => {
    setGateEmail(email)

    try {
      await fetch('/api/reddit-gap/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          topic,
          url: url || undefined,
          overallGapScore: results?.scorecard?.overallGapScore || results?.topGapPreview?.engagementScore,
        }),
      })
    } catch {
      // Lead capture is non-blocking
    }

    await handleRun()
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <AnimatePresence mode="wait">
          {stage === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 mb-4">
                  Reddit Content Gap Auditor
                </p>
                <h1 className="text-4xl md:text-6xl font-black tracking-tight uppercase italic text-gradient">
                  Find What Reddit
                  <br />
                  Is <span className="bg-white text-black px-4 not-italic inline-block">Asking</span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-zinc-400 font-light max-w-2xl mx-auto">
                  Your audience is asking questions on Reddit that your competitors aren&apos;t answering. We&apos;ll show you exactly what they want.
                </p>
                <div className="mt-4 grid grid-cols-3 gap-4 text-xs font-mono uppercase tracking-[0.2em] text-zinc-500 max-w-xl mx-auto">
                  <p>01 - We scan Reddit for real questions</p>
                  <p>02 - We find content gaps competitors miss</p>
                  <p>03 - You get a ranked content brief</p>
                </div>
              </div>
              <TopicForm onSubmit={handleDetect} loading={loading} error={error} />
            </motion.div>
          )}

          {stage === 'discovery' && (
            <motion.div
              key="discovery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500 mb-2">
                  Subreddit Discovery
                </p>
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                  Found {discoveredSubreddits.length} relevant communities
                </h2>
                <p className="mt-2 text-zinc-400">
                  Select the subreddits you want to analyze. We&apos;ll search for high-engagement threads and extract the questions people are asking.
                </p>
              </div>
              <SubredditDiscovery
                subreddits={discoveredSubreddits}
                selected={selectedSubreddits}
                onSelectionChange={setSelectedSubreddits}
                onAnalyze={() => {
                  setStage('preview')
                }}
                topic={topic}
              />
            </motion.div>
          )}

          {stage === 'preview' && results?.topGapPreview && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <p className="text-xs font-mono uppercase tracking-[0.3em] text-emerald-400 mb-2">
                  Preview
                </p>
                <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight">
                  Your Top Content Gap
                </h2>
              </div>
              <div className="bg-white/[0.03] border border-white/10 p-6 rounded-none mb-8">
                <h3 className="text-lg font-bold text-white mb-2">
                  &ldquo;{results.topGapPreview.question}&rdquo;
                </h3>
                <p className="text-zinc-400 text-sm">{results.topGapPreview.context}</p>
                <div className="flex gap-4 mt-3 text-xs font-mono text-zinc-500">
                  <span className="text-emerald-400">Engagement: {results.topGapPreview.engagementScore}/100</span>
                  <span>Frequency: {results.topGapPreview.frequency}x</span>
                  <span>Intent: {results.topGapPreview.commercialIntent}</span>
                </div>
              </div>
              <EmailGate
                topic={topic}
                onSubmit={handleEmailSubmit}
                loading={loading}
                error={error}
              />
            </motion.div>
          )}

          {(stage === 'loading' || (stage === 'preview' && loading)) && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-6" />
                <h2 className="text-2xl font-black uppercase tracking-tight mb-4">
                  Analyzing Reddit Discussions
                </h2>
                <ProgressStages phase={phase} />
              </div>
            </motion.div>
          )}

          {stage === 'results' && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <ContentGapList results={results} auditId={auditId} />
            </motion.div>
          )}
        </AnimatePresence>

        {stage === 'discovery' && (
          <div className="text-center mt-6">
            <Button
              variant="ghost"
              className="text-zinc-500 hover:text-white"
              onClick={() => {
                setStage('form')
                setError(null)
              }}
            >
              ← Change topic
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}