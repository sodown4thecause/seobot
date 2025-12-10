/**
 * AEO Trust Auditor - Judge Agent (Phase 3)
 *
 * Compares Ground Truth (website) vs AI Perception (DataForSEO)
 * Generates the final AEO Trust Score and recommendations
 * Uses Vercel AI Gateway for model routing and observability
 */

import { generateObject } from 'ai'
import { vercelGateway } from '@/lib/ai/gateway-provider'
import type { GatewayModelId } from '@ai-sdk/gateway'
import {
  AEOAuditReportSchema,
  type AEOAuditReport,
  type EntityProfile,
  type AIPerception,
} from './schemas'

// Model ID for judge analysis (Gemini 2.5 Flash via Gateway)
const JUDGE_MODEL_ID = 'google/gemini-2.5-flash' as GatewayModelId

export interface JudgeResult {
  success: boolean
  report?: AEOAuditReport
  error?: string
}

/**
 * Build the judge prompt with all context including competitor data
 */
function buildJudgePrompt(
  entityProfile: EntityProfile,
  perception: AIPerception,
  brandName: string
): string {
  // Format competitor data if available
  const competitorSection = perception.competitors && perception.competitors.length > 0
    ? `
## COMPETITOR ANALYSIS (from DataForSEO + Firecrawl)
${perception.competitors.map((c, i) => `
${i + 1}. **${c.domain}**
   - Organic Traffic: ${c.organicTraffic?.toLocaleString() ?? 'N/A'}
   - Organic Keywords: ${c.organicKeywords?.toLocaleString() ?? 'N/A'}
   - Has Schema: ${c.hasSchema ?? 'Unknown'}${c.schemaTypes?.length ? ` (${c.schemaTypes.join(', ')})` : ''}
`).join('')}

Use this to compare: How does ${brandName} stack up against competitors in AI visibility?`
    : ''

  // Format Perplexity insight if available
  const perplexitySection = perception.perplexityInsight
    ? `
### What Perplexity Says:
"${perception.perplexityInsight.summary}"
${perception.perplexityInsight.sources.length > 0 ? `Sources cited: ${perception.perplexityInsight.sources.slice(0, 3).join(', ')}` : ''}`
    : ''

  // Format domain metrics if available
  const metricsSection = perception.domainMetrics
    ? `
### Domain SEO Metrics
- Organic Traffic: ${perception.domainMetrics.organicTraffic?.toLocaleString() ?? 'N/A'}
- Organic Keywords: ${perception.domainMetrics.organicKeywords?.toLocaleString() ?? 'N/A'}
- Total Backlinks: ${perception.domainMetrics.backlinks?.toLocaleString() ?? 'N/A'}
- Referring Domains: ${perception.domainMetrics.referringDomains?.toLocaleString() ?? 'N/A'}
- Domain Rank: ${perception.domainMetrics.domainRank ?? 'N/A'}`
    : ''

  return `You are the AEO (Answer Engine Optimization) Trust Auditor.

Your task is to compare what a brand says about itself (Ground Truth) versus what AI systems say about them (AI Perception), then generate a comprehensive trust score and action plan.

## BRAND: ${brandName}

## GROUND TRUTH (From Website)
- Core Offering: ${entityProfile.coreOffering}
- Target Audience: ${entityProfile.targetAudience}
- Unique Value Proposition: ${entityProfile.uniqueValueProposition}
- Pricing Model: ${entityProfile.pricingModel}
- Industry: ${entityProfile.industryCategory}
- Key Facts They Claim:
${entityProfile.keyFacts.map((f) => `  - ${f}`).join('\n')}

### Technical Signals
- Has Schema Markup: ${entityProfile.technicalSignals.hasSchema}
- Schema Types: ${entityProfile.technicalSignals.schemaTypes.join(', ') || 'None'}
- Has FAQs: ${entityProfile.technicalSignals.hasFAQs}
- Has Definitions: ${entityProfile.technicalSignals.hasDefinitions}
- Has Direct Answers: ${entityProfile.technicalSignals.hasDirectAnswers}

### Content Signals
- Has Author Bio: ${entityProfile.contentSignals.hasAuthorBio}
- Has Citations: ${entityProfile.contentSignals.hasCitations}
- Readability: ${entityProfile.contentSignals.readabilityLevel}
${metricsSection}

## AI PERCEPTION (Multi-Source Analysis)
- LLM Mentions Count: ${perception.llmMentionsCount.toLocaleString()} (total mentions in AI responses)
- Knowledge Graph Exists: ${perception.knowledgeGraphExists}
- AI Search Volume: ${perception.aiSearchVolume?.toLocaleString() ?? 'Unknown'}

### Sample LLM Mentions (where AI mentions this brand):
${perception.llmMentions?.slice(0, 5).map((m, i) => `${i + 1}. Source: ${m.source}\n   Context: "${m.context?.slice(0, 200)}..."`).join('\n') || 'No mentions found'}

### What ChatGPT Says:
"${perception.chatGPTSummary || "AI doesn't have information about this brand."}"
${perplexitySection}
${competitorSection}

## SCORING RUBRIC
Calculate scores for each category (0-25 points each):

1. **Entity Recognition (0-25)**
   - Knowledge Graph exists: +15 points
   - 1000+ LLM mentions: +10 points
   - 100-999 LLM mentions: +7 points
   - 10-99 LLM mentions: +5 points
   - 1-9 LLM mentions: +2 points
   - 0 mentions: 0 points

2. **Accuracy Score (0-25)**
   - Both ChatGPT AND Perplexity describe accurately: +25 points
   - One AI accurate, other partial: +18 points
   - Partial match with minor errors: +12 points
   - Major discrepancies or missing key info: +5 points
   - AI says "I don't know" or no info: 0 points

3. **Citation Strength (0-25)**
   - AI cites the brand's website as source: +15 points
   - AI mentions specific products/services correctly: +10 points
   - Perplexity includes brand in sources: +5 points (bonus)
   - No citations or sources: 0 points

4. **Technical Readiness (0-25)**
   - Has schema markup: +10 points
   - Has FAQs/definitions: +5 points
   - Has author/date info: +5 points
   - Has citations: +5 points
   - BONUS: Better schema than competitors: +3 points

## HALLUCINATION DETECTION
- **Positive Hallucinations**: AI overstates capabilities, claims bigger market share, etc.
- **Negative Hallucinations**: Wrong pricing, incorrect features, outdated info, competitor confusion
- Compare ChatGPT vs Perplexity for consistency - inconsistencies indicate hallucination risk

## COMPETITIVE CONTEXT
${perception.competitors && perception.competitors.length > 0
  ? `Compare ${brandName} against the competitors above. In the summary, mention:
- Whether competitors have better AI visibility
- Specific areas where competitors are ahead (schema, traffic, etc.)
- Urgency to catch up if falling behind`
  : 'No competitor data available - focus on absolute performance'}

## ACTION PLAN PRIORITIES
Generate 4-6 actionable recommendations with:
- Critical: Immediate action needed (wrong info being spread)
- High: Important for visibility improvement
- Medium: Optimization opportunities

Be specific with technical recommendations. For each recommendation, map it to one of these product feature categories:
- **Technical**: Schema Generator tool can auto-generate Organization, FAQ, Product, and Article schema
- **Content**: AI Content Writer creates EEAT-optimized content with proper citations and AI-ready formatting
- **Authority**: AI Visibility Monitor tracks brand mentions across ChatGPT, Perplexity, Claude, Google AI
- **Accuracy**: SEO Chat Assistant helps correct AI misconceptions and improve brand narratives

IMPORTANT: Frame recommendations to show Flow Intent's value. These tools are ALL available through our SEO/AEO chatbot platform. Examples:
- Task: "Add FAQ schema to key pages"
- Fix: "Use Flow Intent's Schema Generator to create FAQ schema from your support content in one prompt"
- Impact: "Increases chance of appearing in AI-generated answers by 40%"

- Task: "Create EEAT-optimized content"
- Fix: "Flow Intent's AI Content Writer generates content with Experience, Expertise, Authoritativeness & Trustworthiness signals"
- Impact: "Content with EEAT signals is 3x more likely to be cited by AI models"

- Task: "Monitor AI visibility continuously"
- Fix: "Flow Intent's AI Visibility Monitor tracks mentions across all major AI platforms automatically"
- Impact: "Get alerts when competitors gain visibility or when AI spreads misinformation about your brand"`
}

/**
 * Run the Judge Agent - Phase 3 of the AEO Audit
 */
export async function runJudgeAgent(params: {
  entityProfile: EntityProfile
  perception: AIPerception
  brandName: string
}): Promise<JudgeResult> {
  console.log('[Judge Agent] Analyzing:', params.brandName)

  // Log input data for debugging
  console.log('[Judge Agent] Input Data:', {
    brandName: params.brandName,
    entityProfile: {
      coreOffering: params.entityProfile.coreOffering?.slice(0, 50),
      hasSchema: params.entityProfile.technicalSignals?.hasSchema,
      schemaTypes: params.entityProfile.technicalSignals?.schemaTypes,
      hasFAQs: params.entityProfile.technicalSignals?.hasFAQs,
      hasAuthorBio: params.entityProfile.contentSignals?.hasAuthorBio,
      hasCitations: params.entityProfile.contentSignals?.hasCitations,
    },
    perception: {
      llmMentionsCount: params.perception.llmMentionsCount,
      llmMentionsSample: params.perception.llmMentions?.slice(0, 2).map((m) => m.source),
      knowledgeGraphExists: params.perception.knowledgeGraphExists,
      aiSearchVolume: params.perception.aiSearchVolume,
      chatGPTSummaryPreview: params.perception.chatGPTSummary?.slice(0, 100),
    },
  })

  try {
    const prompt = buildJudgePrompt(
      params.entityProfile,
      params.perception,
      params.brandName
    )

    const { object: report } = await generateObject({
      model: vercelGateway.languageModel(JUDGE_MODEL_ID),
      prompt,
      schema: AEOAuditReportSchema,
      temperature: 0.4,
      experimental_telemetry: {
        isEnabled: true,
        functionId: 'aeo-judge-agent',
        metadata: {
          brandName: params.brandName,
          llmMentionsCount: params.perception.llmMentionsCount,
          knowledgeGraphExists: params.perception.knowledgeGraphExists,
        },
      },
    })

    // Log detailed scoring breakdown
    console.log('[Judge Agent] Scoring Breakdown:', {
      brand: params.brandName,
      totalScore: report.scoreCard.aeoScore,
      verdict: report.scoreCard.verdict,
      grade: report.scoreCard.grade,
      breakdown: report.scoreCard.breakdown,
      hallucinationsDetected: report.hallucinations.isHallucinating,
      riskLevel: report.hallucinations.riskLevel,
      actionItemsCount: report.actionPlan.length,
    })

    return { success: true, report }
  } catch (error) {
    console.error('[Judge Agent] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Judge analysis failed',
    }
  }
}

