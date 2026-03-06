'use client'

import { FormEvent, useMemo, useState } from 'react'
import { ExternalLink, Link2, Loader2, ShieldAlert, TriangleAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface BacklinkSummary {
  domainRank: number
  backlinks: number
  referringDomains: number
  spamScore: number
}

interface BacklinkRow {
  sourceDomain: string
  sourceUrl: string
  targetUrl: string
  type: string
  domainRank: number
  spamScore: number
  firstSeen: string
  lastSeen: string
  isNew: boolean
  isLost: boolean
}

interface ReferringDomainRow {
  domain: string
  count: number
}

interface BacklinkApiResult {
  success?: boolean
  domain?: string
  totalBacklinks?: number
  backlinks?: BacklinkRow[]
  referringDomains?: ReferringDomainRow[]
  summary?: BacklinkSummary
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

function asNumber(value: number | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function formatDate(value: string): string {
  if (!value) return 'n/a'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString()
}

export function BacklinkProfileWorkspace() {
  const [domain, setDomain] = useState('')
  const [limit, setLimit] = useState('100')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('backlinks')
  const [result, setResult] = useState<BacklinkApiResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const backlinks = result?.backlinks ?? []
  const referringDomains = result?.referringDomains ?? []
  const summary = result?.summary

  const filteredBacklinks = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return backlinks
    }

    return backlinks.filter((row) => {
      const domainMatch = row.sourceDomain.toLowerCase().includes(query)
      const sourceMatch = row.sourceUrl.toLowerCase().includes(query)
      const targetMatch = row.targetUrl.toLowerCase().includes(query)
      return domainMatch || sourceMatch || targetMatch
    })
  }, [backlinks, search])

  const topReferringChart = useMemo(
    () => referringDomains.slice(0, 12).map((row) => ({ domain: row.domain, count: row.count })),
    [referringDomains]
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const normalizedDomain = normalizeDomainInput(domain)
    const parsedLimit = Math.max(10, Math.min(200, Number(limit) || 100))

    try {
      const response = await fetch('/api/dataforseo/backlinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ domain: normalizedDomain, limit: parsedLimit }),
      })

      const payload = (await response.json().catch(() => null)) as BacklinkApiResult | null
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `Request failed (${response.status})`)
      }

      setResult(payload)
    } catch (requestError) {
      setResult(null)
      setError(requestError instanceof Error ? requestError.message : 'Failed to load backlink profile')
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
              <CardTitle className="text-zinc-100 text-2xl">Backlink Profile</CardTitle>
              <CardDescription className="text-zinc-400">
                Audit link quality, monitor referring domains, and isolate cleanup or growth targets.
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-white/10 text-zinc-300">
              {result?.domain || 'No domain loaded'}
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
              min={10}
              max={200}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="md:col-span-1 bg-emerald-700 text-white hover:bg-emerald-600"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load profile'}
            </Button>
          </form>
          {error ? (
            <p role="alert" className="mt-3 flex items-center gap-2 text-sm font-medium text-amber-300">
              <TriangleAlert className="h-4 w-4" />
              <span>Error: {error}</span>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Total Backlinks</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">
              {summary ? asNumber(summary.backlinks).toLocaleString() : '--'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Referring Domains</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">
              {summary ? asNumber(summary.referringDomains).toLocaleString() : '--'}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Domain Rank</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{summary ? asNumber(summary.domainRank) : '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Spam Score</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{summary ? asNumber(summary.spamScore) : '--'}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <CardTitle className="text-zinc-100">Link Intelligence Hub</CardTitle>
          <CardDescription className="text-zinc-400">
            Review raw backlinks in one tab and referring-domain concentration in another.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
              <TabsTrigger value="backlinks" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Backlinks
              </TabsTrigger>
              <TabsTrigger value="referring-domains" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Referring Domains
              </TabsTrigger>
            </TabsList>

            <TabsContent value="backlinks" className="space-y-4">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Filter source domain or URL"
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Domain Rank</TableHead>
                    <TableHead className="text-right">Spam</TableHead>
                    <TableHead className="text-right">First Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBacklinks.map((row) => (
                    <TableRow key={`${row.sourceUrl}-${row.targetUrl}`}>
                      <TableCell className="text-zinc-200">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span>{row.sourceDomain || 'unknown'}</span>
                            {row.sourceUrl ? (
                              <a href={row.sourceUrl} target="_blank" rel="noreferrer" className="text-zinc-500 hover:text-zinc-200">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-zinc-500">{row.targetUrl || 'n/a'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-white/10 text-zinc-300">{row.type || 'link'}</Badge>
                          {row.isNew ? <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-200">new</Badge> : null}
                          {row.isLost ? <Badge variant="outline" className="border-zinc-500 bg-zinc-700/60 text-zinc-100">lost</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-zinc-300">{asNumber(row.domainRank)}</TableCell>
                      <TableCell className="text-right text-zinc-300">{asNumber(row.spamScore)}</TableCell>
                      <TableCell className="text-right text-zinc-300">{formatDate(row.firstSeen)}</TableCell>
                    </TableRow>
                  ))}
                  {filteredBacklinks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-zinc-500">
                        {backlinks.length === 0 ? 'Run backlink profile to load links.' : 'No backlinks match the current filter.'}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="referring-domains" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Top referring domains</p>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topReferringChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="domain" stroke="#a1a1aa" />
                        <YAxis allowDecimals={false} stroke="#a1a1aa" />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {topReferringChart.map((entry) => (
                            <Cell key={entry.domain} fill="#10b981" />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Risk and opportunity notes</p>
                  <div className="space-y-2">
                    {referringDomains.slice(0, 8).map((row) => (
                      <div key={row.domain} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-zinc-200">{row.domain}</p>
                          <Badge variant="outline" className="border-white/10 text-zinc-300">{row.count} links</Badge>
                        </div>
                      </div>
                    ))}

                    {referringDomains.length === 0 ? (
                      <p className="text-sm text-zinc-500">Run profile to load referring domain data.</p>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-lg border border-zinc-600/60 bg-zinc-800/50 p-3 text-sm text-zinc-200">
                    <div className="flex items-start gap-2">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Prioritize cleanup if high link concentration overlaps with elevated spam scores.
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-zinc-400" />
                      <span>Promote content on domains where competitors are repeatedly earning links.</span>
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
