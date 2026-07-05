'use client'

import { KeywordArtifact } from '@/components/chat/artifacts/keyword-artifact'
import { BacklinkArtifact } from '@/components/chat/artifacts/backlink-artifact'
import { BlogArtifact } from '@/components/chat/artifacts/blog-artifact'
import { SchemaMarkupArtifact } from '@/components/chat/tool-ui/schema-markup-result'
import { CrawlabilityAuditArtifact } from '@/components/chat/tool-ui/crawlability-audit-result'
import { GeoFixPlanArtifact } from '@/components/chat/tool-ui/geo-fix-plan-result'
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
    default:
      return (
        <div className={cn('p-6 text-sm text-zinc-500', className)}>
          No renderer for artifact type: {type}
        </div>
      )
  }
}
