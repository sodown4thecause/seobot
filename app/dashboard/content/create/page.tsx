'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

function CreateContentForm() {
  const searchParams = useSearchParams()
  const keywordFromUrl = searchParams?.get('keyword') || ''
  
  interface ContentAnalysisData {
    keyword: string
    volume: number
    difficulty: string
    relatedKeywords: string[]
    recommendedFormat: string
    recommendedTitle: string
    topCompetitors: Array<{ url: string; position: number; wordCount: number }>
    contentGaps: string[]
  }

  const [step, setStep] = useState(1)
  const [keyword, setKeyword] = useState(keywordFromUrl)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [contentData, setContentData] = useState<ContentAnalysisData | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [researchData, setResearchData] = useState<{
    mainContent: string;
    citations: string[];
    stats: string;
    trends: string;
  } | null>(null)
  const [businessProfileId, setBusinessProfileId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  // Get business profile on mount
  useEffect(() => {
    const getProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        setBusinessProfileId(profile.id)
      }
    }
    getProfile()
  }, [])

  const handleKeywordAnalysis = async () => {
    if (!keyword || !businessProfileId) return
    
    setIsAnalyzing(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setIsAnalyzing(false)
        return
      }

      // Call keyword analysis API
      const response = await fetch('/api/content/analyze-keyword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          keyword,
          businessProfileId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze keyword')
      }

      const result = await response.json()
      
      if (result.success) {
        setContentData({
          keyword: result.data.keyword,
          volume: result.data.volume,
          difficulty: result.data.difficulty,
          relatedKeywords: result.data.relatedKeywords,
          recommendedFormat: result.data.recommendedFormat,
          recommendedTitle: result.data.recommendedTitle,
          topCompetitors: result.data.topCompetitors,
          contentGaps: result.data.contentGaps,
        })
        setStep(2)
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (err) {
      console.error('Analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze keyword')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateContent = async () => {
    if (!keyword || !businessProfileId || !contentData) return

    setIsGenerating(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Not authenticated')
        setIsGenerating(false)
        return
      }

      // First, do research if we haven't already
      let research = researchData
      if (!research) {
        const researchResponse = await fetch('/api/content/research', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            keyword,
            businessProfileId,
          }),
        })

        if (researchResponse.ok) {
          const researchResult = await researchResponse.json()
          if (researchResult.success) {
            research = researchResult.data
            setResearchData(research)
          }
        }
      }

      // Now generate content with streaming
      const generateResponse = await fetch('/api/content/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          keyword,
          businessProfileId,
          researchData: research,
          analysisData: {
            recommendedFormat: contentData.recommendedFormat,
            recommendedTitle: contentData.recommendedTitle,
            topCompetitors: contentData.topCompetitors,
            contentGaps: contentData.contentGaps,
          },
        }),
      })

      if (!generateResponse.ok) {
        throw new Error('Failed to generate content')
      }

      // Stream the response
      const reader = generateResponse.body?.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          fullContent += chunk
          setGeneratedContent(fullContent)
        }
      }

      setStep(4)
    } catch (err) {
      console.error('Generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Keyword' },
            { num: 2, label: 'Analysis' },
            { num: 3, label: 'Generate' },
            { num: 4, label: 'Review' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all",
                  step >= s.num 
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                )}>
                  {step > s.num ? <Check className="w-5 h-5" /> : s.num}
                </div>
                <span className="text-xs mt-2 font-medium text-gray-600">{s.label}</span>
              </div>
              {idx < 3 && (
                <div className={cn(
                  "flex-1 h-1 mx-2",
                  step > s.num ? "bg-purple-600" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Keyword Input */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl border border-gray-200 p-8"
          >
            <div className="flex items-start space-x-4 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Let&apos;s create some amazing content! ✍️
                </h2>
                <p className="text-gray-600">
                  Enter a keyword or topic you want to write about, and I&apos;ll analyze the opportunity.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Keyword
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g., vegan leather alternatives"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  onKeyDown={(e) => e.key === 'Enter' && handleKeywordAnalysis()}
                />
              </div>

              <button
                onClick={handleKeywordAnalysis}
                disabled={!keyword || isAnalyzing}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing keyword...</span>
                  </>
                ) : (
                  <>
                    <span>Analyze & Continue</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Analysis Results */}
        {step === 2 && contentData?.keyword && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                ✨ Keyword Analysis: &quot;{contentData.keyword}&quot;
              </h3>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Search Volume</div>
                  <div className="text-2xl font-bold text-gray-900">{contentData.volume.toLocaleString()}/mo</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Difficulty</div>
                  <div className="text-2xl font-bold text-gray-900">{contentData.difficulty}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Est. Traffic</div>
                  <div className="text-2xl font-bold text-gray-900">~850/mo</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Related Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {contentData.relatedKeywords.map((kw: string, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Top Competitors</h4>
                  <div className="space-y-2">
                    {contentData.topCompetitors.map((comp, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-900">#{comp.position}</span>
                          <span className="text-gray-600 ml-2">{comp.url}</span>
                        </div>
                        <span className="text-sm text-gray-500">{comp.wordCount} words</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">💡 Content Gaps (Your Advantage)</h4>
                  <ul className="space-y-1">
                    {contentData.contentGaps.map((gap: string, idx: number) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border border-purple-200 p-6">
              <h4 className="font-semibold text-gray-900 mb-2">📋 Recommended Format</h4>
              <p className="text-gray-700 mb-4">{contentData.recommendedFormat}</p>
              <p className="text-sm font-medium text-gray-900">
                Suggested Title: &quot;{contentData.recommendedTitle}&quot;
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Looks Good - Generate Content</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Generate Content */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white rounded-xl border border-gray-200 p-8"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🔨 Creating your article...
              </h2>
              <p className="text-gray-600 mb-8">
                This takes about 90 seconds. I&apos;m researching, outlining, and writing optimized content.
              </p>

              <div className="space-y-3 text-left max-w-md mx-auto">
                {[
                  'Researching latest vegan leather innovations...',
                  'Analyzing top-ranking competitors...',
                  'Building article structure...',
                  'Writing introduction...',
                  'Creating comparison table...',
                  'Generating FAQ section...',
                  'Optimizing for SEO...',
                  'Adding internal link suggestions...',
                ].map((text, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-700">{text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="mt-8 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? 'Generating...' : 'Start Generation'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Review Content */}
        {step === 4 && generatedContent && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ✨ Your article is ready!
              </h2>
              <p className="text-gray-600">
                SEO Score: <span className="font-bold text-green-600">87/100</span> (Excellent!)
              </p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-gray-700">
                  {generatedContent}
                </pre>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Create Another
              </button>
              <button className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
                Save as Draft
              </button>
              <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                Publish Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function CreateContentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateContentForm />
    </Suspense>
  )
}
