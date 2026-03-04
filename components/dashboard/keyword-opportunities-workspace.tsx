'use client'

import { FormEvent, useMemo, useState } from 'react'
import { Lightbulb, Loader2, Search, Target } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface RankedKeywordData {
  keyword: string
  position: number
  searchVolume?: number
  search_volume?: number
  difficulty: number
  cpc: number
  competition?: string
  competition_level?: string
  traffic: number
}

interface KeywordProfile {
  domain: string
  totalKeywords: number
  totalTraffic: number
  totalSearchVolume: number
  averagePosition: number
  topKeywords: RankedKeywordData[]
  opportunities: {
    highVolumeKeywords: RankedKeywordData[]
    lowCompetitionKeywords: RankedKeywordData[]
    improvementTargets: RankedKeywordData[]
  }
}

interface CompetitorKeywordAnalysis {
  domain: string
  gapAnalysis: {
    uniqueKeywords: RankedKeywordData[]
    sharedKeywords: RankedKeywordData[]
    betterRankingOpportunities: RankedKeywordData[]
  }
}

interface KeywordComparisonPayload {
  target: KeywordProfile
  competitors: CompetitorKeywordAnalysis[]
  insights: {
    keywordGaps: RankedKeywordData[]
    competitiveAdvantages: RankedKeywordData[]
    opportunityScore: number
  }
}

type KeywordApiResult =
  | {
      type: 'analysis'
      data: KeywordProfile
    }
  | {
      type: 'comparison'
      data: KeywordComparisonPayload
    }

interface KeywordApiResponse {
  success?: boolean
  type?: 'analysis' | 'comparison'
  data?: KeywordProfile | KeywordComparisonPayload
  error?: string
}

type OpportunityBucket = 'high-volume' | 'low-competition' | 'improvement' | 'keyword-gap'

interface OpportunityRow {
  bucket: OpportunityBucket
  keyword: string
  position: number
  searchVolume: number
  difficulty: number
  competitionLevel: string
}

function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]
    .toLowerCase()
}

function asNumber(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function getSearchVolume(keyword: RankedKeywordData): number {
  return asNumber(keyword.searchVolume ?? keyword.search_volume)
}

function bucketLabel(bucket: OpportunityBucket): string {
  if (bucket === 'high-volume') return 'High volume'
  if (bucket === 'low-competition') return 'Low competition'
  if (bucket === 'improvement') return 'Improve rankings'
  return 'Competitor gap'
}

function buildOpportunityRows(result: KeywordApiResult): OpportunityRow[] {
  if (result.type === 'comparison') {
    return result.data.insights.keywordGaps.slice(0, 120).map((row) => ({
      bucket: 'keyword-gap',
      keyword: row.keyword,
      position: row.position,
      searchVolume: getSearchVolume(row),
      difficulty: asNumber(row.difficulty),
      competitionLevel: row.competition_level || row.competition || 'unknown',
    }))
  }

  const profile = result.data
  const rows: OpportunityRow[] = []

  profile.opportunities.highVolumeKeywords.forEach((row) => {
    rows.push({
      bucket: 'high-volume',
      keyword: row.keyword,
      position: row.position,
      searchVolume: getSearchVolume(row),
      difficulty: asNumber(row.difficulty),
      competitionLevel: row.competition_level || row.competition || 'unknown',
    })
  })

  profile.opportunities.lowCompetitionKeywords.forEach((row) => {
    rows.push({
      bucket: 'low-competition',
      keyword: row.keyword,
      position: row.position,
      searchVolume: getSearchVolume(row),
      difficulty: asNumber(row.difficulty),
      competitionLevel: row.competition_level || row.competition || 'unknown',
    })
  })

  profile.opportunities.improvementTargets.forEach((row) => {
    rows.push({
      bucket: 'improvement',
      keyword: row.keyword,
      position: row.position,
      searchVolume: getSearchVolume(row),
      difficulty: asNumber(row.difficulty),
      competitionLevel: row.competition_level || row.competition || 'unknown',
    })
  })

  return rows
}

export function KeywordOpportunitiesWorkspace() {
  const [domain, setDomain] = useState('')
  const [competitorsInput, setCompetitorsInput] = useState('')
  const [limit, setLimit] = useState('250')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('opportunity-queue')
  const [result, setResult] = useState<KeywordApiResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const targetProfile = useMemo(() => {
    if (!result) return null
    return result.type === 'comparison' ? result.data.target : result.data
  }, [result])

  const allOpportunityRows = useMemo(() => {
    if (!result) return []

    return buildOpportunityRows(result)
      .filter((row) => row.keyword)
      .sort((left, right) => right.searchVolume - left.searchVolume)
  }, [result])

  const filteredOpportunityRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return allOpportunityRows
    }

    return allOpportunityRows.filter((row) => row.keyword.toLowerCase().includes(query))
  }, [allOpportunityRows, search])

  const chartData = useMemo(
    () =>
      allOpportunityRows.slice(0, 10).map((row) => ({
        keyword: row.keyword,
        volume: row.searchVolume,
        difficulty: row.difficulty,
      })),
    [allOpportunityRows]
  )

  const competitorRows = useMemo(() => {
    if (!result || result.type !== 'comparison') {
      return []
    }

    return result.data.competitors.map((competitor) => ({
      domain: competitor.domain,
      uniqueKeywords: competitor.gapAnalysis.uniqueKeywords.length,
      sharedKeywords: competitor.gapAnalysis.sharedKeywords.length,
      betterRankingOpportunities: competitor.gapAnalysis.betterRankingOpportunities.length,
    }))
  }, [result])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const normalizedDomain = normalizeDomainInput(domain)
    const competitors = competitorsInput
      .split(',')
      .map((item) => normalizeDomainInput(item))
      .filter((item) => item.length > 0)

    try {
      const response = await fetch('/api/dataforseo/ranked-keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          domain: normalizedDomain,
          competitors,
          action: competitors.length > 0 ? 'compare' : 'analyze',
          limit: Math.max(50, Math.min(1000, Number(limit) || 250)),
        }),
      })

      const payload = (await response.json().catch(() => null)) as KeywordApiResponse | null
      if (!response.ok || !payload?.success || !payload.type || !payload.data) {
        throw new Error(payload?.error || `Request failed (${response.status})`)
      }

      if (payload.type === 'analysis') {
        setResult({ type: 'analysis', data: payload.data as KeywordProfile })
      } else {
        setResult({ type: 'comparison', data: payload.data as KeywordComparisonPayload })
      }
    } catch (requestError) {
      setResult(null)
      setError(requestError instanceof Error ? requestError.message : 'Failed to load keyword opportunities')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-zinc-100 text-2xl">Keyword Opportunities</CardTitle>
              <CardDescription className="text-zinc-400">
                Identify high-impact opportunities from your rankings and competitor gaps.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-white/10 text-zinc-300">
              {result?.type === 'comparison' ? 'Comparison mode' : 'Analysis mode'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
            <Input
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              placeholder="example.com"
              className="md:col-span-2"
              required
            />
            <Input
              value={competitorsInput}
              onChange={(event) => setCompetitorsInput(event.target.value)}
              placeholder="competitor-a.com, competitor-b.com"
              className="md:col-span-2"
            />
            <Input
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              type="number"
              min={50}
              max={1000}
            />
            <Button type="submit" disabled={isLoading} className="md:col-span-1">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Find opportunities'}
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Total Keywords</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{targetProfile?.totalKeywords ?? '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Estimated Traffic</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{targetProfile ? Math.round(targetProfile.totalTraffic).toLocaleString() : '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Average Position</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{targetProfile ? targetProfile.averagePosition.toFixed(1) : '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Opportunity Queue</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{result ? allOpportunityRows.length : '--'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <CardTitle className="text-zinc-100">Opportunity Command Center</CardTitle>
          <CardDescription className="text-zinc-400">
            Prioritize by volume, difficulty, and competitive gap to decide what to publish next.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
              <TabsTrigger value="opportunity-queue" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Opportunity Queue
              </TabsTrigger>
              <TabsTrigger value="volume-map" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Volume Map
              </TabsTrigger>
              <TabsTrigger value="competitor-gaps" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Competitor Gaps
              </TabsTrigger>
            </TabsList>

            <TabsContent value="opportunity-queue" className="space-y-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search opportunity keyword"
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Bucket</TableHead>
                    <TableHead className="text-right">Position</TableHead>
                    <TableHead className="text-right">Search Volume</TableHead>
                    <TableHead className="text-right">Difficulty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOpportunityRows.slice(0, 120).map((row) => (
                    <TableRow key={`${row.keyword}-${row.bucket}`}>
                      <TableCell className="text-zinc-200">{row.keyword}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-white/10 text-zinc-300">
                          {bucketLabel(row.bucket)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-zinc-300">{row.position || 'n/a'}</TableCell>
                      <TableCell className="text-right text-zinc-300">{row.searchVolume.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-zinc-300">{row.difficulty}</TableCell>
                    </TableRow>
                  ))}
                  {filteredOpportunityRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-zinc-500">
                        {result ? 'No opportunities match the current filter.' : 'Run an analysis to load opportunities.'}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="volume-map" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Top opportunity volume</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="keyword" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="volume" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry) => (
                            <Cell key={entry.keyword} fill="#a855f7" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
                  <p className="text-sm font-medium text-zinc-200">Execution notes</p>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-zinc-400" />
                      <span>Start with high-volume terms in positions 11-30 for faster movement.</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      <span>Low-competition keywords are the fastest path to incremental traffic wins.</span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-zinc-400" />
                      <span>Use the queue tab to filter by topic cluster before creating briefs.</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="competitor-gaps" className="space-y-4">
              {result?.type !== 'comparison' ? (
                <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                  Add competitor domains in the form to unlock comparative gap analysis.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competitor</TableHead>
                      <TableHead className="text-right">Unique Keywords</TableHead>
                      <TableHead className="text-right">Shared Keywords</TableHead>
                      <TableHead className="text-right">Better Rankings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitorRows.map((row) => (
                      <TableRow key={row.domain}>
                        <TableCell className="text-zinc-200">{row.domain}</TableCell>
                        <TableCell className="text-right text-zinc-300">{row.uniqueKeywords.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-zinc-300">{row.sharedKeywords.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-zinc-300">{row.betterRankingOpportunities.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
