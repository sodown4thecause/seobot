import { NextResponse } from 'next/server'
import { requireUserId } from '@/lib/auth/clerk'
import { db } from '@/lib/db'
import { competitors } from '@/lib/db/schema'
import { sql } from 'drizzle-orm'
import { competitorAnalysis, domainMetrics } from '@/lib/api/dataforseo-service'

export const runtime = 'edge'

interface RequestBody {
  domain: string
  limit?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as RequestBody
    const { domain, limit = 10 } = body
    
    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    const userId = await requireUserId()

    // Get competitors from DataForSEO
    const competitorsResult = await competitorAnalysis({ domain })

    if (!competitorsResult.success) {
      return NextResponse.json(
        { error: competitorsResult.error.message },
        { status: competitorsResult.error.statusCode }
      )
    }

    const competitorsList = competitorsResult.data.tasks[0]?.result || []
    const topCompetitors = competitorsList.slice(0, limit)

    // Get detailed metrics for each competitor
    const competitorsWithMetrics = await Promise.all(
      topCompetitors.map(async (comp) => {
        const metricsResult = await domainMetrics({ domain: comp.domain })
        
        const metrics = metricsResult.success
          ? metricsResult.data.tasks[0]?.result?.[0]
          : null

        return {
          domain: comp.domain,
          domain_authority: metrics?.domain_rank || comp.domain_rank,
          monthly_traffic: comp.organic_etv,
          shared_keywords: comp.organic_count,
          metadata: {
            organic_etv: comp.organic_etv,
            organic_count: comp.organic_count,
            is_new: comp.organic_is_new,
            is_up: comp.organic_is_up,
            is_down: comp.organic_is_down,
            backlinks: metrics?.backlinks,
            referring_domains: metrics?.referring_domains,
          },
        }
      })
    )

    // Save to database
    const competitorsToInsert = competitorsWithMetrics.map(comp => ({
      userId,
      domain: comp.domain,
      domainAuthority: comp.domain_authority,
      monthlyTraffic: comp.monthly_traffic,
      priority: 'primary' as const,
      metadata: comp.metadata,
    }))

    if (competitorsToInsert.length > 0) {
      // Upsert - update if exists, insert if not
      for (const comp of competitorsToInsert) {
        await db.insert(competitors).values(comp)
          .onConflictDoUpdate({
            target: [competitors.userId, competitors.domain],
            set: {
              domainAuthority: sql`excluded.domain_authority`,
              monthlyTraffic: sql`excluded.monthly_traffic`,
              metadata: sql`excluded.metadata`,
              updatedAt: new Date(),
            },
          })
      }
    }

    return NextResponse.json({
      competitors: competitorsWithMetrics,
      total: competitorsWithMetrics.length,
    })
  } catch (error: unknown) {
    const err = error as Error
    console.error('Competitor discovery error:', err)
    return NextResponse.json(
      { error: err?.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
