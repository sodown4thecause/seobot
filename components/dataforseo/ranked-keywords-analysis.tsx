'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Loader2, TrendingUp, TrendingDown, Target, Search, BarChart3 } from 'lucide-react'
import { KeywordProfile, CompetitorKeywordAnalysis } from '@/lib/services/dataforseo/ranked-keywords-analysis'

interface RankedKeywordsAnalysisProps {
  initialDomain?: string
  onAnalysisComplete?: (data: any) => void
}

export function RankedKeywordsAnalysis({ initialDomain, onAnalysisComplete }: RankedKeywordsAnalysisProps) {
  const [domain, setDomain] = useState(initialDomain || '')
  const [competitors, setCompetitors] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<{
    target: KeywordProfile
    competitors: CompetitorKeywordAnalysis[]
    insights: any
  } | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const handleAnalyze = async () => {
    if (!domain.trim()) return

    setLoading(true)
    try {
      const competitorList = competitors.filter(c => c.trim()).slice(0, 3)
      
      const response = await fetch('/api/dataforseo/ranked-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: competitorList.length > 0 ? 'compare' : 'analyze',
          domain: domain.trim(),
          competitors: competitorList,
          options: {
            limit: 500,
            includeSerp: true
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.data)
        onAnalysisComplete?.(result.data)
      } else {
        throw new Error(result.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      // Handle error (could add toast notification)
    } finally {
      setLoading(false)
    }
  }

  const addCompetitor = () => {
    if (competitors.length < 5) {
      setCompetitors([...competitors, ''])
    }
  }

  const updateCompetitor = (index: number, value: string) => {
    const updated = [...competitors]
    updated[index] = value
    setCompetitors(updated)
  }

  const removeCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index))
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'HIGH': return 'destructive'
      case 'MEDIUM': return 'secondary'
      case 'LOW': return 'default'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Ranked Keywords Analysis
          </CardTitle>
          <CardDescription>
            Analyze keyword profiles and compare with competitors to find opportunities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Target Domain</label>
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Competitors (Optional)</label>
            <div className="space-y-2">
              {competitors.map((competitor, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder="competitor.com"
                    value={competitor}
                    onChange={(e) => updateCompetitor(index, e.target.value)}
                  />
                  {competitors.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeCompetitor(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
              {competitors.length < 5 && (
                <Button variant="outline" size="sm" onClick={addCompetitor}>
                  Add Competitor
                </Button>
              )}
            </div>
          </div>

          <Button onClick={handleAnalyze} disabled={loading || !domain.trim()}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Analyze Keywords
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analysis.target.totalKeywords)}</div>
                  <p className="text-xs text-muted-foreground">Ranking keywords</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Search Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analysis.target.totalSearchVolume)}</div>
                  <p className="text-xs text-muted-foreground">Monthly searches</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Avg Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analysis.target.averagePosition.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">Average rank</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Competition Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">High Competition</span>
                    <span className="text-sm font-medium">{analysis.target.competitiveStrength.highCompetition}</span>
                  </div>
                  <Progress 
                    value={(analysis.target.competitiveStrength.highCompetition / analysis.target.totalKeywords) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medium Competition</span>
                    <span className="text-sm font-medium">{analysis.target.competitiveStrength.mediumCompetition}</span>
                  </div>
                  <Progress 
                    value={(analysis.target.competitiveStrength.mediumCompetition / analysis.target.totalKeywords) * 100} 
                    className="h-2"
                  />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Low Competition</span>
                    <span className="text-sm font-medium">{analysis.target.competitiveStrength.lowCompetition}</span>
                  </div>
                  <Progress 
                    value={(analysis.target.competitiveStrength.lowCompetition / analysis.target.totalKeywords) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Ranking Keywords</CardTitle>
                <CardDescription>Highest search volume keywords you're ranking for</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.target.topKeywords.slice(0, 20).map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{keyword.keyword}</div>
                        <div className="text-sm text-muted-foreground">
                          Volume: {formatNumber(keyword.search_volume)} | 
                          Position: {keyword.ranked_serp_element?.serp_item?.rank_absolute || 'N/A'}
                        </div>
                      </div>
                      <Badge variant={getCompetitionColor(keyword.competition_level)}>
                        {keyword.competition_level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">High Volume</CardTitle>
                  <CardDescription>Keywords with high search volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.target.opportunities.highVolumeKeywords.slice(0, 5).map((keyword, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{keyword.keyword}</div>
                        <div className="text-muted-foreground">{formatNumber(keyword.search_volume)} searches</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Low Competition</CardTitle>
                  <CardDescription>Easier ranking opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.target.opportunities.lowCompetitionKeywords.slice(0, 5).map((keyword, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{keyword.keyword}</div>
                        <div className="text-muted-foreground">{formatNumber(keyword.search_volume)} searches</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Improvement Targets</CardTitle>
                  <CardDescription>Keywords to optimize further</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.target.opportunities.improvementTargets.slice(0, 5).map((keyword, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{keyword.keyword}</div>
                        <div className="text-muted-foreground">
                          Pos: {keyword.ranked_serp_element?.serp_item?.rank_absolute || 'N/A'} | 
                          {formatNumber(keyword.search_volume)} searches
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {analysis.insights && (
              <Card>
                <CardHeader>
                  <CardTitle>Competitive Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.insights.keywordGaps.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Keyword Gaps ({analysis.insights.keywordGaps.length})
                      </h4>
                      <div className="space-y-2">
                        {analysis.insights.keywordGaps.slice(0, 5).map((keyword: any, index: number) => (
                          <div key={index} className="text-sm p-2 bg-muted rounded">
                            <div className="font-medium">{keyword.keyword}</div>
                            <div className="text-muted-foreground">{formatNumber(keyword.search_volume)} searches</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.insights.competitiveAdvantages.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Competitive Advantages ({analysis.insights.competitiveAdvantages.length})
                      </h4>
                      <div className="space-y-2">
                        {analysis.insights.competitiveAdvantages.slice(0, 5).map((keyword: any, index: number) => (
                          <div key={index} className="text-sm p-2 bg-green-50 rounded">
                            <div className="font-medium">{keyword.keyword}</div>
                            <div className="text-muted-foreground">
                              Pos: {keyword.ranked_serp_element?.serp_item?.rank_absolute || 'N/A'} | 
                              {formatNumber(keyword.search_volume)} searches
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            {analysis.competitors.map((competitor, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle>{competitor.domain}</CardTitle>
                  <CardDescription>
                    {formatNumber(competitor.profile.totalKeywords)} keywords | 
                    Avg position: {competitor.profile.averagePosition.toFixed(1)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="gaps">
                    <TabsList>
                      <TabsTrigger value="gaps">Keyword Gaps</TabsTrigger>
                      <TabsTrigger value="shared">Shared Keywords</TabsTrigger>
                      <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                    </TabsList>

                    <TabsContent value="gaps" className="space-y-2">
                      {competitor.gapAnalysis.uniqueKeywords.slice(0, 10).map((keyword, kidx) => (
                        <div key={kidx} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{keyword.keyword}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(keyword.search_volume)} searches
                            </div>
                          </div>
                          <Badge variant={getCompetitionColor(keyword.competition_level)}>
                            {keyword.competition_level}
                          </Badge>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="shared" className="space-y-2">
                      {competitor.gapAnalysis.sharedKeywords.slice(0, 10).map((keyword, kidx) => (
                        <div key={kidx} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{keyword.keyword}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(keyword.search_volume)} searches
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Their pos: {keyword.ranked_serp_element?.serp_item?.rank_absolute || 'N/A'}
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="opportunities" className="space-y-2">
                      {competitor.gapAnalysis.betterRankingOpportunities.slice(0, 10).map((keyword, kidx) => (
                        <div key={kidx} className="flex items-center justify-between p-2 border rounded bg-yellow-50">
                          <div>
                            <div className="font-medium text-sm">{keyword.keyword}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(keyword.search_volume)} searches
                            </div>
                          </div>
                          <div className="text-xs">
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                            They rank better
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}