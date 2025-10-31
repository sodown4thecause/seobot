import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get competitors from DataForSEO
    const competitorsResult = await competitorAnalysis({ domain })

    if (!competitorsResult.success) {
      return NextResponse.json(
        { error: competitorsResult.error.message },
        { status: competitorsResult.error.statusCode }
      )
    }

    const competitors = competitorsResult.data.tasks[0]?.result || []
    const topCompetitors = competitors.slice(0, limit)

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
      user_id: user.id,
      domain: comp.domain,
      domain_authority: comp.domain_authority,
      monthly_traffic: comp.monthly_traffic,
      priority: 'primary' as const,
      metadata: comp.metadata,
    }))

    if (competitorsToInsert.length > 0) {
      await supabase.from('competitors').upsert(competitorsToInsert)
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
