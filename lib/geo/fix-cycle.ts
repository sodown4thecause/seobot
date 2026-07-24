import 'server-only'

import { randomBytes } from 'node:crypto'
import { and, count, desc, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { geoFixCycles, geoPrompts, geoRuns, type GeoFixCycle, type GeoRun, type Json } from '@/lib/db/schema'
import { checkSubscription } from '@/lib/billing/subscription-guard'
import { buildGeoFixPlan, type GeoFixPlan } from '@/lib/geo/fix-generator'
import { runGEOBrandScan } from '@/lib/geo/brand-tracker'
import { computeCitationDelta, type GeoCitationDelta } from '@/lib/geo/citation-delta'
import type { GeoEngine } from '@/lib/geo/types'

export const MAX_ACTIVE_FIX_CYCLES = 15
export const DEFAULT_VERIFY_SCHEDULE = 'every_3_days'

export function generateFixCycleShareToken(): string {
  return randomBytes(32).toString('base64url')
}

export type FixCycleStatus =
  | 'scanning'
  | 'fix_proposed'
  | 'shipped'
  | 'verifying'
  | 'improved'
  | 'no_change'
  | 'regressed'
  | 'archived'

type StoredDelta = GeoCitationDelta & {
  consecutiveVerdictCount?: number
}

const ACTIVE_STATUSES: FixCycleStatus[] = ['scanning', 'fix_proposed', 'shipped', 'verifying']

function asJson(value: unknown): Json {
  return value as Json
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function addDays(date: Date, days: number): Date {
  return addHours(date, days * 24)
}

function selectFixPlan(scan: Awaited<ReturnType<typeof runGEOBrandScan>>): GeoFixPlan {
  const recommended = scan.recommendedFixes[0]
  return buildGeoFixPlan({
    brand: scan.brand,
    query: scan.query,
    fixType: recommended?.fixType ?? 'article_brief',
    targetPlatforms: recommended?.targetPlatforms,
    rationale: recommended?.rationale,
  })
}

export function applyVerificationVerdict(
  currentStatus: FixCycleStatus,
  previousDelta: StoredDelta | null,
  delta: GeoCitationDelta,
): { status: FixCycleStatus; delta: StoredDelta } {
  const verdict: Exclude<GeoCitationDelta['verdict'], 'pending'> =
    delta.verdict === 'pending' ? 'no_change' : delta.verdict
  const previousCount = previousDelta?.verdict === verdict
    ? previousDelta.consecutiveVerdictCount ?? 1
    : 0
  const consecutiveVerdictCount = previousCount + 1
  const status = consecutiveVerdictCount >= 2
    ? verdict
    : currentStatus === 'shipped' || currentStatus === 'verifying'
      ? 'verifying'
      : currentStatus

  return {
    status,
    delta: { ...delta, verdict, consecutiveVerdictCount },
  }
}

async function assertActiveCycleCapacity(userId: string): Promise<void> {
  const [{ activeCount }] = await db
    .select({ activeCount: count() })
    .from(geoFixCycles)
    .where(and(eq(geoFixCycles.userId, userId), inArray(geoFixCycles.status, ACTIVE_STATUSES)))

  if (activeCount >= MAX_ACTIVE_FIX_CYCLES) {
    throw new Error(`Active GEO fix cycle limit reached (${MAX_ACTIVE_FIX_CYCLES}). Archive a cycle before starting another.`)
  }
}

export async function startFixCycle(params: {
  userId: string
  brand: string
  query: string
  engines?: GeoEngine[]
  competitors?: string[]
}): Promise<GeoFixCycle> {
  const subscription = await checkSubscription(params.userId)
  if (!subscription.hasSubscription) {
    throw new Error('An active FlowIntent subscription is required to start a GEO fix cycle.')
  }
  await assertActiveCycleCapacity(params.userId)

  const engines = params.engines?.length
    ? params.engines
    : ['chatgpt', 'perplexity', 'google_ai_overview'] as GeoEngine[]
  const [prompt] = await db.insert(geoPrompts).values({
    userId: params.userId,
    prompt: params.query,
    brand: params.brand,
    engines,
    competitors: params.competitors ?? [],
    active: true,
  }).returning()

  const [cycle] = await db.insert(geoFixCycles).values({
    userId: params.userId,
    geoPromptId: prompt.id,
    brand: params.brand,
    query: params.query,
    engines,
    baselineRunIds: [],
    status: 'scanning',
    verifySchedule: DEFAULT_VERIFY_SCHEDULE,
  }).returning()

  const scan = await runGEOBrandScan({
    userId: params.userId,
    fixCycleId: cycle.id,
    brand: params.brand,
    query: params.query,
    engines,
    competitors: params.competitors,
  })
  if (scan.summary.totalPlatforms < 2) {
    await db.update(geoFixCycles)
      .set({ status: 'archived', latestDelta: asJson({ error: 'Baseline requires at least two successful engine probes.' }) })
      .where(eq(geoFixCycles.id, cycle.id))
    throw new Error('Baseline scan requires at least two successful engine probes.')
  }

  const fixPlan = selectFixPlan(scan)
  const [updated] = await db.update(geoFixCycles)
    .set({
      baselineRunIds: scan.runIds,
      fixPlan: asJson(fixPlan),
      fixType: fixPlan.fixType,
      status: 'fix_proposed',
    })
    .where(eq(geoFixCycles.id, cycle.id))
    .returning()

  return updated
}

export async function markShipped(params: {
  userId: string
  cycleId: string
  shippedUrl?: string
}): Promise<GeoFixCycle> {
  const [updated] = await db.update(geoFixCycles)
    .set({
      status: 'shipped',
      shippedUrl: params.shippedUrl?.trim() || null,
      shippedAt: new Date(),
      nextVerifyAt: addHours(new Date(), 24),
    })
    .where(and(eq(geoFixCycles.id, params.cycleId), eq(geoFixCycles.userId, params.userId)))
    .returning()

  if (!updated) throw new Error('Fix cycle not found.')
  return updated
}

function runRowsToCitationRuns(rows: GeoRun[]): Array<GeoRun & { status: string }> {
  return rows.map((row) => ({
    ...row,
    status: row.status,
    citedUrls: row.citedUrls ?? [],
    citedDomains: row.citedDomains ?? [],
    mentionedBrands: row.mentionedBrands ?? [],
  }))
}

export async function runVerification(cycleId: string): Promise<GeoFixCycle> {
  const [cycle] = await db.select().from(geoFixCycles).where(eq(geoFixCycles.id, cycleId)).limit(1)
  if (!cycle) throw new Error('Fix cycle not found.')
  if (cycle.status !== 'shipped' && cycle.status !== 'verifying') {
    throw new Error(`Fix cycle is not ready for verification (status: ${cycle.status}).`)
  }

  const baselineRows = cycle.baselineRunIds.length
    ? await db.select().from(geoRuns).where(inArray(geoRuns.id, cycle.baselineRunIds))
    : []
  const firstProbe = await runGEOBrandScan({
    userId: cycle.userId,
    fixCycleId: cycle.id,
    brand: cycle.brand,
    query: cycle.query,
    engines: cycle.engines,
  })
  const secondProbe = await runGEOBrandScan({
    userId: cycle.userId,
    fixCycleId: cycle.id,
    brand: cycle.brand,
    query: cycle.query,
    engines: cycle.engines,
  })
  const verificationIds = [...firstProbe.runIds, ...secondProbe.runIds]
  const verificationRows = verificationIds.length
    ? await db.select().from(geoRuns).where(inArray(geoRuns.id, verificationIds))
    : []
  const delta = computeCitationDelta(
    runRowsToCitationRuns(baselineRows),
    runRowsToCitationRuns(verificationRows),
    cycle.shippedUrl,
  )
  const resolved = applyVerificationVerdict(
    cycle.status as FixCycleStatus,
    (cycle.latestDelta ?? null) as StoredDelta | null,
    delta,
  )
  const [updated] = await db.update(geoFixCycles)
    .set({
      status: resolved.status,
      latestDelta: asJson(resolved.delta),
      lastVerifiedAt: new Date(),
      nextVerifyAt: addDays(new Date(), 3),
    })
    .where(eq(geoFixCycles.id, cycle.id))
    .returning()

  return updated
}

export async function listFixCycles(userId: string): Promise<GeoFixCycle[]> {
  return db.select()
    .from(geoFixCycles)
    .where(eq(geoFixCycles.userId, userId))
    .orderBy(desc(geoFixCycles.createdAt))
}

export async function getFixCycle(userId: string, cycleId: string): Promise<GeoFixCycle | null> {
  const [cycle] = await db.select()
    .from(geoFixCycles)
    .where(and(eq(geoFixCycles.userId, userId), eq(geoFixCycles.id, cycleId)))
    .limit(1)
  return cycle ?? null
}

export async function getSharedFixCycle(shareToken: string): Promise<GeoFixCycle | null> {
  const [cycle] = await db.select()
    .from(geoFixCycles)
    .where(eq(geoFixCycles.shareToken, shareToken))
    .limit(1)
  return cycle ?? null
}
