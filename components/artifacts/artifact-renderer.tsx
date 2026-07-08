'use client'

import { useMemo } from 'react'
import { KeywordArtifact } from '@/components/chat/artifacts/keyword-artifact'
import { BacklinkArtifact } from '@/components/chat/artifacts/backlink-artifact'
import { BlogArtifact } from '@/components/chat/artifacts/blog-artifact'
import { SchemaMarkupArtifact } from '@/components/chat/tool-ui/schema-markup-result'
import { CrawlabilityAuditArtifact } from '@/components/chat/tool-ui/crawlability-audit-result'
import { GeoFixPlanArtifact } from '@/components/chat/tool-ui/geo-fix-plan-result'
import { GeoBrandScanResults } from '@/components/chat/tool-ui/geo-brand-scan-results'
import { SocialListeningResult } from '@/components/chat/tool-ui/social-listening-result'
import { getArtifactDefinition } from '@/lib/artifacts/registry'
import type { ArtifactStatus, ArtifactType } from '@/lib/artifacts/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ArtifactRendererProps {
  type: ArtifactType
  data: unknown
  status: ArtifactStatus
  className?: string
}

function PlannedArtifactPlaceholder({
  type,
  status,
}: {
  type: ArtifactType
  status: ArtifactStatus
}) {
  const definition = getArtifactDefinition(type)

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <Badge variant="outline" className="mb-4 text-zinc-400 border-zinc-700">
        Coming soon
      </Badge>
      <h3 className="text-lg font-semibold text-zinc-100">{definition.label}</h3>
      <p className="mt-2 text-sm text-zinc-500 max-w-sm">{definition.description}</p>
      {status === 'streaming' || status === 'loading' ? (
        <p className="mt-4 text-xs text-zinc-600 animate-pulse">Generating…</p>
      ) : null}
    </div>
  )
}

export function ArtifactRenderer({ type, data, status, className }: ArtifactRendererProps) {
  const definition = getArtifactDefinition(type)

  if (definition.status === 'planned') {
    return (
      <div className={cn('h-full', className)}>
        <PlannedArtifactPlaceholder type={type} status={status} />
      </div>
    )
  }

  switch (type) {
    case 'keyword':
      return (
        <div className={cn('h-full', className)}>
          <KeywordArtifact
            data={data as Parameters<typeof KeywordArtifact>[0]['data']}
            status={status}
          />
        </div>
      )
    case 'backlink':
      return (
        <div className={cn('h-full', className)}>
          <BacklinkArtifact
            data={data as Parameters<typeof BacklinkArtifact>[0]['data']}
            status={status}
          />
        </div>
      )
    case 'blog': {
      const blogData = data as { title?: string; content?: string } | null
      return (
        <div className={cn('h-full overflow-auto', className)}>
          <BlogArtifact
            title={blogData?.title}
            content={blogData?.content ?? ''}
            isStreaming={status === 'streaming' || status === 'loading'}
          />
        </div>
      )
    }
    case 'social-listening':
      return (
        <div className={cn('h-full overflow-auto', className)}>
          <SocialListeningResult
            toolInvocation={{ result: data, state: status === 'complete' ? 'result' : status }}
          />
        </div>
      )
    case 'serp':
      return (
        <div className={cn('h-full overflow-auto p-6', className)}>
          <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
            {data ? JSON.stringify(data, null, 2) : 'Loading SERP data…'}
          </pre>
        </div>
      )
    case 'schema-markup-generator':
      return (
        <div className={cn('h-full overflow-auto', className)}>
          <SchemaMarkupArtifact data={data} />
        </div>
      )
    case 'robots-sitemap-audit':
      return (
        <div className={cn('h-full overflow-auto', className)}>
          <CrawlabilityAuditArtifact data={data} />
        </div>
      )
    case 'geo-content-gap-report':
      return (
        <div className={cn('h-full overflow-auto', className)}>
          <GeoFixPlanArtifact data={data} />
        </div>
      )
    case 'citation-tracker':
      return (
        <div className={cn('h-full overflow-auto', className)}>
          <GeoBrandScanResults
            toolInvocation={{ result: data as Parameters<typeof GeoBrandScanResults>[0]['toolInvocation']['result'], state: status === 'complete' ? 'result' : status }}
          />
        </div>
      )
    default:
      return (
        <div className={cn('h-full overflow-auto p-6', className)}>
          <DefaultArtifactData type={type} data={data} />
        </div>
      )
  }
}

function DefaultArtifactData({ type, data }: { type: ArtifactType; data: unknown }) {
  const definition = getArtifactDefinition(type)
  const entries = useMemo(() => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return null
    }
    return Object.entries(data as Record<string, unknown>).filter(
      ([key]) => !key.startsWith('_')
    )
  }, [data])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-zinc-400 border-zinc-700">
          {definition.label}
        </Badge>
      </div>
      {entries && entries.length > 0 ? (
        <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2"
            >
              <dt className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
                {key}
              </dt>
              <dd className="mt-1 text-xs text-zinc-200 break-words">
                {formatValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <pre className="text-xs text-zinc-400 whitespace-pre-wrap">
          {data ? JSON.stringify(data, null, 2) : 'No data available.'}
        </pre>
      )}
    </div>
  )
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
