'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle, AlertCircle, TrendingUp, Users, Target, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Analysis {
  url: string
  title: string
  description: string
  industry: string
  businessType: string
  targetAudience: string[]
  mainTopics: string[]
  contentQuality: {
    score: number
    strengths: string[]
    improvements: string[]
  }
  technicalSeo: {
    hasSitemap: boolean
    hasRobotsTxt: boolean
    isResponsive: boolean
    loadSpeed: string
  }
}

export default function BusinessAnalysisPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      const response = await fetch('/api/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Analysis failed')
      }

      const data = await response.json() as Analysis
      setAnalysis(data)
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Business Profile Analysis
        </h1>
        <p className="text-muted-foreground">
          Analyze your website to extract business insights, industry positioning, and SEO opportunities
        </p>
      </div>

      {/* URL Input Form */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleAnalyze} className="flex gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
                disabled={loading}
                className="pl-12"
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !url}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Analyze Website
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-destructive">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-destructive mb-1">Analysis Failed</h3>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-6">
          {/* Overview Card */}
          <Card className="bg-gradient-to-r from-primary to-primary/80 border-primary/50">
            <CardContent className="p-6 text-primary-foreground">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">{analysis.title}</h2>
                  <p className="text-primary-foreground/80 mb-4">{analysis.description}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {analysis.industry}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white">
                      {analysis.businessType}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Target Audience */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  <CardTitle>Target Audience</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analysis.targetAudience.map((audience, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-foreground">{audience}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Main Topics */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <CardTitle>Main Topics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.mainTopics.map((topic, idx) => (
                    <Badge key={idx} variant="secondary">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Quality */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <CardTitle>Content Quality</CardTitle>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {analysis.contentQuality.score}
                  </div>
                  <div className="text-sm text-muted-foreground">Quality Score</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Strengths</h4>
                  <div className="space-y-2">
                    {analysis.contentQuality.strengths.map((strength, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Areas for Improvement</h4>
                  <div className="space-y-2">
                    {analysis.contentQuality.improvements.map((improvement, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-foreground">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical SEO */}
          <Card>
            <CardHeader>
              <CardTitle>Technical SEO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    analysis.technicalSeo.hasSitemap ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {analysis.technicalSeo.hasSitemap ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-foreground">Sitemap</div>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    analysis.technicalSeo.hasRobotsTxt ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {analysis.technicalSeo.hasRobotsTxt ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-foreground">Robots.txt</div>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${
                    analysis.technicalSeo.isResponsive ? 'bg-green-500/20' : 'bg-red-500/20'
                  }`}>
                    {analysis.technicalSeo.isResponsive ? (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                  <div className="text-sm font-medium text-foreground">Responsive</div>
                </div>

                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary mb-2">
                    {analysis.technicalSeo.loadSpeed}
                  </div>
                  <div className="text-sm font-medium text-foreground">Load Speed</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
