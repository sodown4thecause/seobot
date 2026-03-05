'use client'

import { FormEvent, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ExternalLink, Loader2, Users } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CompetitorMetadata {
  organic_etv?: number
  organic_count?: number
  is_new?: number
  is_up?: number
  is_down?: number
  backlinks?: number
  referring_domains?: number
}

interface CompetitorRow {
  domain: string
  domain_authority?: number
  monthly_traffic?: number
  shared_keywords?: number
  metadata?: CompetitorMetadata
}

interface CompetitorDiscoverResponse {
  competitors?: CompetitorRow[]
  total?: number
  error?: string
}

function normalizeDomainInput(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split(/[/?#]/)[0]
    .toLowerCase()
}

function asPositiveNumber(value: number | undefined): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }
  return Math.max(0, value)
}

function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
}

function competitorSignal(row: CompetitorRow): 'up' | 'down' | 'new' | 'flat' {
  const isUp = asPositiveNumber(row.metadata?.is_up) > 0
  const isDown = asPositiveNumber(row.metadata?.is_down) > 0
  const isNew = asPositiveNumber(row.metadata?.is_new) > 0

  if (isNew) return 'new'
  if (isUp && !isDown) return 'up'
  if (isDown && !isUp) return 'down'
  return 'flat'
}

function signalBadge(signal: ReturnType<typeof competitorSignal>): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  if (signal === 'new') {
    return { label: 'New', variant: 'secondary' }
  }
  if (signal === 'up') {
    return { label: 'Gaining', variant: 'default' }
  }
  if (signal === 'down') {
    return { label: 'Losing', variant: 'destructive' }
  }
  return { label: 'Stable', variant: 'outline' }
}

export function CompetitorMonitorWorkspace() {
  const [domain, setDomain] = useState('')
  const [limit, setLimit] = useState('12')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [rows, setRows] = useState<CompetitorRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return rows
    }
    return rows.filter((row) => row.domain.toLowerCase().includes(query))
  }, [rows, search])

  const summary = useMemo(() => {
    const total = rows.length
    if (total === 0) {
      return {
        avgAuthority: 0,
        totalTraffic: 0,
        totalSharedKeywords: 0,
      }
    }

    const authoritySum = rows.reduce((sum, row) => sum + asPositiveNumber(row.domain_authority), 0)
    const totalTraffic = rows.reduce((sum, row) => sum + asPositiveNumber(row.monthly_traffic), 0)
    const totalSharedKeywords = rows.reduce((sum, row) => sum + asPositiveNumber(row.shared_keywords), 0)

    return {
      avgAuthority: Number((authoritySum / total).toFixed(1)),
      totalTraffic,
      totalSharedKeywords,
    }
  }, [rows])

  const chartData = useMemo(
    () =>
      filteredRows.slice(0, 10).map((row) => ({
        domain: row.domain,
        traffic: asPositiveNumber(row.monthly_traffic),
        sharedKeywords: asPositiveNumber(row.shared_keywords),
      })),
    [filteredRows]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const normalized = normalizeDomainInput(domain)
    const parsedLimit = Math.max(1, Math.min(25, Number(limit) || 10))

    try {
      const response = await fetch('/api/competitors/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ domain: normalized, limit: parsedLimit }),
      })

      const payload = (await response.json().catch(() => null)) as CompetitorDiscoverResponse | null
      if (!response.ok) {
        throw new Error(payload?.error || `Request failed (${response.status})`)
      }

      setRows(Array.isArray(payload?.competitors) ? payload.competitors : [])
    } catch (requestError) {
      setRows([])
      setError(requestError instanceof Error ? requestError.message : 'Failed to load competitors')
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
              <CardTitle className="text-zinc-100 text-2xl">Competitor Monitor</CardTitle>
              <CardDescription className="text-zinc-400">
                Track who is rising in your SERP landscape and where they are pulling traffic from.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-white/10 text-zinc-300">
              {rows.length} competitors loaded
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
              value={limit}
              onChange={(event) => setLimit(event.target.value)}
              type="number"
              min={1}
              max={25}
            />
            <Button type="submit" disabled={isLoading} className="md:col-span-1">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run monitor'}
            </Button>
          </form>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Tracked Competitors</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{rows.length || '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Avg Domain Authority</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{rows.length > 0 ? summary.avgAuthority : '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Combined Traffic</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{rows.length > 0 ? formatCompact(summary.totalTraffic) : '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Shared Keywords</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{rows.length > 0 ? formatCompact(summary.totalSharedKeywords) : '--'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <CardTitle className="text-zinc-100">Competitive Intelligence</CardTitle>
          <CardDescription className="text-zinc-400">
            Use the leaderboard to triage threats and the momentum tab to spot domains accelerating fastest.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
              <TabsTrigger value="leaderboard" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Leaderboard
              </TabsTrigger>
              <TabsTrigger value="momentum" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Momentum
              </TabsTrigger>
            </TabsList>

            <TabsContent value="leaderboard" className="space-y-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter domains"
              />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Domain</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead className="text-right">Authority</TableHead>
                    <TableHead className="text-right">Traffic</TableHead>
                    <TableHead className="text-right">Shared Keywords</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const signal = competitorSignal(row)
                    const signalDisplay = signalBadge(signal)

                    return (
                      <TableRow key={row.domain}>
                        <TableCell className="text-zinc-200">
                          <div className="flex items-center gap-2">
                            <span>{row.domain}</span>
                            <a
                              href={`https://${row.domain}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-zinc-500 hover:text-zinc-200"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={signalDisplay.variant}>
                            {signalDisplay.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-zinc-300">
                          {typeof row.domain_authority === 'number' && Number.isFinite(row.domain_authority)
                            ? asPositiveNumber(row.domain_authority)
                            : 'n/a'}
                        </TableCell>
                        <TableCell className="text-right text-zinc-300">{asPositiveNumber(row.monthly_traffic).toLocaleString()}</TableCell>
                        <TableCell className="text-right text-zinc-300">{asPositiveNumber(row.shared_keywords).toLocaleString()}</TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-zinc-500">
                        {rows.length === 0 ? 'Run monitor to load competitors.' : 'No domains match the current filter.'}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="momentum" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Traffic by competitor</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="domain" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="traffic" radius={[8, 8, 0, 0]}>
                          {chartData.map((entry) => (
                            <Cell key={entry.domain} fill="#22d3ee" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Signal panel</p>
                  <div className="space-y-2">
                    {filteredRows.slice(0, 8).map((row) => {
                      const signal = competitorSignal(row)
                      const signalDisplay = signalBadge(signal)

                      return (
                        <div key={`signal-${row.domain}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm text-zinc-200">{row.domain}</p>
                            <Badge variant={signalDisplay.variant}>{signalDisplay.label}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-zinc-500">
                            Traffic {asPositiveNumber(row.monthly_traffic).toLocaleString()} • Shared keywords {asPositiveNumber(row.shared_keywords).toLocaleString()}
                          </p>
                        </div>
                      )
                    })}

                    {filteredRows.length === 0 ? (
                      <p className="text-sm text-zinc-500">Run monitor to load movement signals.</p>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-zinc-400" />
                      <span>
                        Escalate domains tagged as <span className="text-zinc-100">Gaining</span> and cross-check their rising keyword sets first.
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
                    <div className="inline-flex items-center gap-1">
                      <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" /> Upward momentum
                    </div>
                    <div className="inline-flex items-center gap-1">
                      <ArrowDownRight className="h-3.5 w-3.5 text-red-300" /> Downward momentum
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
