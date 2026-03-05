'use client'

import { FormEvent, useMemo, useState } from 'react'
import { AlertTriangle, Loader2, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useWebsiteAuditWorkspace } from '@/lib/dashboard/hooks/use-website-audit-workspace'
import type {
  ProviderStatus,
  WebsiteAuditIssue,
  WebsiteAuditIssueSeverity,
  WebsiteAuditProviderName,
} from '@/lib/dashboard/website-audit/types'

const PROVIDER_ORDER: WebsiteAuditProviderName[] = ['dataforseo', 'firecrawl', 'lighthouse']

const PROVIDER_LABELS: Record<WebsiteAuditProviderName, string> = {
  dataforseo: 'DataForSEO',
  firecrawl: 'Firecrawl',
  lighthouse: 'Lighthouse',
}

const STATUS_SCORES: Record<ProviderStatus, number> = {
  ok: 100,
  partial: 62,
  failed: 24,
}

const STATUS_COLORS: Record<ProviderStatus, string> = {
  ok: '#10b981',
  partial: '#52525b',
  failed: '#3f3f46',
}

type SeverityFilter = 'all' | WebsiteAuditIssueSeverity
type ProviderFilter = 'all' | WebsiteAuditProviderName

function severityBadgeVariant(_severity: WebsiteAuditIssueSeverity): 'outline' {
  return 'outline'
}

function statusBadgeVariant(_status: ProviderStatus): 'outline' {
  return 'outline'
}

function severityWeight(severity: WebsiteAuditIssueSeverity): number {
  if (severity === 'critical') {
    return 3
  }
  if (severity === 'warning') {
    return 2
  }
  return 1
}

function issueMatchesFilter(issue: WebsiteAuditIssue, query: string, severity: SeverityFilter, provider: ProviderFilter): boolean {
  const matchesSeverity = severity === 'all' || issue.severity === severity
  const matchesProvider = provider === 'all' || issue.sourceProvider === provider
  const normalizedQuery = query.trim().toLowerCase()
  const matchesQuery =
    normalizedQuery.length === 0 ||
    issue.title.toLowerCase().includes(normalizedQuery) ||
    issue.sourceProvider.toLowerCase().includes(normalizedQuery)

  return matchesSeverity && matchesProvider && matchesQuery
}

export function WebsiteAuditWorkspace() {
  const [domain, setDomain] = useState('')
  const [maxUrls, setMaxUrls] = useState('3')
  const [firecrawlLimit, setFirecrawlLimit] = useState('10')
  const [includeJinaScreenshot, setIncludeJinaScreenshot] = useState(true)
  const [activeTab, setActiveTab] = useState('command-center')
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [providerFilter, setProviderFilter] = useState<ProviderFilter>('all')
  const [issueQuery, setIssueQuery] = useState('')
  const { run, runMutation, activeJobId, snapshot, streamStatus } = useWebsiteAuditWorkspace()

  const issues = snapshot?.issues ?? []
  const summary = snapshot?.summary
  const providerStatus = snapshot?.providerStatus.providers

  const criticalCount = snapshot?.summary.issuesBySeverity.critical ?? 0
  const warningCount = snapshot?.summary.issuesBySeverity.warning ?? 0
  const infoCount = snapshot?.summary.issuesBySeverity.info ?? 0

  const severityData = useMemo(
    () => [
      { severity: 'Critical', count: criticalCount, fill: '#3f3f46' },
      { severity: 'Warning', count: warningCount, fill: '#52525b' },
      { severity: 'Info', count: infoCount, fill: '#10b981' },
    ],
    [criticalCount, infoCount, warningCount]
  )

  const providerData = useMemo(
    () =>
      PROVIDER_ORDER.map((provider) => {
        const status = providerStatus?.[provider] ?? 'failed'

        return {
          provider,
          label: PROVIDER_LABELS[provider],
          status,
          score: STATUS_SCORES[status],
          issues: issues.filter((issue) => issue.sourceProvider === provider).length,
        }
      }),
    [issues, providerStatus]
  )

  const filteredIssues = useMemo(
    () => issues.filter((issue) => issueMatchesFilter(issue, issueQuery, severityFilter, providerFilter)),
    [issueQuery, issues, providerFilter, severityFilter]
  )

  const playbookIssues = useMemo(
    () =>
      [...issues]
        .sort((left, right) => {
          const severityDelta = severityWeight(right.severity) - severityWeight(left.severity)
          if (severityDelta !== 0) {
            return severityDelta
          }

          return left.title.localeCompare(right.title)
        })
        .slice(0, 5),
    [issues]
  )

  const healthScore = summary?.healthScore ?? 0
  const healthTarget = 90
  const healthGap = Math.max(0, healthTarget - healthScore)

  const streamLabel = useMemo(() => {
    if (!streamStatus?.status) {
      return 'No active stream'
    }
    return `${streamStatus.status} (${streamStatus.progress}%)`
  }, [streamStatus?.progress, streamStatus?.status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await run({
      domain,
      maxUrls: Number(maxUrls),
      firecrawlLimit: Number(firecrawlLimit),
      includeJinaScreenshot,
    })
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-zinc-100 text-2xl">Website Audit Workspace</CardTitle>
              <CardDescription className="text-zinc-400">
                Crawl key pages, enrich with DataForSEO, and surface prioritized technical issues.
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
            <Input value={maxUrls} onChange={(event) => setMaxUrls(event.target.value)} type="number" min={1} max={10} />
            <Input
              value={firecrawlLimit}
              onChange={(event) => setFirecrawlLimit(event.target.value)}
              type="number"
              min={1}
              max={50}
            />
            <label className="md:col-span-3 flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={includeJinaScreenshot}
                onChange={(event) => setIncludeJinaScreenshot(event.target.checked)}
              />
              Include Jina screenshot capture
            </label>
            <Button
              type="submit"
              disabled={runMutation.isPending}
              className="md:col-span-1 bg-emerald-700 text-white hover:bg-emerald-600"
            >
              {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Run audit'}
            </Button>
          </form>
          {runMutation.error ? <p className="mt-3 text-sm text-zinc-300">{runMutation.error.message}</p> : null}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Health Score</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{summary?.healthScore ?? '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Total Issues</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{summary?.totalIssues ?? '--'}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Critical</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{criticalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="glass-card border-none bg-black/30">
          <CardHeader className="pb-2">
            <CardDescription>Warnings</CardDescription>
            <CardTitle className="text-3xl text-zinc-100">{warningCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="glass-card border-none bg-black/40">
        <CardHeader>
          <CardTitle className="text-zinc-100">Audit Command Center</CardTitle>
          <CardDescription className="text-zinc-400">
            Use tabbed views to triage issues, compare providers, and prioritize the highest-impact fixes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
              <TabsTrigger value="command-center" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Command Center
              </TabsTrigger>
              <TabsTrigger value="issue-queue" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Issue Queue
              </TabsTrigger>
              <TabsTrigger value="provider-comparison" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900">
                Provider Comparison
              </TabsTrigger>
            </TabsList>

            <TabsContent value="command-center" forceMount className="space-y-4">
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <p className="mb-3 text-sm font-medium text-zinc-200">Severity Distribution</p>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={severityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                        <XAxis dataKey="severity" stroke="#a1a1aa" />
                        <YAxis allowDecimals={false} stroke="#a1a1aa" />
                        <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {severityData.map((entry) => (
                            <Cell key={entry.severity} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-4 rounded-xl border border-white/10 bg-black/20 p-4">
                  <div>
                    <p className="text-sm font-medium text-zinc-200">Benchmark Gap</p>
                    <p className="text-xs text-zinc-500">Compare your current audit against sprint-level targets.</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                        <span>Health target</span>
                        <span>{healthScore}/90</span>
                      </div>
                      <Progress value={Math.min(100, (healthScore / 90) * 100)} />
                    </div>

                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                        <span>Critical issue burn-down</span>
                        <span>{criticalCount} remaining</span>
                      </div>
                      <Progress value={Math.max(0, 100 - Math.min(100, criticalCount * 20))} />
                    </div>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-zinc-300">
                    {healthGap > 0 ? (
                      <p>Raise health score by <span className="font-semibold text-zinc-100">{healthGap}</span> points to hit your target.</p>
                    ) : (
                      <p>You are above the health target. Focus on consistency and monitoring.</p>
                    )}
                  </div>

                  {criticalCount > 0 ? (
                    <div className="flex items-start gap-2 rounded-lg border border-zinc-600/60 bg-zinc-800/50 p-3 text-sm text-zinc-200">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>Resolve critical issues first to unblock indexing reliability and ranking velocity.</p>
                    </div>
                  ) : warningCount > 0 ? (
                    <div className="flex items-start gap-2 rounded-lg border border-zinc-600/60 bg-zinc-800/40 p-3 text-sm text-zinc-200">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>Warnings are medium-impact opportunities worth scheduling this sprint.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                      <p>No high-severity blockers detected in this snapshot.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-200">Immediate Action Playbook</p>
                  <Badge variant="outline" className="border-white/10 text-zinc-300">
                    Top {Math.min(5, playbookIssues.length)} issues
                  </Badge>
                </div>

                <div className="space-y-2">
                  {playbookIssues.length === 0 ? (
                    <p className="text-sm text-zinc-500">Run a website audit to generate a prioritized fix list.</p>
                  ) : (
                    playbookIssues.map((issue, index) => (
                      <div
                        key={`${issue.title}-${index}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                      >
                        <p className="text-sm text-zinc-200">{issue.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={severityBadgeVariant(issue.severity)}
                            className={
                              issue.severity === 'info'
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                : issue.severity === 'warning'
                                  ? 'border-zinc-600 bg-zinc-800/60 text-zinc-200'
                                  : 'border-zinc-500 bg-zinc-700/60 text-zinc-100'
                            }
                          >
                            {issue.severity}
                          </Badge>
                          <Badge variant="outline" className="border-white/10 text-zinc-300">
                            {PROVIDER_LABELS[issue.sourceProvider]}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="issue-queue" forceMount className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-200">Issue Queue</p>
                  <Badge variant="outline" className="border-white/10 text-zinc-300">
                    {filteredIssues.length} visible
                  </Badge>
                </div>

                <div className="mb-3 grid grid-cols-1 gap-3 lg:grid-cols-3">
                  <Input
                    value={issueQuery}
                    onChange={(event) => setIssueQuery(event.target.value)}
                    placeholder="Search issue title or provider"
                    className="lg:col-span-2"
                  />

                  <div className="flex flex-wrap gap-2">
                    {(['all', 'critical', 'warning', 'info'] as const).map((value) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant={severityFilter === value ? 'default' : 'outline'}
                        className={
                          severityFilter === value
                            ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                            : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                        }
                        onClick={() => setSeverityFilter(value)}
                      >
                        {value}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={providerFilter === 'all' ? 'default' : 'outline'}
                    className={
                      providerFilter === 'all'
                        ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                        : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                    }
                    onClick={() => setProviderFilter('all')}
                  >
                    all providers
                  </Button>
                  {PROVIDER_ORDER.map((provider) => (
                    <Button
                      key={provider}
                      type="button"
                      size="sm"
                      variant={providerFilter === provider ? 'default' : 'outline'}
                      className={
                        providerFilter === provider
                          ? 'bg-emerald-700 text-white hover:bg-emerald-600'
                          : 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                      }
                      onClick={() => setProviderFilter(provider)}
                    >
                      {PROVIDER_LABELS[provider]}
                    </Button>
                  ))}
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Issue</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Provider</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIssues.map((issue, index) => (
                      <TableRow key={`${issue.title}-${index}`}>
                        <TableCell className="text-zinc-200">{issue.title}</TableCell>
                        <TableCell>
                          <Badge
                            variant={severityBadgeVariant(issue.severity)}
                            className={
                              issue.severity === 'info'
                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                : issue.severity === 'warning'
                                  ? 'border-zinc-600 bg-zinc-800/60 text-zinc-200'
                                  : 'border-zinc-500 bg-zinc-700/60 text-zinc-100'
                            }
                          >
                            {issue.severity}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-zinc-400">{PROVIDER_LABELS[issue.sourceProvider]}</TableCell>
                      </TableRow>
                    ))}
                    {!snapshot ? (
                      <TableRow>
                        <TableCell className="text-zinc-500" colSpan={3}>
                          Run an audit to populate issues.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {snapshot && filteredIssues.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3}>
                          <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                            <AlertTriangle className="h-4 w-4" />
                            No issues match the current filters.
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="provider-comparison" forceMount className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {providerData.map((provider) => (
                  <div key={provider.provider} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-zinc-200">{provider.label}</p>
                      <Badge
                        variant={statusBadgeVariant(provider.status)}
                        className={
                          provider.status === 'ok'
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                            : provider.status === 'partial'
                              ? 'border-zinc-600 bg-zinc-800/60 text-zinc-200'
                              : 'border-zinc-500 bg-zinc-700/60 text-zinc-100'
                        }
                      >
                        {provider.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-zinc-500">Issue contribution</p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-100">{provider.issues}</p>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs text-zinc-400">
                        <span>Signal reliability</span>
                        <span>{provider.score}%</span>
                      </div>
                      <Progress value={provider.score} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <p className="mb-3 text-sm font-medium text-zinc-200">Provider Health Matrix</p>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={providerData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                      <XAxis dataKey="label" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" domain={[0, 100]} />
                      <Tooltip cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
                      <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                        {providerData.map((entry) => (
                          <Cell key={entry.provider} fill={STATUS_COLORS[entry.status]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
