/**
 * AEO Trust Audit API Endpoint
 * 
 * 3-Phase Pipeline:
 * 1. Extraction Agent - Scrapes website to get "ground truth" about the brand
 * 2. Perception Service - Queries AI platforms (ChatGPT, Perplexity) via DataForSEO
 * 3. Judge Agent - Compares truth vs perception, generates score and report
 * 
 * POST /api/audit/run
 * Body: { url: string, brandName: string }
 * Returns: { success: boolean, report: AEOAuditReport, toolsUsed: string[], apiCost: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'
import {
    runExtractionAgent,
    runPerceptionService,
    runJudgeAgent,
    AuditRequestSchema,
} from '@/lib/audit'

// List of tools/APIs used in the audit for transparency
const TOOLS_USED = [
    'Firecrawl (Website Scraping)',
    'Google Gemini 2.5 Flash (AI Analysis)',
    'DataForSEO LLM Mentions',
    'DataForSEO ChatGPT Scraper',
    'DataForSEO Knowledge Graph',
    'Perplexity Sonar',
    'DataForSEO Domain Metrics',
]

export async function POST(request: NextRequest) {
    const startTime = Date.now()

    try {
        // Parse and validate request body FIRST (before rate limiting)
        // This ensures invalid requests don't consume the rate limit
        const body = await request.json()
        const parseResult = AuditRequestSchema.safeParse(body)

        if (!parseResult.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid request. Please provide a valid URL and brand name.',
                    details: parseResult.error.issues
                },
                { status: 400 }
            )
        }

        const { url, brandName } = parseResult.data

        // Rate limit: 1 audit per day per IP (free tier)
        // Only checked AFTER validation passes to avoid wasting rate limit on bad requests
        const rateLimitResponse = await rateLimitMiddleware(request, 'AEO_AUDIT')
        if (rateLimitResponse) {
            return rateLimitResponse
        }

        console.log('[Audit API] Starting audit for:', { brandName, url })

        // PHASE 1: Extract ground truth from website
        console.log('[Audit API] Phase 1: Extraction starting...')
        const extractionResult = await runExtractionAgent({ url, brandName })

        if (!extractionResult.success || !extractionResult.entityProfile) {
            console.error('[Audit API] Extraction failed:', extractionResult.error)
            return NextResponse.json(
                {
                    success: false,
                    error: extractionResult.error || 'Failed to analyze website. It may be blocking bots or unavailable.',
                    scrapeBlocked: extractionResult.scrapeBlocked,
                },
                { status: 422 }
            )
        }
        console.log('[Audit API] Phase 1: Extraction complete')

        // PHASE 2: Gather AI perception data
        console.log('[Audit API] Phase 2: Perception gathering starting...')
        const perceptionResult = await runPerceptionService({ brandName, url })

        if (!perceptionResult.success || !perceptionResult.perception) {
            console.error('[Audit API] Perception failed:', perceptionResult.errors)
            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to gather AI perception data. Please try again.',
                    errors: perceptionResult.errors,
                },
                { status: 500 }
            )
        }
        console.log('[Audit API] Phase 2: Perception gathering complete')

        // PHASE 3: Judge and generate report
        console.log('[Audit API] Phase 3: Judge analysis starting...')
        const judgeResult = await runJudgeAgent({
            entityProfile: extractionResult.entityProfile,
            perception: perceptionResult.perception,
            brandName,
        })

        if (!judgeResult.success || !judgeResult.report) {
            console.error('[Audit API] Judge failed:', judgeResult.error)
            return NextResponse.json(
                {
                    success: false,
                    error: judgeResult.error || 'Failed to generate audit report. Please try again.',
                },
                { status: 500 }
            )
        }
        console.log('[Audit API] Phase 3: Judge analysis complete')

        const processingTimeMs = Date.now() - startTime
        const apiCost = perceptionResult.perception.apiCosts?.total ?? 0.40

        console.log('[Audit API] Audit complete:', {
            brandName,
            score: judgeResult.report.scoreCard.aeoScore,
            grade: judgeResult.report.scoreCard.grade,
            processingTimeMs,
            apiCost: `$${apiCost.toFixed(2)}`,
        })

        return NextResponse.json({
            success: true,
            report: judgeResult.report,
            toolsUsed: TOOLS_USED,
            apiCost,
            processingTimeMs,
            cached: false,
        })

    } catch (error) {
        const processingTimeMs = Date.now() - startTime
        console.error('[Audit API] Unexpected error:', error)

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'An unexpected error occurred',
                processingTimeMs,
            },
            { status: 500 }
        )
    }
}
