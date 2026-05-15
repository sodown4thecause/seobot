import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { geoRuns, type Json } from '@/lib/db/schema'
import { getGeoEngineAdapter } from '@/lib/geo/adapters'
import { analyzeGeoVisibility } from '@/lib/geo/analysis'
import { parseGeoEngines, splitEnvList } from '@/lib/geo/utils'
import { getGeoBusinessProfileForUser } from '@/lib/geo/profile'
import { serverEnv } from '@/lib/config/env'

export const maxDuration = 120

const geoRunRequestSchema = z.object({
  prompt: z.string().trim().min(1, 'prompt is required').max(4000),
  brand: z.string().trim().min(1).max(200).optional(),
  topic: z.string().trim().min(1).max(300).optional(),
  competitors: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  engines: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
})

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsedBody = geoRunRequestSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: 'Invalid GEO run request', details: parsedBody.error.flatten().fieldErrors },
      { status: 400 },
    )
  }

  const body = parsedBody.data
  const prompt = body.prompt
  const profile = await getGeoBusinessProfileForUser(userId)
  const brand = body.brand || profile?.brand

  if (!brand) {
    return NextResponse.json({ error: 'brand is required or the user must complete business profile setup' }, { status: 400 })
  }

  const competitors = body.competitors?.length ? body.competitors : profile?.competitors || splitEnvList(serverEnv.GEO_COMPETITORS)
  const engines = parseGeoEngines(body.engines || serverEnv.GEO_ENABLED_ENGINES)
  const results = await Promise.all(engines.map(async (engine) => {
    try {
      const adapter = getGeoEngineAdapter(engine)
      const engineResult = await adapter.runPrompt({
        prompt,
        brand,
        competitors,
        topic: body.topic,
      })

      const analysis = await analyzeGeoVisibility({
        brand,
        competitors,
        prompt,
        engine,
        responseText: engineResult.responseText,
        citedUrls: engineResult.citedUrls,
      })

      const [row] = await db.insert(geoRuns).values({
        userId,
        engine,
        prompt,
        brand,
        competitors,
        responseText: engineResult.responseText,
        citedUrls: engineResult.citedUrls,
        citedDomains: engineResult.citedDomains,
        mentionedBrands: analysis.mentionedBrands,
        competitorMentions: analysis.competitorMentions as Json,
        sentiment: analysis.sentiment,
        brandPosition: analysis.brandPosition,
        visibilityScore: analysis.visibilityScore,
        status: engineResult.status,
        rawJson: ({ engineResult, analysis, topic: body.topic } as unknown) as Json,
        capturedAt: new Date(engineResult.capturedAt),
      }).returning()

      return { id: row.id, engine, status: row.status, engineResult, analysis }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GEO engine run failed'
      const capturedAt = new Date()
      const [row] = await db.insert(geoRuns).values({
        userId,
        engine,
        prompt,
        brand,
        competitors,
        responseText: '',
        citedUrls: [],
        citedDomains: [],
        mentionedBrands: [],
        competitorMentions: {} as Json,
        sentiment: 'absent',
        brandPosition: null,
        visibilityScore: 0,
        status: 'error',
        rawJson: ({ error: message, topic: body.topic } as unknown) as Json,
        capturedAt,
      }).returning()

      return {
        id: row.id,
        engine,
        status: row.status,
        error: message,
      }
    }
  }))

  return NextResponse.json({ success: true, results })
}
