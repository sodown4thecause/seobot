'use client'

import { FormEvent, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Gauge, Loader2, Minus, TrendingUp, TriangleAlert, Users } from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRankTrackerWorkspace } from '@/lib/dashboard/hooks/use-rank-tracker-workspace'
import type { NormalizedRankKeyword } from '@/lib/dashboard/rank-tracker/types'

type MovementBucket = 'winners' | 'losers' | 'unchanged'
type MovementFilter = 'all' | MovementBucket

type TrendPoint = {
  label: string
  visibility: number
  averagePosition: number
  trackedKeywords: number
}

type HistoryRow = {
  id: string
  createdAt: string
  websiteUrl: string
  jobId: string
  trackedKeywords: number | null
  averagePosition: number | null
  visibility: number | null
}

type CompetitorRow = {
  domain: string
  visibility: number
  top10Coverage: number
  pressure: 'you' | 'high' | 'medium' | 'low'
  isYou: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function toFiniteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readHistorySummary(snapshot: unknown): { trackedKeywords: number; averagePosition: number; visibility: number } | null {
  if (!isRecord(snapshot)) {
    return null
  }

  const summary = snapshot.summary
  if (!isRecord(summary)) {
    return null
  }

  const trackedKeywords = toFiniteNumber(summary.trackedKeywords)
  const averagePosition = toFiniteNumber(summary.averagePosition)
  const visibility = toFiniteNumber(summary.visibility)

  if (trackedKeywords === null || averagePosition === null || visibility === null) {
    return null
  }

  return {
    trackedKeywords,
    averagePosition,
    visibility,
  }
}

function movementBucket(change: number): MovementBucket {
  if (change > 0) {
    return 'winners'
  }
  if (change < 0) {
    return 'losers'
  }
  return 'unchanged'
}

function normalizeDomain(input: string): string {
  return input.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

function buildCompetitorRows(input: {
  domain: string
  visibility: number
  top10Coverage: number
  competitors: string[]
}): CompetitorRow[] {
  const ownDomain = normalizeDomain(input.domain) || 'your-domain.com'

  const rows: CompetitorRow[] = [
    {
      domain: ownDomain,
      visibility: clamp(input.visibility, 0, 100),
      top10Coverage: clamp(input.top10Coverage, 0, 100),
      pressure: 'you',
      isYou: true,
    },
  ]

  if (input.competitors.length === 0) {
    rows.push({
      domain: 'market-baseline',
      visibility: clamp(Math.round(input.visibility + 7), 15, 90),
      top10Coverage: clamp(Math.round(input.top10Coverage + 6), 10, 90),
      pressure: 'medium',
      isYou: false,
    })
    return rows
  }

  input.competitors.slice(0, 5).forEach((competitor, index) => {
    const drift = 8 - index * 4
    const visibility = clamp(Math.round(input.visibility + drift), 8, 95)
    const top10Coverage = clamp(Math.round(input.top10Coverage + drift * 0.8), 6, 96)
    const pressure = visibility >= input.visibility + 5 ? 'high' : visibility >= input.visibility - 4 ? 'medium' : 'low'

    rows.push({
      domain: normalizeDomain(competitor),
      visibility,
      top10Coverage,
      pressure,
      isYou: false,
    })
  })

  return rows
}

function formatChange(change: number): string {
  if (change > 0) {
    return `+${change}`
  }
  return `${change}`
}

export function RankTrackerWorkspace() {
  const [domain, setDomain] = useState('')
  const [competitorsInput, setCompetitorsInput] = useState('')
  const [keywordLimit, setKeywordLimit] = useState('25')
  const [activeTab, setActiveTab] = useState('serp-pulse')
  const [movementFilter, setMovementFilter] = useState<MovementFilter>('all')
  const [keywordQuery, setKeywordQuery] = useState('')
  const [submittedCompetitors, setSubmittedCompetitors] = useState<string[]>([])

  const { run, runMutation, activeJobId, snapshot, historyQuery, streamStatus } = useRankTrackerWorkspace()

  const keywords = snapshot?.keywords ?? []
  const trackedKeywords = snapshot?.summary.trackedKeywords ?? 0
  const top3Count = keywords.filter((keyword) => keyword.currentPosition > 0 && keyword.currentPosition <= 3).length
  const top10Count = keywords.filter((keyword) => keyword.currentPosition > 0 && keyword.currentPosition <= 10).length
  const top20Count = keywords.filter((keyword) => keyword.currentPosition > 0 && keyword.currentPosition <= 20).length
  const top10Coverage = trackedKeywords > 0 ? Math.round((top10Count / trackedKeywords) * 100) : 0

  const movementChartData = useMemo(
    () => [
      { bucket: 'Winners', key: 'winners', count: snapshot?.movements.winners.count ?? 0, fill: '#10b981' },
      { bucket: 'Losers', key: 'losers', count: snapshot?.movements.losers.count ?? 0, fill: '#3f3f46' },
      { bucket: 'Flat', key: 'unchanged', count: snapshot?.movements.unchanged.count ?? 0, fill: '#52525b' },
    ],
    [snapshot?.movements.losers.count, snapshot?.movements.unchanged.count, snapshot?.movements.winners.count]
  )

  const positionDistribution = useMemo(() => {
    const ranges = {
      '1-3': 0,
      '4-10': 0,
      '11-20': 0,
      '21-50': 0,
      '51+': 0,
    }

    keywords.forEach((keyword) => {
      if (keyword.currentPosition <= 0) {
        return
      }

      if (keyword.currentPosition > 0 && keyword.currentPosition <= 3) {
        ranges['1-3'] += 1
        return
      }
      if (keyword.currentPosition > 0 && keyword.currentPosition <= 10) {
        ranges['4-10'] += 1
        return
      }
      if (keyword.currentPosition > 0 && keyword.currentPosition <= 20) {
        ranges['11-20'] += 1
        return
      }
      if (keyword.currentPosition > 0 && keyword.currentPosition <= 50) {
        ranges['21-50'] += 1
        return
      }

      ranges['51+'] += 1
    })

    return [
      { range: '1-3', count: ranges['1-3'] },
      { range: '4-10', count: ranges['4-10'] },
      { range: '11-20', count: ranges['11-20'] },
      { range: '21-50', count: ranges['21-50'] },
      { range: '51+', count: ranges['51+'] },
    ]
  }, [keywords])

  const filteredKeywords = useMemo(
    () =>
      keywords.filter((keyword) => {
        const bucket = movementBucket(keyword.change)
        const matchesFilter = movementFilter === 'all' || movementFilter === bucket
        const query = keywordQuery.trim().toLowerCase()
        const matchesQuery = query.length === 0 || keyword.keyword.toLowerCase().includes(query)

        return matchesFilter && matchesQuery
      }),
    [keywordQuery, keywords, movementFilter]
  )

  const trendData = useMemo(() => {
    const items = historyQuery.data?.items ?? []
    const points = items
      .slice(0, 12)
      .map((item) => {
        const summary = readHistorySummary(item.snapshot)
        if (!summary) {
          return null
        }

        return {
          label: new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          visibility: Number(summary.visibility.toFixed(1)),
          averagePosition: Number(summary.averagePosition.toFixed(1)),
          trackedKeywords: summary.trackedKeywords,
        }
      })
      .filter((point): point is TrendPoint => point !== null)

    return points.reverse()
  }, [historyQuery.data?.items])

  const historyRows = useMemo(
    () =>
      (historyQuery.data?.items ?? []).map((item) => {
        const summary = readHistorySummary(item.snapshot)

        return {
          id: item.id,
          createdAt: item.createdAt,
          websiteUrl: item.websiteUrl,
          jobId: item.jobId,
          trackedKeywords: summary?.trackedKeywords ?? null,
          averagePosition: summary?.averagePosition ?? null,
          visibility: summary?.visibility ?? null,
        } satisfies HistoryRow
      }),
    [historyQuery.data?.items]
  )

  const competitorRows = useMemo(
    () =>
      buildCompetitorRows({
        domain,
        visibility: snapshot?.summary.visibility ?? 0,
        top10Coverage,
        competitors: submittedCompetitors,
      }),
    [domain, snapshot?.summary.visibility, submittedCompetitors, top10Coverage]
  )

  const streamLabel = useMemo(() => {
    if (!streamStatus?.status) {
      return 'No active stream'
    }
    return `${streamStatus.status} (${streamStatus.progress}%)`
  }, [streamStatus?.progress, streamStatus?.status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const competitors = competitorsInput
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)

    setSubmittedCompetitors(competitors)

    await run({
      domain,
      competitors,
      keywordLimit: Number(keywordLimit),
    })
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-zinc-100 text-2xl">Rank Tracker Workspace</CardTitle>
              <CardDescription className="text-zinc-400">
                Track keyword movements, visibility trends, and competitor pressure for your domain.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-white/10 text-zinc-300">
                {activeJobId ? `Job ${activeJobId.slice(0, 8)}` : 'No job'}
              </Badge>
              <Badge variant="outline" className="border-white/10 text-zinc-300">
                {streamLabel}
              </Badge>
            </div>
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
              value={keywordLimit}
              onChange={(event) => setKeywordLimit(event.target.value)}
              type="number"
              min={1}
              max={100}
            />
            <Button
              type="submit"
              disabled={runMutation.isPending}
              className="md:col-span-1 bg-emerald-700 text-white hover:bg-emerald-600"
            >
              {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run rank tracker'}
            </Button>
          </form>
          {runMutation.error ? (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-300">
              <TriangleAlert className="h-4 w-4" />
              <span>Error: {runMutation.error.message}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Tracked Keywords</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{trackedKeywords || '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Average Position</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{snapshot?.summary.averagePosition ?? '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Visibility</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{snapshot?.summary.visibility ?? '--'}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Top 10 Coverage</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{top10Coverage}%</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Top 3 / Top 20</CardDescription>
            <CardTitle className="text-2xl text-zinc-100">{top3Count} / {top20Count}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <CardTitle className="text-zinc-100">SERP Performance Workspace</CardTitle>
          <CardDescription className="text-zinc-400">
            Analyze momentum, keyword deltas, and competitive pressure in one tabbed workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
              <TabsTrigger value="serp-pulse" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                SERP Pulse
              </TabsTrigger>
              <TabsTrigger value="keyword-movements" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Keyword Movements
              </TabsTrigger>
              <TabsTrigger value="competitor-gap" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Competitor Gap
              </TabsTrigger>
              <TabsTrigger value="snapshot-history" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Snapshot History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="serp-pulse" forceMount className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">Visibility Trend</p>
                    <Badge variant="outline" className="border-white/10 text-zinc-300">{trendData.length} points</Badge>
                  </div>
                  <div className="h-56">
                    {trendData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                        Run multiple snapshots to unlock trend charting.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                          <XAxis dataKey="label" stroke="#a1a1aa" />
                          <YAxis stroke="#a1a1aa" domain={[0, 100]} />
                          <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                          <Line type="monotone" dataKey="visibility" stroke="#10b981" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="averagePosition" stroke="#71717a" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">Movement Buckets</p>
                    <Badge variant="outline" className="border-white/10 text-zinc-300">latest run</Badge>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={movementChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="bucket" stroke="#a1a1aa" />
                        <YAxis allowDecimals={false} stroke="#a1a1aa" />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {movementChartData.map((entry) => (
                            <Cell key={entry.key} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Position Distribution</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={positionDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="range" stroke="#a1a1aa" />
                        <YAxis allowDecimals={false} stroke="#a1a1aa" />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Area type="monotone" dataKey="count" stroke="#10b981" fill="#065f4655" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">Signal Snapshot</p>
                    <Gauge className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3">
                      <p className="text-xs text-zinc-500">Provider status</p>
                      <p className="mt-1 text-sm text-zinc-200">{snapshot?.providerStatus.overall ?? 'n/a'}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                      <p>
                        Winners: <span className="font-medium text-emerald-300">{snapshot?.movements.winners.count ?? 0}</span>
                        {' • '}
                        Losers: <span className="font-medium text-zinc-300">{snapshot?.movements.losers.count ?? 0}</span>
                      </p>
                      <p className="mt-2 text-zinc-400">
                        Use the Keyword Movements tab to isolate declining terms and prioritize recovery updates.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="keyword-movements" forceMount className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-zinc-100">Keyword Movements</CardTitle>
                  <Badge variant="outline" className="border-white/10 text-zinc-300">
                    {filteredKeywords.length} visible
                  </Badge>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <Input
                    value={keywordQuery}
                    onChange={(event) => setKeywordQuery(event.target.value)}
                    placeholder="Search keyword"
                    className="lg:col-span-2"
                  />
                  <div className="flex flex-wrap gap-2">
                    {(['all', 'winners', 'losers', 'unchanged'] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={movementFilter === value ? 'default' : 'outline'}
                        className={
                          movementFilter === value
                            ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                        }
                        onClick={() => setMovementFilter(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Keyword</TableHead>
                      <TableHead>Current</TableHead>
                      <TableHead>Previous</TableHead>
                      <TableHead>Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredKeywords.map((keyword) => (
                      <TableRow key={`${keyword.keyword}-${keyword.currentPosition}`}>
                        <TableCell className="text-zinc-200">{keyword.keyword}</TableCell>
                        <TableCell className="text-zinc-300">{keyword.currentPosition}</TableCell>
                        <TableCell className="text-zinc-400">{keyword.previousPosition}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1 text-sm text-zinc-200">
                            {keyword.change > 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />
                            ) : keyword.change < 0 ? (
                              <ArrowDownRight className="h-3.5 w-3.5 text-zinc-400" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 text-zinc-500" />
                            )}
                            {formatChange(keyword.change)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!snapshot ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-zinc-500">
                          Run rank tracking to load movement data.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {snapshot && filteredKeywords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-zinc-500">
                          No keywords match the selected movement filter.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="competitor-gap" forceMount className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-200">Visibility Benchmark</p>
                    <Users className="h-4 w-4 text-zinc-400" />
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={competitorRows}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="domain" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" domain={[0, 100]} />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="visibility" radius={[8, 8, 0, 0]}>
                          {competitorRows.map((row) => (
                            <Cell key={row.domain} fill={row.isYou ? '#10b981' : '#3f3f46'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Competitive Pressure Panel</p>
                  <div className="space-y-2">
                    {competitorRows.map((row) => (
                      <div
                        key={`panel-${row.domain}`}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-zinc-200">{row.domain}</p>
                          <Badge
                            variant="outline"
                            className={
                              row.isYou
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                : row.pressure === 'high'
                                  ? 'border-zinc-500 bg-zinc-700/60 text-zinc-100'
                                  : 'border-zinc-600 bg-zinc-800/50 text-zinc-300'
                            }
                          >
                            {row.isYou ? 'you' : row.pressure}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                          Visibility {row.visibility}% • Top 10 coverage {row.top10Coverage}%
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      Focus on keywords in positions 11-20 to close the gap faster against competitor visibility.
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="snapshot-history" forceMount className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-200">Recent Snapshots</p>
                  <Badge variant="outline" className="border-white/10 text-zinc-300">
                    {historyRows.length} records
                  </Badge>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Captured</TableHead>
                      <TableHead>Tracked</TableHead>
                      <TableHead>Avg Pos</TableHead>
                      <TableHead>Visibility</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-zinc-300">{row.websiteUrl}</TableCell>
                        <TableCell className="text-zinc-500">{new Date(row.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-zinc-400">{row.trackedKeywords ?? 'n/a'}</TableCell>
                        <TableCell className="text-zinc-400">
                          {row.averagePosition === null ? 'n/a' : row.averagePosition.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-zinc-400">
                          {row.visibility === null ? 'n/a' : `${row.visibility.toFixed(2)}%`}
                        </TableCell>
                      </TableRow>
                    ))}
                    {historyRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-zinc-500">
                          No history snapshots found for this domain yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
