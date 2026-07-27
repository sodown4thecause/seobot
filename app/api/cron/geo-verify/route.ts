import { NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { and, eq, lte, inArray } from 'drizzle-orm'
import { serverEnv } from '@/lib/config/env'
import { db } from '@/lib/db'
import { geoFixCycles, type Json } from '@/lib/db/schema'
import { runVerification } from '@/lib/geo/fix-cycle'

export const maxDuration = 300
const BATCH_LIMIT = 25
const FAILURE_BACKOFF_HOURS = 6
const MAX_CONSECUTIVE_FAILURES = 5

function isAuthorized(authHeader: string | null): boolean {
  if (!serverEnv.CRON_SECRET || !authHeader?.startsWith('Bearer ')) return false
  const supplied = Buffer.from(authHeader.slice('Bearer '.length))
  const expected = Buffer.from(serverEnv.CRON_SECRET)
  return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}

function failureCount(value: Json | null): number {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 0
  const countValue = value.verificationFailures
  return typeof countValue === 'number' ? countValue : 0
}

function withFailureMetadata(value: Json | null, failures: number, message: string): Json {
  const existing = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return {
    ...existing,
    verificationFailures: failures,
    lastVerificationError: message,
  }
}

export async function GET(req: Request) {
  if (!isAuthorized(req.headers.get('authorization'))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const now = new Date()
  const cycles = await db.select()
    .from(geoFixCycles)
    .where(and(
      inArray(geoFixCycles.status, ['shipped', 'verifying']),
      lte(geoFixCycles.nextVerifyAt, now),
    ))
    .limit(BATCH_LIMIT)

  const results: Array<{ cycleId: string; status: string; error?: string }> = []
  for (const cycle of cycles) {
    try {
      const updated = await runVerification(cycle.id)
      results.push({ cycleId: cycle.id, status: updated.status })
    } catch (error) {
      const failures = failureCount(cycle.latestDelta) + 1
      const message = error instanceof Error ? error.message : 'Verification failed'
      await db.update(geoFixCycles)
        .set({
          status: failures >= MAX_CONSECUTIVE_FAILURES ? 'archived' : cycle.status,
          nextVerifyAt: new Date(now.getTime() + FAILURE_BACKOFF_HOURS * 60 * 60 * 1000),
          latestDelta: withFailureMetadata(cycle.latestDelta, failures, message),
        })
        .where(eq(geoFixCycles.id, cycle.id))
      results.push({
        cycleId: cycle.id,
        status: failures >= MAX_CONSECUTIVE_FAILURES ? 'archived' : 'failed',
        error: message,
      })
    }
  }

  return NextResponse.json({
    success: results.every((result) => result.status !== 'failed'),
    processed: results.length,
    results,
  })
}
