import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { geoRuns, type Json } from '@/lib/db/schema'
import { getGeoEngineAdapter } from '@/lib/geo/adapters'
import { analyzeGeoVisibility } from '@/lib/geo/analysis'
import { parseGeoEngines, splitEnvList } from '@/lib/geo/utils'
import { getGeoBusinessProfileForUser } from '@/lib/geo/profile'
import { serverEnv } from '@/lib/config/env'

interface GeoRunRequest {
  prompt?: string
  brand?: string
  topic?: string
  competitors?: string[]
  engines?: string[]
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  const userId = session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as GeoRunRequest
  const prompt = body.prompt?.trim()
  const profile = await getGeoBusinessProfileForUser(userId)
  const brand = body.brand?.trim() || profile?.brand

  if (!prompt) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 })
  }

  if (!brand) {
    return NextResponse.json({ error: 'brand is required or the user must complete business profile setup' }, { status: 400 })
  }

  const explicitCompetitors = body.competitors?.map(item => item.trim()).filter(Boolean) ?? []
  const profileCompetitors = profile?.competitors?.map(item => item.trim()).filter(Boolean) ?? []
  const envCompetitors = splitEnvList(serverEnv.GEO_COMPETITORS)
  const competitors = explicitCompetitors.length > 0
    ? explicitCompetitors
    : (profileCompetitors.length > 0 ? profileCompetitors : envCompetitors)
  const engines = parseGeoEngines(body.engines || serverEnv.GEO_ENABLED_ENGINES)
  const results = []

  for (const engine of engines) {
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

    results.push({ id: row.id, engine, status: row.status, engineResult, analysis })
  }

  return NextResponse.json({ success: true, results })
}
