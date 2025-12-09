/**
 * AEO Audit Result API Route
 *
 * GET /api/audit/[id]
 *
 * Retrieves a specific audit result by ID
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { serverEnv, clientEnv } from '@/lib/config/env'

const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Audit ID is required' },
        { status: 400 }
      )
    }

    const { data: audit, error } = await supabase
      .from('aeo_audits')
      .select(`
        id,
        brand_name,
        url,
        aeo_score,
        verdict,
        grade,
        entity_profile,
        llm_mentions_count,
        chatgpt_summary,
        knowledge_graph_exists,
        hallucinations,
        action_plan,
        processing_status,
        error_message,
        scrape_blocked,
        processing_time_ms,
        created_at
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('[AEO Audit] Failed to fetch audit:', error)
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      )
    }

    // Reconstruct the report format for frontend
    const report = audit.aeo_score !== null ? {
      scoreCard: {
        aeoScore: audit.aeo_score,
        verdict: audit.verdict,
        grade: audit.grade,
      },
      hallucinations: audit.hallucinations,
      knowledgeGraphStatus: {
        exists: audit.knowledge_graph_exists,
        message: audit.knowledge_graph_exists
          ? 'Google recognizes your brand as an entity'
          : 'Your brand is not yet recognized as a Google entity',
      },
      actionPlan: audit.action_plan,
      summary: audit.chatgpt_summary,
    } : null

    return NextResponse.json({
      success: true,
      audit: {
        id: audit.id,
        brandName: audit.brand_name,
        url: audit.url,
        status: audit.processing_status,
        errorMessage: audit.error_message,
        scrapeBlocked: audit.scrape_blocked,
        processingTimeMs: audit.processing_time_ms,
        createdAt: audit.created_at,
      },
      report,
    })
  } catch (error) {
    console.error('[AEO Audit] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

