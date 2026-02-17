import { NextRequest, NextResponse } from 'next/server'

import { getUserId } from '@/lib/auth/clerk'
import {
  buildDiagnosticCacheKey,
  createDiagnosticResultId,
  getCachedResultIdForInput,
  saveDiagnosticResult,
} from '@/lib/diagnostic-store'
import {
  DIAGNOSTIC_ENGINES,
  DIAGNOSTIC_INTENTS,
  type DiagnosticIntent,
  type DiagnosticModel,
  type DiagnosticResultStored,
  type DiagnosticRunDebug,
  type DiagnosticRunPublic,
  type ParseMethod,
} from '@/lib/diagnostic-types'
import { selectStrongestKeywords } from '@/lib/keyword-selector'
import { scrapeBrandContext } from '@/lib/firecrawl'
import { parseLlmResponseWithFallback } from '@/lib/llm/parse'
import { buildIntentPrompt, DEFAULT_USE_CASE, DIAGNOSTIC_SYSTEM_PROMPT } from '@/lib/llm/prompts'
import { runGeminiAdapter } from '@/lib/llm/adapters/gemini'
import { runGrokAdapter } from '@/lib/llm/adapters/grok'
import { runPerplexityAdapter } from '@/lib/llm/adapters/perplexity'
import { computeStep1Score, analyzeDiagnosticRun } from '@/lib/scoring'
import { buildXShareIntentUrl, generateShareCardSvg, svgToDataUrl } from '@/lib/sharecard'
import { diagnosticRunInputSchema } from '@/lib/validate'
import { rateLimitMiddleware } from '@/lib/redis/rate-limit'

// Node.js required: process.env access, LLM adapters (Gemini, Grok, Perplexity), 
// Firecrawl scraping, and async Promise.allSettled for parallel model runs.
export const runtime = 'nodejs'

const EXPECTED_RUNS = 9

function parseNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const numeric = Number.parseInt(raw, 10)
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return fallback
  }
  return numeric
}

const CACHE_TTL_MS = parseNumberEnv('DIAGNOSTIC_CACHE_TTL_MINUTES', 30) * 60 * 1000
const HTTP_TIMEOUT_MS = parseNumberEnv('DIAGNOSTIC_HTTP_TIMEOUT_MS', 15000)
const RETRY_ATTEMPTS = parseNumberEnv('DIAGNOSTIC_RETRY_ATTEMPTS', 2)
const MIN_KEYWORD_VOLUME = parseNumberEnv('DIAGNOSTIC_KEYWORD_MIN_VOLUME', 100)

interface RunTask {
  intent: DiagnosticIntent
  model: DiagnosticModel
  systemPrompt: string
  userPrompt: string
}

interface RunTaskResult {
  intent: DiagnosticIntent
  model: DiagnosticModel
  parseMethod: ParseMethod
  rawResponse: string
  error?: string
  parseError?: string
  runPublic: DiagnosticRunPublic
  debugRun: DiagnosticRunDebug
}

async function executeModelRun(task: RunTask): Promise<{ rawResponse: string }> {
  if (task.model === DIAGNOSTIC_ENGINES[0]) {
    const response = await runGeminiAdapter({
      systemPrompt: task.systemPrompt,
      userPrompt: task.userPrompt,
      timeoutMs: HTTP_TIMEOUT_MS,
      retries: RETRY_ATTEMPTS,
    })
    return { rawResponse: response.rawText }
  }

  if (task.model === DIAGNOSTIC_ENGINES[1]) {
    const response = await runPerplexityAdapter({
      systemPrompt: task.systemPrompt,
      userPrompt: task.userPrompt,
      timeoutMs: HTTP_TIMEOUT_MS,
      retries: RETRY_ATTEMPTS,
    })
    return { rawResponse: response.rawText }
  }

  const response = await runGrokAdapter({
    systemPrompt: task.systemPrompt,
    userPrompt: task.userPrompt,
    timeoutMs: HTTP_TIMEOUT_MS,
    retries: RETRY_ATTEMPTS,
  })
  return { rawResponse: response.rawText }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const rateLimitResponse = await rateLimitMiddleware(request, 'AEO_AUDIT', userId)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const startedAt = Date.now()

  try {
    const body = await request.json()
    const parsedInput = diagnosticRunInputSchema.safeParse(body)
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: 'Invalid input. Please provide a valid domain and up to 5 keywords.',
          details: parsedInput.error.issues,
        },
        { status: 400 },
      )
    }

    const { domain, keywords: inputKeywords, brandIdentity } = parsedInput.data
    const inputKey = buildDiagnosticCacheKey(domain, inputKeywords)
    const cachedId = await getCachedResultIdForInput(inputKey)
    if (cachedId) {
      return NextResponse.json({ id: cachedId, cached: true })
    }

    console.log('[Diagnostic] Starting instant snapshot', {
      domain,
      keywords: inputKeywords.length,
    })

    const firecrawl = await scrapeBrandContext({
      domain,
      timeoutMs: HTTP_TIMEOUT_MS,
      retries: RETRY_ATTEMPTS,
    })

    if (brandIdentity && firecrawl.brandSummary.length < 50) {
      firecrawl.brandSummary = brandIdentity
      firecrawl.incomplete = false
      firecrawl.errors = []
    } else if (brandIdentity) {
      firecrawl.brandSummary = `${brandIdentity}\n\n${firecrawl.brandSummary}`
    }

    const keywordSelection = await selectStrongestKeywords({
      domain,
      brandName: firecrawl.brandName,
      inputKeywords,
      topics: firecrawl.topics,
      minVolume: MIN_KEYWORD_VOLUME,
      timeoutMs: HTTP_TIMEOUT_MS,
      retries: RETRY_ATTEMPTS,
    })

    const selectedKeywords = keywordSelection.selectedKeywords.slice(0, 5)
    const primaryKeyword = selectedKeywords[0] || inputKeywords[0] || 'AI visibility tools'
    const secondaryKeyword = selectedKeywords[1] || primaryKeyword

    const intents = DIAGNOSTIC_INTENTS
    const models = DIAGNOSTIC_ENGINES

    const tasks: RunTask[] = []
    for (const intent of intents) {
      const userPrompt = buildIntentPrompt({
        intent,
        domain,
        brandSummary: firecrawl.brandSummary,
        primaryKeyword,
        secondaryKeyword,
        useCase: DEFAULT_USE_CASE,
      })

      for (const model of models) {
        tasks.push({
          intent,
          model,
          systemPrompt: DIAGNOSTIC_SYSTEM_PROMPT,
          userPrompt,
        })
      }
    }

    const settled = await Promise.allSettled(tasks.map((task) => executeModelRun(task)))

    const runResults: RunTaskResult[] = []
    const runAnalyses = []

    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i]
      const settledResult = settled[i]

      let rawResponse = ''
      let error: string | undefined
      if (settledResult.status === 'fulfilled') {
        rawResponse = settledResult.value.rawResponse
      } else {
        error = settledResult.reason instanceof Error ? settledResult.reason.message : 'Model call failed'
      }

      const parsedResponse =
        settledResult.status === 'fulfilled' && rawResponse
          ? parseLlmResponseWithFallback({
              rawResponse,
              targetDomain: domain,
              targetBrandName: firecrawl.brandName,
            })
          : {
              structured: { recommended_brands: [], direct_links_included: [] },
              parseMethod: 'failed' as const,
              parseError: error || 'Empty response from LLM',
            }

      const analysis = analyzeDiagnosticRun({
        run: {
          intent: task.intent,
          model: task.model,
          parsed: parsedResponse.structured,
          parseMethod: settledResult.status === 'fulfilled' ? parsedResponse.parseMethod : 'failed',
          rawResponse,
          error,
        },
        targetDomain: domain,
        targetBrandName: firecrawl.brandName,
      })
      runAnalyses.push(analysis)

      const parseMethod: ParseMethod = settledResult.status === 'fulfilled' ? parsedResponse.parseMethod : 'failed'

      runResults.push({
        intent: task.intent,
        model: task.model,
        parseMethod,
        rawResponse,
        error,
        parseError: parsedResponse.parseError,
        runPublic: {
          intent: task.intent,
          model: task.model,
          mentioned: analysis.mentioned,
          recommended: analysis.recommended,
          cited: analysis.cited,
          targetBestPosition: analysis.targetBestPosition,
          parseMethod,
          ...(error ? { error } : {}),
        },
        debugRun: {
          intent: task.intent,
          model: task.model,
          systemPrompt: task.systemPrompt,
          userPrompt: task.userPrompt,
          rawResponse,
          ...(parsedResponse.parseError ? { parseError: parsedResponse.parseError } : {}),
        },
      })
    }

    const scoring = computeStep1Score({
      runs: runAnalyses,
      expectedRuns: EXPECTED_RUNS,
      targetDomain: domain,
      targetBrandName: firecrawl.brandName,
      serpCompetitorDomains: keywordSelection.serpCompetitorDomains,
    })

    const incompleteReasons: string[] = []
    if (firecrawl.incomplete) {
      incompleteReasons.push(...firecrawl.errors.map((error) => `Firecrawl: ${error}`))
    }
    if (keywordSelection.incomplete) {
      incompleteReasons.push(...keywordSelection.errors.map((error) => `DataForSEO: ${error}`))
    }

    const failedRuns = runResults.filter((run) => !!run.error)
    if (failedRuns.length > 0) {
      incompleteReasons.push(`LLM runs failed: ${failedRuns.length}/${EXPECTED_RUNS}`)
    }

    const id = createDiagnosticResultId()
    const shareCardSvg = generateShareCardSvg({
      domain,
      score: scoring.aiInfluenceScore,
      category: scoring.aiPerceptionCategory,
      competitor: scoring.primaryAICompetitor,
    })

    const resultPath = `/diagnostic/result/${id}`
    const result: DiagnosticResultStored = {
      id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + CACHE_TTL_MS).toISOString(),
      domain,
      inputKeywords,
      selectedKeywords,
      brandSummary: firecrawl.brandSummary,
      topics: firecrawl.topics,
      productDescriptors: firecrawl.productDescriptors,
      aiInfluenceScore: scoring.aiInfluenceScore,
      recommendationRate: scoring.recommendationRate,
      engineCoverage: scoring.engineCoverage,
      citationRate: scoring.citationRate,
      aiPerceptionCategory: scoring.aiPerceptionCategory,
      aiPerceptionInsight: scoring.aiPerceptionInsight,
      primaryAICompetitor: scoring.primaryAICompetitor,
      engineBreakdown: scoring.engineBreakdown,
      runs: runResults.map((run) => run.runPublic),
      incomplete: incompleteReasons.length > 0,
      incompleteReasons,
      shareCardSvgDataUrl: svgToDataUrl(shareCardSvg),
      xShareIntentUrl: buildXShareIntentUrl({
        domain,
        score: scoring.aiInfluenceScore,
        category: scoring.aiPerceptionCategory,
        resultPath,
      }),
      debugRuns: runResults.map((run) => run.debugRun),
    }

    await saveDiagnosticResult({
      inputKey,
      result,
      ttlMs: CACHE_TTL_MS,
    })

    console.log('[Diagnostic] Snapshot completed', {
      id,
      domain,
      score: result.aiInfluenceScore,
      incomplete: result.incomplete,
      ms: Date.now() - startedAt,
    })

    return NextResponse.json({
      id,
      cached: false,
      incomplete: result.incomplete,
    })
  } catch (error) {
    console.error('[Diagnostic] Snapshot failed', error)
    return NextResponse.json(
      {
        error: 'Unable to run instant snapshot right now. Please try again in a moment.',
      },
      { status: 500 },
    )
  }
}
