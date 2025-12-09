/**
 * AEO Trust Auditor API Route
 *
 * POST /api/audit/run
 *
 * Executes the 3-phase AEO audit workflow:
 * 1. Extraction Agent: Scrape website, extract ground truth
 * 2. Perception Service: Gather AI perception from DataForSEO
 * 3. Judge Agent: Compare and score, generate recommendations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
import { cacheGet, cacheSet } from '@/lib/redis/client'
import { serverEnv, clientEnv } from '@/lib/config/env'
import {
  AuditRequestSchema,
  runExtractionAgent,
  runPerceptionService,
  runJudgeAgent,
  type AEOAuditReport,
} from '@/lib/audit'

// Use service role for database operations
const supabase = createClient(
  clientEnv.NEXT_PUBLIC_SUPABASE_URL,
  serverEnv.SUPABASE_SERVICE_ROLE_KEY
)

// Cache TTL: 24 hours for audit results
const CACHE_TTL = 60 * 60 * 24

/**
 * Anonymize IP address for privacy compliance.
 * IPv4: Zero the last octet (e.g., 192.168.1.100 -> 192.168.1.0)
 * IPv6: Zero the last 80 bits (e.g., 2001:db8::1 -> 2001:db8::)
 */
function anonymizeIp(ip: string | null): string | null {
  if (!ip) return null

  // Handle comma-separated list (x-forwarded-for may have multiple IPs)
  const firstIp = ip.split(',')[0].trim()

  // IPv6 detection
  if (firstIp.includes(':')) {
    // Zero the last 80 bits by keeping only the first 48 bits (3 segments)
    const segments = firstIp.split(':')
    const anonymized = segments.slice(0, 3).join(':') + '::'
    return anonymized
  }

  // IPv4: zero the last octet
  const octets = firstIp.split('.')
  if (octets.length === 4) {
    octets[3] = '0'
    return octets.join('.')
  }

  // If we can't parse it, return null rather than storing raw
  return null
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    // 1. Rate limiting (5 audits per hour per IP)
    const rateLimitResponse = await rateLimitMiddleware(req, 'AEO_AUDIT')
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // 2. Parse and validate request body
    const body = await req.json()
    const parseResult = AuditRequestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      )
    }

    const { url, brandName, email, utmSource, utmMedium, utmCampaign, consent } = parseResult.data

    // 3. Check cache first (avoid redundant API calls)
    const cacheKey = `aeo-audit:${brandName.toLowerCase()}:${new URL(url).hostname}`
    const cached = await cacheGet<{ report: AEOAuditReport; auditId: string }>(cacheKey)

    if (cached) {
      console.log('[AEO Audit] Cache hit for:', brandName)
      return NextResponse.json({
        success: true,
        cached: true,
        auditId: cached.auditId,
        report: cached.report,
        processingTimeMs: Date.now() - startTime,
      })
    }

    // 4. Create lead record if email provided
    let leadId: string | null = null
    if (email) {
      // Anonymize IP for privacy - only store if consent given, otherwise omit
      const rawIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
      const anonymizedIp = consent ? anonymizeIp(rawIp) : null

      const { data: lead, error: leadError } = await supabase
        .from('aeo_leads')
        .insert({
          email,
          brand_name: brandName,
          url,
          ip_address: anonymizedIp,
          user_agent: req.headers.get('user-agent'),
          referrer: req.headers.get('referer'),
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
          data_consent: consent ?? false, // Track consent for retention policies
        })
        .select('id')
        .single()

      if (leadError) {
        // Log error with context but exclude PII
        console.error('[AEO Audit] Failed to create lead record:', {
          error: leadError.message,
          code: leadError.code,
          brandName,
          hasEmail: !!email,
          hasConsent: !!consent,
        })
      } else if (lead) {
        leadId = lead.id
      }
    }

    // 5. Create audit record with pending status
    const { data: audit, error: auditError } = await supabase
      .from('aeo_audits')
      .insert({
        lead_id: leadId,
        brand_name: brandName,
        url,
        processing_status: 'processing',
      })
      .select('id')
      .single()

    if (auditError) {
      console.error('[AEO Audit] Failed to create audit record:', auditError)
      return NextResponse.json(
        { error: 'Failed to create audit record' },
        { status: 500 }
      )
    }

    const auditId = audit.id

    // 6. Run Phase 1: Extraction Agent (Ground Truth)
    console.log('[AEO Audit] Phase 1: Extraction for', brandName)
    const extractionResult = await runExtractionAgent({ url, brandName })

    if (!extractionResult.success || !extractionResult.entityProfile) {
      // Update audit with failure
      await supabase
        .from('aeo_audits')
        .update({
          processing_status: 'failed',
          error_message: extractionResult.error || 'Extraction failed',
          scrape_blocked: extractionResult.scrapeBlocked,
          processing_time_ms: Date.now() - startTime,
        })
        .eq('id', auditId)

      return NextResponse.json({
        success: false,
        auditId,
        error: extractionResult.error,
        scrapeBlocked: extractionResult.scrapeBlocked,
      }, { status: 422 })
    }

    // 7. Run Phase 2: Perception Service (AI Visibility) - in parallel with entity profile save
    console.log('[AEO Audit] Phase 2: Perception gathering for', brandName)
    const [perceptionResult] = await Promise.all([
      runPerceptionService({ brandName, url }),
      supabase.from('aeo_audits').update({
        entity_profile: extractionResult.entityProfile,
      }).eq('id', auditId),
    ])

    if (!perceptionResult.success || !perceptionResult.perception) {
      console.warn('[AEO Audit] Perception service had errors:', perceptionResult.errors)
    }

    // Use defaults if perception failed
    const perception = perceptionResult.perception || {
      llmMentionsCount: 0,
      llmMentions: [],
      chatGPTSummary: "Unable to retrieve AI perception data.",
      knowledgeGraphExists: false,
    }

    // 8. Run Phase 3: Judge Agent (Scoring)
    console.log('[AEO Audit] Phase 3: Judge analysis for', brandName)
    const judgeResult = await runJudgeAgent({
      entityProfile: extractionResult.entityProfile,
      perception,
      brandName,
    })

    const processingTimeMs = Date.now() - startTime

    if (!judgeResult.success || !judgeResult.report) {
      await supabase
        .from('aeo_audits')
        .update({
          processing_status: 'failed',
          error_message: judgeResult.error || 'Judge analysis failed',
          processing_time_ms: processingTimeMs,
        })
        .eq('id', auditId)

      return NextResponse.json({
        success: false,
        auditId,
        error: judgeResult.error,
      }, { status: 500 })
    }

    // 9. Save complete audit results
    await supabase
      .from('aeo_audits')
      .update({
        aeo_score: judgeResult.report.scoreCard.aeoScore,
        verdict: judgeResult.report.scoreCard.verdict,
        grade: judgeResult.report.scoreCard.grade,
        llm_mentions_count: perception.llmMentionsCount,
        llm_mentions_data: perception.llmMentions,
        chatgpt_summary: perception.chatGPTSummary,
        chatgpt_raw_data: perception.chatGPTRawResponse,
        ai_search_volume: perception.aiSearchVolume,
        knowledge_graph_exists: perception.knowledgeGraphExists,
        knowledge_graph_data: perception.knowledgeGraphData,
        hallucinations: judgeResult.report.hallucinations,
        action_plan: judgeResult.report.actionPlan,
        processing_status: 'completed',
        processing_time_ms: processingTimeMs,
      })
      .eq('id', auditId)

    // 10. Build enhanced report with perception data
    const enhancedReport = {
      ...judgeResult.report,
      perception: {
        perplexitySummary: perception.perplexityInsight?.summary,
        perplexitySources: perception.perplexityInsight?.sources,
        competitors: perception.competitors,
        domainMetrics: perception.domainMetrics,
        apiCosts: perception.apiCosts,
      },
    }

    // 11. Cache the result
    await cacheSet(cacheKey, { report: enhancedReport, auditId }, CACHE_TTL)

    // List of tools used in this audit
    const toolsUsed = [
      'DataForSEO LLM Mentions API',
      'DataForSEO ChatGPT Scraper',
      'DataForSEO Knowledge Graph',
      'DataForSEO Domain Metrics',
      'DataForSEO Competitor Analysis',
      'DataForSEO Backlink Analysis',
      'Perplexity Sonar AI',
      'Firecrawl Web Scraper',
      'Google Gemini 2.0 Flash',
    ]

    console.log('[AEO Audit] Complete:', brandName, 'Score:', judgeResult.report.scoreCard.aeoScore, 'Cost:', `$${perception.apiCosts?.total?.toFixed(2) || '0.00'}`)

    return NextResponse.json({
      success: true,
      cached: false,
      auditId,
      report: enhancedReport,
      processingTimeMs,
      toolsUsed,
      apiCost: perception.apiCosts?.total || 0,
    })
  } catch (error) {
    console.error('[AEO Audit] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

