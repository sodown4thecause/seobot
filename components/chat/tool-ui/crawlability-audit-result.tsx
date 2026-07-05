'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Bot, FileText, ShieldCheck, ShieldAlert } from 'lucide-react'

interface CrawlabilityAuditResultProps {
  toolInvocation: {
    result?: {
      success?: boolean
      domain?: string
      score?: number
      robotsTxt?: { found: boolean; url: string; sitemapUrls?: string[] }
      llmsTxt?: { found: boolean; url: string }
      crawlers?: Array<{
        label: string
        vendor: string
        status: string
        notes: string
      }>
      issues?: string[]
      recommendations?: string[]
    }
  }
}

function statusStyles(status: string) {
  switch (status) {
    case 'allowed':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
    case 'blocked':
      return 'border-rose-500/30 bg-rose-500/10 text-rose-300'
    case 'partially_blocked':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300'
    default:
      return 'border-zinc-700 bg-zinc-900/40 text-zinc-400'
  }
}

export function CrawlabilityAuditResult({ toolInvocation }: CrawlabilityAuditResultProps) {
  const result = toolInvocation.result

  if (!result?.success) {
    return (
      <div className="my-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
        Crawlability audit failed.
      </div>
    )
  }

  return (
    <Card className="my-4 overflow-hidden border-zinc-800 bg-zinc-950 text-zinc-100 border-l-4 border-l-cyan-500/50">
      <CardHeader className="border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10">
              <Bot className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Crawlability Audit</CardTitle>
              <p className="text-sm text-zinc-400">{result.domain}</p>
            </div>
          </div>
          <Badge variant="outline" className="border-cyan-500/30 text-cyan-300">
            Score {result.score ?? 0}/100
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-zinc-400" />
              robots.txt
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {result.robotsTxt?.found ? 'Found' : 'Missing'} — {result.robotsTxt?.url}
            </p>
            {result.robotsTxt?.sitemapUrls?.length ? (
              <p className="mt-1 text-[11px] text-zinc-500">
                Sitemaps: {result.robotsTxt.sitemapUrls.length}
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-zinc-400" />
              llms.txt
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {result.llmsTxt?.found ? 'Found' : 'Missing'} — {result.llmsTxt?.url}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {(result.crawlers ?? []).map((crawler) => (
            <div
              key={crawler.label}
              className={cn('rounded-lg border p-3', statusStyles(crawler.status))}
            >
              <div className="text-xs font-medium">{crawler.label}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wide opacity-80">
                {crawler.status.replace('_', ' ')}
              </div>
            </div>
          ))}
        </div>

        {result.issues?.length ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-rose-300">
              <ShieldAlert className="h-4 w-4" />
              Issues
            </div>
            <ul className="space-y-1 text-xs text-zinc-400">
              {result.issues.map((issue) => (
                <li key={issue}>• {issue}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {result.recommendations?.length ? (
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-emerald-300">
              <ShieldCheck className="h-4 w-4" />
              Recommendations
            </div>
            <ul className="space-y-1 text-xs text-zinc-400">
              {result.recommendations.map((rec) => (
                <li key={rec}>• {rec}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function CrawlabilityAuditArtifact({ data }: { data: unknown }) {
  return (
    <CrawlabilityAuditResult
      toolInvocation={{ result: data as CrawlabilityAuditResultProps['toolInvocation']['result'] }}
    />
  )
}
