'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { motion } from 'framer-motion'
import { ArrowRight, AlertCircle, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { ContentZoneProvider, useContentZone } from '@/components/content-zone/content-zone-context'
import { ContentTypeSelector, ContentType, getContentTypeConfig } from '@/components/content-zone/content-type-selector'
import { CompetitorManager, Competitor } from '@/components/content-zone/competitor-manager'
import { KeywordManager } from '@/components/content-zone/keyword-manager'
import { ProgressTracker, ProgressEvent } from '@/components/content-zone/progress-tracker'
import { ContentResult } from '@/components/content-zone/content-result'
import { EEATScoreDisplay } from '@/components/content-zone/eeat-score-display'
import { cn } from '@/lib/utils'

interface Keyword {
  id: string
  text: string
  searchVolume?: number
  difficulty?: number
}

function ContentZoneInner() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [onboardingUrl, setOnboardingUrl] = useState('')
  const {
    businessContext,
    brandVoice,
    competitors: storedCompetitors,
    keywords: storedKeywords,
    isLoading: contextLoading,
    hasCompletedOnboarding
  } = useContentZone()

  // Form state
  const [contentType, setContentType] = useState<ContentType>('blog_post')
  const [topic, setTopic] = useState('')
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [secondaryKeywords, setSecondaryKeywords] = useState<Keyword[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [tone, setTone] = useState('')
  const [wordCount, setWordCount] = useState(1200)
  const [audience, setAudience] = useState('')

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<ProgressEvent[]>([])
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [qualityScores, setQualityScores] = useState<any>(null)
  const [metadata, setMetadata] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)

  // Update tone when content type changes
  useEffect(() => {
    const config = getContentTypeConfig(contentType)
    setTone(config.defaultTone)
    setWordCount(Math.round((config.wordCountRange[0] + config.wordCountRange[1]) / 2))
  }, [contentType])

  // Pre-populate from RAG data
  useEffect(() => {
    if (storedKeywords.length > 0 && !primaryKeyword) {
      // Use highest priority keyword as primary if available
      const highPriority = storedKeywords.find(k => k.priority === 'high')
      if (highPriority) {
        setPrimaryKeyword(highPriority.keyword)
      } else if (storedKeywords[0]) {
        setPrimaryKeyword(storedKeywords[0].keyword)
      }
      // Add remaining as secondary keywords
      const remaining = storedKeywords.slice(1).map(k => ({
        id: k.id,
        text: k.keyword,
        searchVolume: k.searchVolume ?? undefined,
        difficulty: k.keywordDifficulty ?? undefined,
      }))
      if (remaining.length > 0) {
        setSecondaryKeywords(remaining)
      }
    }
  }, [storedKeywords, primaryKeyword])

  // Pre-populate competitors from RAG
  useEffect(() => {
    if (storedCompetitors.length > 0 && competitors.length === 0) {
      setCompetitors(storedCompetitors.map(c => ({
        id: c.id,
        url: c.domain.startsWith('http') ? c.domain : `https://${c.domain}`,
        isAnalyzing: false,
        isSelected: true,
        metrics: {
          domainAuthority: c.domainAuthority ?? undefined,
          monthlyTraffic: c.monthlyTraffic ?? undefined,
        }
      })))
    }
  }, [storedCompetitors, competitors.length])

  const handleGenerate = async () => {
    if (!topic.trim() || !primaryKeyword.trim()) {
      setError('Please fill in the topic and primary keyword')
      return
    }

    setIsGenerating(true)
    setProgress([])
    setGeneratedContent(null)
    setQualityScores(null)
    setMetadata(null)
    setError(null)

    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/content/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          type: contentType,
          keywords: [primaryKeyword, ...secondaryKeywords.map(k => k.text)],
          tone,
          wordCount,
          competitorUrls: competitors.filter(c => c.isSelected).map(c => c.url),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok || !response.body) {
        throw new Error('Failed to start content generation')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const lines = part.split('\n')
          const eventLine = lines.find(l => l.startsWith('event:'))
          const dataLines = lines.filter(l => l.startsWith('data:'))

          if (!eventLine || dataLines.length === 0) continue

          const event = eventLine.replace('event:', '').trim()
          const data = dataLines.map(l => l.replace('data:', '').trim()).join('\n')

          if (event === 'progress') {
            try {
              const update = JSON.parse(data) as ProgressEvent
              setProgress(prev => [...prev, update])
            } catch {
              // Ignore parsing errors
            }
          } else if (event === 'complete') {
            try {
              const result = JSON.parse(data)
              setGeneratedContent(result.content)
              setQualityScores(result.qualityScores)
              setMetadata(result.metadata)
            } catch {
              // Ignore parsing errors
            }
          } else if (event === 'error') {
            try {
              const errorData = JSON.parse(data)
              setError(errorData.message || errorData.details || 'Generation failed')
            } catch {
              setError('Generation failed')
            }
          } else if (event === 'aborted') {
            setError('Content generation was cancelled')
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Content generation was cancelled')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate content')
      }
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  if (!isLoaded || contextLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="animate-pulse text-zinc-400">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-zinc-400">Please sign in to use Content Zone.</div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-6 lg:p-8 bg-zinc-950">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-semibold text-zinc-100 mb-2">Content Zone</h1>
          <p className="text-sm text-zinc-400 max-w-2xl">
            Create SEO-optimized content powered by AI. We'll analyze your competitors,
            research your topic, and generate high-quality content that ranks.
          </p>
        </motion.div>

        {/* Onboarding Flow */}
        {!hasCompletedOnboarding && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-6 rounded-2xl border border-zinc-700 bg-zinc-900/50"
          >
            <div>
              <h3 className="text-lg font-semibold text-zinc-100 mb-1">Get Started</h3>
              <p className="text-sm text-zinc-400 mb-4">
                Enter your website URL to analyze your brand and discover competitors.
              </p>
              <div className="flex gap-3">
                <Input
                  value={onboardingUrl}
                  onChange={(e) => setOnboardingUrl(e.target.value)}
                  placeholder="https://your-website.com"
                  className="flex-1 bg-zinc-950 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
                />
                <Button
                  className="bg-zinc-800 hover:bg-zinc-700"
                  onClick={() => {
                    router.push('/dashboard?startOnboarding=true')
                  }}
                >
                  Analyze
                </Button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">
                We'll extract your brand voice, identify competitors, and suggest target keywords.
              </p>
            </div>
          </motion.div>
        )}

        {generatedContent ? (
          /* Results View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Button
              variant="outline"
              onClick={() => {
                setGeneratedContent(null)
                setProgress([])
                setError(null)
              }}
              className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
            >
              ← Create New Content
            </Button>

            <ContentResult
              content={generatedContent}
              qualityScores={qualityScores}
              metadata={metadata}
              onRegenerate={handleGenerate}
            />
          </motion.div>
        ) : (
          /* Form View */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Content Type */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                <ContentTypeSelector selectedType={contentType} onTypeChange={setContentType} />
              </div>

              {/* Basic Info */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 space-y-4">
                <h3 className="text-lg font-medium text-zinc-100 mb-4">Content Details</h3>

                <div className="space-y-2">
                  <Label className="text-zinc-200">Topic / Title</Label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., The Ultimate Guide to AI SEO in 2026"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">Target Audience</Label>
                  <Input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g., Marketing managers at B2B SaaS companies"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-200">Tone & Style</Label>
                  <Input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="e.g., Professional yet approachable"
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-zinc-200">Word Count: {wordCount.toLocaleString()}</Label>
                    <span className="text-xs text-zinc-500">
                      {getContentTypeConfig(contentType).wordCountRange[0].toLocaleString()} - {getContentTypeConfig(contentType).wordCountRange[1].toLocaleString()} recommended
                    </span>
                  </div>
                  <Slider
                    value={[wordCount]}
                    onValueChange={(value) => setWordCount(value[0])}
                    min={getContentTypeConfig(contentType).wordCountRange[0]}
                    max={getContentTypeConfig(contentType).wordCountRange[1]}
                    step={100}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Keywords */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                <KeywordManager
                  keywords={secondaryKeywords}
                  onKeywordsChange={setSecondaryKeywords}
                  primaryKeyword={primaryKeyword}
                  onPrimaryKeywordChange={setPrimaryKeyword}
                />
              </div>

              {/* Competitors */}
              <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                <CompetitorManager
                  competitors={competitors}
                  onCompetitorsChange={setCompetitors}
                  targetKeyword={primaryKeyword}
                />
              </div>

              {/* Error Display */}
              {error && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim() || !primaryKeyword.trim()}
                className="w-full h-14 text-lg font-medium bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    Generate Content
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress Tracker */}
              {isGenerating && (
                <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 sticky top-6">
                  <ProgressTracker
                    progress={progress}
                    isGenerating={isGenerating}
                    onCancel={handleCancel}
                  />
                </div>
              )}

              {/* Tips */}
              {!isGenerating && (
                <div className="space-y-6 sticky top-6">
                  {/* User Context Panel */}
                  {hasCompletedOnboarding && businessContext && (
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                      <h4 className="font-medium text-zinc-100 mb-4">
                        Your Profile
                      </h4>

                      {/* Website URL */}
                      {businessContext.websiteUrl && (
                        <div className="mb-3">
                          <a
                            href={businessContext.websiteUrl.startsWith('http')
                              ? businessContext.websiteUrl
                              : `https://${businessContext.websiteUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-zinc-300 hover:text-zinc-100 flex items-center gap-1"
                          >
                            {businessContext.websiteUrl.replace(/^https?:\/\//, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {/* Brand Voice */}
                      {brandVoice && (
                        <div className="mb-3">
                          <p className="text-xs text-zinc-500 mb-1">Brand Voice</p>
                          <p className="text-sm text-zinc-300">
                            {brandVoice.tone}{brandVoice.style ? ` • ${brandVoice.style}` : ''}
                          </p>
                        </div>
                      )}

                      {/* Goals */}
                      {businessContext.goals && businessContext.goals.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-zinc-500 mb-1">Goals</p>
                          <div className="flex flex-wrap gap-1">
                            {businessContext.goals.slice(0, 3).map((goal, i) => (
                              <span
                                key={i}
                                className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300"
                              >
                                {goal}
                              </span>
                            ))}
                            {businessContext.goals.length > 3 && (
                              <span className="text-xs text-zinc-500">
                                +{businessContext.goals.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Industry */}
                      {businessContext.industry && (
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Industry</p>
                          <p className="text-sm text-zinc-300">{businessContext.industry}</p>
                        </div>
                      )}

                      {/* Quick Stats */}
                      <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-2 gap-3">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-zinc-100">{storedKeywords.length}</p>
                          <p className="text-xs text-zinc-500">Keywords</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-zinc-100">{storedCompetitors.length}</p>
                          <p className="text-xs text-zinc-500">Competitors</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* EEAT Score Display */}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                    <h4 className="font-medium text-zinc-100 mb-4">
                      Quality Scores
                    </h4>
                    <EEATScoreDisplay scores={qualityScores} />
                  </div>

                  {/* Tips */}
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50">
                    <h4 className="font-medium text-zinc-100 mb-4">Tips for Better Content</h4>
                    <ul className="space-y-3 text-sm text-zinc-400">
                      <li className="flex items-start gap-2">
                        <span className="text-zinc-300">•</span>
                        Be specific with your topic - narrow topics rank better
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-zinc-300">•</span>
                        Add 3-5 relevant competitors for better analysis
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-zinc-300">•</span>
                        Primary keyword should appear in first 100 words
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function ContentZonePage() {
  return (
    <ContentZoneProvider>
      <ContentZoneInner />
    </ContentZoneProvider>
  )
}
