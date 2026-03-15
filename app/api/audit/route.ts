import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { getRedisClient } from '@/lib/redis/client'
import type {
  AuditDetectPayload,
  AuditRequestPayload,
  AuditRunPayload,
  AuditResponsePayload,
  BrandDetectionPayload,
} from '@/lib/audit/types'
import { buildBuyerIntentPrompts } from '@/lib/audit/prompts'
import { executeAiVisibilityAuditWorkflow } from '@/lib/workflows/definitions/ai-visibility-audit'
import { parsePlatformResponse } from '@/lib/audit/parser'
import { computeAuditResults } from '@/lib/audit/scorer'
import { runHomepageExtraction } from '@/lib/audit/extraction-agent'
import { sendAuditReportEmail } from '@/lib/audit/report-email'
import { normalizeTopicalMap } from '@/lib/audit/topical-map-normalizer'
import { buildTopicalMapPayload } from '@/lib/audit/topical-map-payload'
import { buildAuditScorecard } from '@/lib/audit/scorecard'

const RATE_LIMIT_PER_DAY = 2
type AuditRateLimitScope = 'detect' | 'run'
const inMemoryLimiter = new Map<string, number[]>()
const MAX_IN_MEMORY_LIMIT_KEYS = 2000
let hasLoggedRedisFallback = false

function normalizeDomain(domain: string): string {
  const trimmed = domain.trim().toLowerCase()
  const normalized = trimmed.replace(/^https?:\/\//, '').replace(/^www\./, '')
  return normalized.split('/')[0]
}

function buildFallbackBrandContext(domain: string): BrandDetectionPayload {
  const normalized = normalizeDomain(domain)
  const root = normalized.split('.')[0]
  const title = root
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

  return {
    brand: title || 'Your Brand',
    category: 'SEO software',
    icp: 'marketing teams and growth-focused founders',
    competitors: ['Semrush', 'Ahrefs', 'Surfer SEO'],
    vertical: 'Digital Marketing',
  }
}

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0].trim() || real || 'ip:unknown'
}

async function enforceRateLimit(ipAddress: string, scope: AuditRateLimitScope): Promise<boolean> {
  const redis = getRedisClient()
  const key = `ai-visibility-audit:${scope}:${ipAddress}:${new Date().toISOString().slice(0, 10)}`

  if (redis) {
    const count = await redis.incr(key)
    if (count === 1) {
      await redis.expire(key, 24 * 60 * 60)
    }
    return count <= RATE_LIMIT_PER_DAY
  }

  if (!hasLoggedRedisFallback) {
    console.warn('[AI Visibility Audit] Redis unavailable; using best-effort in-memory rate limiter')
    hasLoggedRedisFallback = true
  }

  const now = Date.now()
  const windowMs = 24 * 60 * 60 * 1000

  for (const [existingKey, timestamps] of inMemoryLimiter.entries()) {
    const activeTimes = timestamps.filter((time) => now - time < windowMs)
    if (activeTimes.length === 0) {
      inMemoryLimiter.delete(existingKey)
    } else if (activeTimes.length !== timestamps.length) {
      inMemoryLimiter.set(existingKey, activeTimes)
    }
  }

  if (!inMemoryLimiter.has(key) && inMemoryLimiter.size >= MAX_IN_MEMORY_LIMIT_KEYS) {
    const oldestKey = inMemoryLimiter.keys().next().value
    if (oldestKey) {
      inMemoryLimiter.delete(oldestKey)
    }
  }

  const entries = inMemoryLimiter.get(key) || []
  const active = entries.filter((time) => now - time < windowMs)

  if (active.length >= RATE_LIMIT_PER_DAY) {
    inMemoryLimiter.set(key, active)
    return false
  }

  active.push(now)
  inMemoryLimiter.set(key, active)
  return true
}

async function enforceBudgetGuards(): Promise<{ allowed: boolean; message?: string }> {
  if (process.env.AUDIT_KILL_SWITCH === 'true') {
    return {
      allowed: false,
      message: 'Audits are temporarily paused. Please try again later.',
    }
  }

  const dailyLimit = Number(process.env.AUDIT_DAILY_BUDGET_LIMIT || '50')
  let result: unknown
  try {
    result = await db.execute(
      sql`SELECT COUNT(*)::int AS count FROM ai_visibility_audits WHERE created_at >= CURRENT_DATE`
    )
  } catch (error) {
    console.warn('[AI Visibility Audit] Budget table unavailable, skipping daily count gate')
    return { allowed: true }
  }

  const todayCount = Array.isArray(result)
    ? Number((result[0] as { count?: number } | undefined)?.count || 0)
    : result &&
        typeof result === 'object' &&
        'rows' in result &&
        Array.isArray((result as { rows?: Array<{ count?: number }> }).rows)
      ? Number((result as { rows: Array<{ count?: number }> }).rows[0]?.count || 0)
      : 0
  if (todayCount >= dailyLimit) {
    return {
      allowed: false,
      message: 'High demand today. New audit slots open tomorrow after the daily budget reset.',
    }
  }

  return { allowed: true }
}

function validateDetectPayload(payload: AuditDetectPayload): string | null {
  if (!payload.domain) {
    return 'Domain is required.'
  }

  return null
}

function validateRunPayload(payload: AuditRunPayload): string | null {
  if (!payload.domain || !payload.email) {
    return 'Domain and email are required.'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(payload.email)) {
    return 'Please provide a valid email address.'
  }

  return null
}

async function persistAudit(input: {
  payload: AuditRunPayload
  results: ReturnType<typeof computeAuditResults>
  platformResults: ReturnType<typeof parsePlatformResponse>[]
  ipAddress: string
}): Promise<string | null> {
  const insertResult = await db.execute(sql`
    INSERT INTO ai_visibility_audits (
      email,
      domain,
      brand_name,
      category,
      icp,
      competitors,
      vertical,
      visibility_rate,
      brand_found_count,
      total_checks,
      top_competitor,
      top_competitor_count,
      platform_results,
      citation_urls,
      ip_address,
      converted
    ) VALUES (
      ${input.payload.email.trim().toLowerCase()},
      ${normalizeDomain(input.payload.domain)},
      ${input.payload.confirmedContext.brand},
      ${input.payload.confirmedContext.category},
      ${input.payload.confirmedContext.icp},
      ${JSON.stringify(input.payload.confirmedContext.competitors)}::jsonb,
      ${input.payload.confirmedContext.vertical},
      ${input.results.visibilityRate},
      ${input.results.brandFoundCount},
      ${input.results.totalChecks},
      ${input.results.topCompetitor},
      ${input.results.topCompetitorFoundCount},
      ${JSON.stringify(input.platformResults)}::jsonb,
      ${JSON.stringify(input.results.citationUrls)}::jsonb,
      ${input.ipAddress},
      false
    )
    RETURNING id
  `)

  if (Array.isArray(insertResult)) {
    return typeof insertResult[0]?.id === 'string' ? insertResult[0].id : null
  }

  if (
    insertResult &&
    typeof insertResult === 'object' &&
    'rows' in insertResult &&
    Array.isArray((insertResult as { rows?: Array<{ id?: unknown }> }).rows)
  ) {
    const firstRow = (insertResult as { rows: Array<{ id?: unknown }> }).rows[0]
    return typeof firstRow?.id === 'string' ? firstRow.id : null
  }

  return null
}

function jsonResponse(payload: AuditResponsePayload, status = 200): NextResponse {
  return NextResponse.json(payload, { status })
}

export async function POST(request: NextRequest) {
  try {
    let rawPayload: unknown
    try {
      rawPayload = await request.json()
    } catch {
      return jsonResponse({ ok: false, stage: 'detected', message: 'Invalid JSON body.' }, 400)
    }

    const payload = rawPayload as AuditRequestPayload

    if (payload.action === 'detect') {
      const detectPayload = payload as AuditDetectPayload
      const detectError = validateDetectPayload(detectPayload)
      if (detectError) {
        return jsonResponse({ ok: false, stage: 'detected', message: detectError }, 400)
      }
      const ipAddress = getRequestIp(request)
      const allowedByRateLimit = await enforceRateLimit(ipAddress, 'detect')
      if (!allowedByRateLimit) {
        return jsonResponse(
          {
            ok: false,
            stage: 'detected',
            message: 'You reached the free audit limit for today. Please try again tomorrow.',
          },
          429
        )
      }
      const budget = await enforceBudgetGuards()
      if (!budget.allowed) {
        return jsonResponse({ ok: false, stage: 'detected', message: budget.message }, 503)
      }

      const extracted = await runHomepageExtraction({
        domain: detectPayload.domain,
      })
      const detected = extracted.detected || buildFallbackBrandContext(detectPayload.domain)

      return jsonResponse({
        ok: true,
        stage: 'detected',
        detected,
        detectionMeta: extracted.success
          ? { source: 'scraped' }
          : {
              source: 'fallback',
              fallbackReason: extracted.error || 'Homepage extraction unavailable for this site.',
            },
        message: extracted.success
          ? 'Preview your AI visibility scorecard inputs, then unlock the full report.'
          : 'We could not confidently extract your homepage profile, so we generated a safe editable draft you can refine before unlocking the full report.',
      })
    }

    const runPayload = payload as AuditRunPayload
    const runError = validateRunPayload(runPayload)
    if (runError) {
      return jsonResponse({ ok: false, stage: 'detected', message: runError }, 400)
    }

    const { userId } = await auth()
    if (!userId) {
      return jsonResponse(
        {
          ok: false,
          stage: 'detected',
          message: 'Please sign in to unlock the full AI visibility report.',
        },
        401
      )
    }

    if (!runPayload.confirmedContext) {
      return jsonResponse(
        {
          ok: false,
          stage: 'detected',
          message: 'Confirmed brand details are required before running checks.',
        },
        400
      )
    }

    const ipAddress = getRequestIp(request)
    const allowedByRateLimit = await enforceRateLimit(ipAddress, 'run')
    if (!allowedByRateLimit) {
      return jsonResponse(
        {
          ok: false,
          stage: 'detected',
          message: 'You reached the free audit limit for today. Please try again tomorrow.',
        },
        429
      )
    }

    const budget = await enforceBudgetGuards()
    if (!budget.allowed) {
      return jsonResponse({ ok: false, stage: 'detected', message: budget.message }, 503)
    }

    const prompts = buildBuyerIntentPrompts(runPayload.confirmedContext)
    const workflowExecution = await executeAiVisibilityAuditWorkflow({
      prompts,
      context: runPayload.confirmedContext,
      mockSafe: runPayload.mockSafe,
      simulatePerplexityFailure: runPayload.simulatePerplexityFailure,
      simulateGrokFailure: runPayload.simulateGrokFailure,
    })

    const platformResults = workflowExecution.checks.map((check) =>
      parsePlatformResponse({
        platform: check.platform,
        prompt: check.prompt,
        rawResponse: check.rawResponse,
        citationUrls: check.citationUrls,
        domain: runPayload.domain,
        context: runPayload.confirmedContext,
      })
    )

    const results = computeAuditResults(runPayload.confirmedContext, platformResults)
    const normalizedTopicalMap = normalizeTopicalMap(
      workflowExecution.topicalMapInput || {
        aiDiagnostics: {
          topics: platformResults.slice(0, 3).map((result, index) => ({
            topic: result.prompt.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim() || `topic-${index + 1}`,
            aiMentions: result.brandMentioned ? 1 : 0,
            citations: result.citationUrls.length,
            sourceUrl: result.citationUrls[0] || `https://${normalizeDomain(runPayload.domain)}`,
          })),
        },
        providerStatus: {
          dataforseo: 'partial',
          firecrawl: 'partial',
          aiDiagnostics: workflowExecution.meta.citationAvailability === 'degraded' ? 'partial' : 'ok',
        },
      }
    )
    const topicalMapPayload = buildTopicalMapPayload({
      brand: runPayload.confirmedContext.brand,
      nodes: normalizedTopicalMap.nodes,
      confidence: normalizedTopicalMap.confidence,
      partialData: normalizedTopicalMap.partialData,
      providerStatus: normalizedTopicalMap.providerStatus,
    })
    const scorecard = buildAuditScorecard({
      results,
      platformResults,
      topicalMapPayload,
      executionMeta: workflowExecution.meta,
    })
    const hydratedResults = {
      ...results,
      scorecard,
    }
    const completedAt = new Date().toISOString()

    let auditId: string | undefined
    try {
      const persistedAuditId = await persistAudit({
        payload: runPayload,
        results,
        platformResults,
        ipAddress,
      })
      auditId = persistedAuditId || undefined
    } catch (error) {
      console.warn('[AI Visibility Audit] Persistence skipped (table may be missing locally)')
    }

    if (auditId) {
      void sendAuditReportEmail({
        auditId,
        email: runPayload.email,
        results: hydratedResults,
        executionMeta: workflowExecution.meta,
      }).catch((error) => {
        console.warn('[AI Visibility Audit] Email recap failed (non-blocking):', error)
      })
    }

    return jsonResponse({
      ok: true,
      stage: 'completed',
      results: hydratedResults,
      platformResults,
      executionMeta: workflowExecution.meta,
      auditId,
      completedAt,
      citationUrls: hydratedResults.citationUrls,
      totalChecks: 5,
      publicVisibility: topicalMapPayload.publicVisibility,
      topicalMapPayload,
    })
  } catch (error) {
    console.error('[AI Visibility Audit] Error:', error)
    return jsonResponse(
      {
        ok: false,
        stage: 'detected',
        message: 'We could not complete this audit right now. Please try again.',
      },
      500
    )
  }
}
