import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { db, redditGapAudits } from '@/lib/db'
import { getRedisClient } from '@/lib/redis/client'
import { discoverSubreddits } from '@/lib/reddit-gap/analyzer'
import { runFullAnalysis } from '@/lib/reddit-gap/analyzer'
import type {
  RedditGapDetectPayload,
  RedditGapRunPayload,
  RedditGapRequestPayload,
  RedditGapResponsePayload,
  SubredditDiscovery,
} from '@/lib/reddit-gap/types'

const RATE_LIMIT_PER_DAY = 3
type RateLimitScope = 'detect' | 'run'
const inMemoryLimiter = new Map<string, number[]>()
const MAX_IN_MEMORY_LIMIT_KEYS = 2000
let hasLoggedRedisFallback = false

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const real = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0].trim() || real || 'ip:unknown'
}

async function enforceRateLimit(ipAddress: string, scope: RateLimitScope): Promise<boolean> {
  const key = `reddit-gap:${scope}:${ipAddress}:${new Date().toISOString().slice(0, 10)}`

  try {
    const redis = getRedisClient()

    if (redis) {
      const count = await redis.incr(key)
      if (count === 1) {
        await redis.expire(key, 24 * 60 * 60)
      }
      return count <= RATE_LIMIT_PER_DAY
    }
  } catch (error) {
    console.warn('[Reddit Gap] Redis error (non-blocking):', error)
  }

  if (!hasLoggedRedisFallback) {
    console.warn('[Reddit Gap] Redis unavailable; using in-memory rate limiter')
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

function validateDetectPayload(payload: RedditGapDetectPayload): string | null {
  if (!payload.topic || payload.topic.trim().length < 2) {
    return 'Topic is required (minimum 2 characters).'
  }
  if (payload.topic.length > 200) {
    return 'Topic must be 200 characters or less.'
  }
  return null
}

function validateRunPayload(payload: RedditGapRunPayload): string | null {
  if (!payload.topic || payload.topic.trim().length < 2) {
    return 'Topic is required (minimum 2 characters).'
  }
  if (!payload.email) {
    return 'Email is required to unlock the full report.'
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(payload.email)) {
    return 'Please provide a valid email address.'
  }
  return null
}

async function persistAudit(input: {
  email: string
  topic: string
  url: string | null
  results: ReturnType<typeof runFullAnalysis> extends Promise<infer T> ? T : never
  ipAddress: string
}): Promise<string | null> {
  try {
    const insertResult = await db.execute(sql`
      INSERT INTO reddit_gap_audits (
        email, topic, url, discovered_subreddits, thread_count,
        content_gaps, scorecard, overall_gap_score, total_questions_found,
        analysis_confidence, ip_address
      ) VALUES (
        ${input.email.trim().toLowerCase()},
        ${input.topic.trim()},
        ${input.url || null},
        ${JSON.stringify(input.results.discoveredSubreddits)}::jsonb,
        ${input.results.analyzedThreads},
        ${JSON.stringify(input.results.contentGaps)}::jsonb,
        ${JSON.stringify(input.results.scorecard)}::jsonb,
        ${input.results.scorecard.overallGapScore},
        ${input.results.totalQuestionsFound},
        ${input.results.analysisConfidence},
        ${input.ipAddress}
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
  } catch (error) {
    console.warn('[Reddit Gap] Persistence skipped:', error)
    return null
  }
}

function jsonResponse(payload: RedditGapResponsePayload, status = 200): NextResponse {
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

    const payload = rawPayload as RedditGapRequestPayload
    const ipAddress = getRequestIp(request)

    if (payload.action === 'detect') {
      const detectPayload = payload as RedditGapDetectPayload
      const detectError = validateDetectPayload(detectPayload)
      if (detectError) {
        return jsonResponse({ ok: false, stage: 'detected', message: detectError }, 400)
      }

      const allowed = await enforceRateLimit(ipAddress, 'detect')
      if (!allowed) {
        return jsonResponse(
          { ok: false, stage: 'detected', message: 'Rate limit reached. Please try again tomorrow.' },
          429
        )
      }

      console.log(`[Reddit Gap] Discovering subreddits for: "${detectPayload.topic}"`)

      let discovered: SubredditDiscovery[]
      try {
        discovered = await discoverSubreddits(detectPayload.topic)
      } catch (error) {
        console.error('[Reddit Gap] Subreddit discovery failed:', error)
        return jsonResponse(
          { ok: false, stage: 'detected', message: 'Reddit API is unavailable. Please try again in a few minutes.' },
          503
        )
      }

      if (discovered.length === 0) {
        return jsonResponse(
          { ok: false, stage: 'detected', message: 'No relevant subreddits found. Try a broader topic.' },
          200
        )
      }

      return jsonResponse({
        ok: true,
        stage: 'detected',
        detected: discovered,
        detectionMeta: { source: 'searched' },
        message: `Found ${discovered.length} relevant subreddits. Select the ones you'd like to analyze and unlock the full content gap report.`,
      })
    }

    const runPayload = payload as RedditGapRunPayload
    const runError = validateRunPayload(runPayload)
    if (runError) {
      return jsonResponse({ ok: false, stage: 'detected', message: runError }, 400)
    }

    const allowed = await enforceRateLimit(ipAddress, 'run')
    if (!allowed) {
      return jsonResponse(
        { ok: false, stage: 'detected', message: 'Rate limit reached. Please try again tomorrow.' },
        429
      )
    }

    console.log(`[Reddit Gap] Running full analysis for: "${runPayload.topic}"`)

    let results
    try {
      results = await runFullAnalysis(
        runPayload.topic,
        runPayload.url || null,
        runPayload.confirmedSubreddits
      )
    } catch (error) {
      console.error('[Reddit Gap] Analysis failed:', error)
      return jsonResponse(
        { ok: false, stage: 'detected', message: 'Analysis failed. Please try again.' },
        500
      )
    }

    const auditId = await persistAudit({
      email: runPayload.email,
      topic: runPayload.topic,
      url: runPayload.url || null,
      results,
      ipAddress,
    })

    const completedAt = new Date().toISOString()

    return jsonResponse({
      ok: true,
      stage: 'completed',
      results,
      auditId: auditId || undefined,
      completedAt,
      message: `Analysis complete! Found ${results.contentGaps.length} content gaps across ${results.analyzedThreads} Reddit threads.`,
    })
  } catch (error) {
    console.error('[Reddit Gap] Error:', error)
    return jsonResponse(
      { ok: false, stage: 'detected', message: 'An unexpected error occurred. Please try again.' },
      500
    )
  }
}