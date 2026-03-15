import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import type { AuditExecutionMeta, AuditResponsePayload, PlatformResult } from '@/lib/audit/types'
import { computeAuditResults } from '@/lib/audit/scorer'
import { normalizeTopicalMap } from '@/lib/audit/topical-map-normalizer'
import { buildTopicalMapPayload } from '@/lib/audit/topical-map-payload'
import { buildAuditScorecard } from '@/lib/audit/scorecard'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface PersistedAuditRow {
  id: string
  email?: string | null
  brand_name: string | null
  competitors: unknown
  platform_results: unknown
  public_visibility?: 'unlisted' | 'public' | 'private' | null
  created_at: string | Date
}

function jsonResponse(payload: AuditResponsePayload, status: number): NextResponse {
  return NextResponse.json(payload, { status })
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[]
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? (parsed as T[]) : []
    } catch {
      return []
    }
  }

  return []
}

function parseExecutionMeta(platformResults: PlatformResult[]): AuditExecutionMeta {
  const citationAvailability = platformResults.some((result) => result.citationUrls.length > 0)
    ? 'full'
    : 'degraded'

  return {
    fallbackApplied: false,
    citationAvailability,
  }
}

function toRows(result: unknown): PersistedAuditRow[] {
  if (Array.isArray(result)) {
    return result as PersistedAuditRow[]
  }

  if (
    result &&
    typeof result === 'object' &&
    'rows' in result &&
    Array.isArray((result as { rows?: unknown }).rows)
  ) {
    return (result as { rows: PersistedAuditRow[] }).rows
  }

  return []
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await context.params
  if (!UUID_REGEX.test(id)) {
    return jsonResponse(
      {
        ok: false,
        stage: 'detected',
        message: 'Invalid audit id format.',
      },
      400
    )
  }

  let queryResult: unknown
  try {
    queryResult = await db.execute(sql`
      SELECT id, email, brand_name, competitors, platform_results, public_visibility, created_at
      FROM ai_visibility_audits
      WHERE id = ${id}
      LIMIT 1
    `)
  } catch (error) {
    console.error('[AI Visibility Audit] Failed to fetch persisted audit:', error)
    return jsonResponse(
      {
        ok: false,
        stage: 'detected',
        message: 'We could not load this audit right now. Please try again.',
      },
      500
    )
  }

  const row = toRows(queryResult)[0]
  if (!row) {
    return jsonResponse(
      {
        ok: false,
        stage: 'detected',
        message: 'Audit report not found.',
      },
      404
    )
  }

  if ((row.public_visibility || 'unlisted') === 'private') {
    const user = await currentUser()
    const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim()
    const rowEmail = row.email?.toLowerCase().trim()

    if (!userEmail) {
      return jsonResponse(
        {
          ok: false,
          stage: 'detected',
          message: 'Unauthorized.',
        },
        401
      )
    }

    if (!rowEmail || rowEmail !== userEmail) {
      return jsonResponse(
        {
          ok: false,
          stage: 'detected',
          message: 'Forbidden.',
        },
        403
      )
    }
  }

  const competitors = asArray<string>(row.competitors)
  const platformResults = asArray<PlatformResult>(row.platform_results)
  const results = computeAuditResults(
    {
      brand: row.brand_name || 'Your brand',
      category: 'Unknown',
      icp: 'Unknown',
      competitors,
      vertical: 'Unknown',
    },
    platformResults
  )
  const executionMeta = parseExecutionMeta(platformResults)
  const normalizedTopicalMap = normalizeTopicalMap({
    aiDiagnostics: {
      topics: platformResults.slice(0, 3).map((result, index) => ({
        topic: result.prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || `topic-${index + 1}`,
        aiMentions: result.brandMentioned ? 1 : 0,
        citations: result.citationUrls.length,
        sourceUrl: result.citationUrls[0] || `https://${results.brand.toLowerCase().replace(/\s+/g, '')}.com`,
      })),
    },
    providerStatus: {
      dataforseo: 'partial',
      firecrawl: 'partial',
      aiDiagnostics: executionMeta.citationAvailability === 'degraded' ? 'partial' : 'ok',
    },
  })
  const topicalMapPayload = buildTopicalMapPayload({
    brand: row.brand_name || 'Your brand',
    nodes: normalizedTopicalMap.nodes,
    confidence: normalizedTopicalMap.confidence,
    partialData: normalizedTopicalMap.partialData,
    providerStatus: normalizedTopicalMap.providerStatus,
    visibility: row.public_visibility || 'unlisted',
  })
  const hydratedResults = {
    ...results,
    scorecard: buildAuditScorecard({
      results,
      platformResults,
      topicalMapPayload,
      executionMeta,
    }),
  }

  return jsonResponse(
    {
      ok: true,
      stage: 'completed',
      auditId: row.id,
      completedAt: new Date(row.created_at).toISOString(),
      results: hydratedResults,
      platformResults,
      executionMeta,
      citationUrls: hydratedResults.citationUrls,
      totalChecks: 5,
      publicVisibility: topicalMapPayload.publicVisibility,
      topicalMapPayload,
    },
    200
  )
}
