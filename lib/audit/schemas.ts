/**
 * AEO Trust Auditor - Zod Schemas
 *
 * Validation schemas for the 3-phase agentic workflow:
 * 1. Extraction Agent (Ground Truth from website)
 * 2. Perception Service (AI visibility from DataForSEO)
 * 3. Judge Agent (Compare and score)
 */

import { z } from 'zod'

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

export const AuditRequestSchema = z.object({
  url: z.string().url('Invalid URL format'),
  brandName: z.string().min(1, 'Brand name is required').max(100),
  email: z.string().email('Invalid email format').optional(),
  // UTM tracking
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  // Privacy consent for data collection (IP address, analytics)
  consent: z.boolean().optional(),
})

export type AuditRequest = z.infer<typeof AuditRequestSchema>

// ============================================================================
// PHASE 1: EXTRACTION AGENT (Ground Truth)
// ============================================================================

export const TechnicalSignalsSchema = z.object({
  hasSchema: z.boolean().describe('Has JSON-LD or Microdata schema markup'),
  schemaTypes: z.array(z.string()).describe('Types found: Organization, Product, FAQPage, etc.'),
  hasTableTags: z.boolean().describe('Uses semantic table markup'),
  hasDirectAnswers: z.boolean().describe('Content formatted for direct answers'),
  hasFAQs: z.boolean().describe('Has FAQ content sections'),
  hasDefinitions: z.boolean().describe('Has "What is X" definition patterns'),
  hasStructuredLists: z.boolean().describe('Uses ordered/unordered lists effectively'),
})

export const ContentSignalsSchema = z.object({
  hasAuthorBio: z.boolean().describe('Author information present'),
  hasPublishDate: z.boolean().describe('Publication date visible'),
  hasCitations: z.boolean().describe('External source citations'),
  hasLastUpdated: z.boolean().describe('Last updated date shown'),
  readabilityLevel: z.enum(['simple', 'moderate', 'complex']).describe('Content complexity'),
  estimatedWordCount: z.number().describe('Approximate word count'),
})

export const EntityProfileSchema = z.object({
  brandName: z.string().describe('Extracted brand/company name'),
  coreOffering: z.string().describe('Primary product or service offered'),
  targetAudience: z.string().describe('Who they serve'),
  uniqueValueProposition: z.string().describe('What differentiates them'),
  pricingModel: z.string().describe('Free, Freemium, Subscription, Enterprise, etc.'),
  keyFacts: z.array(z.string()).describe('Specific factual claims to verify'),
  industryCategory: z.string().describe('Industry or niche'),
  foundedYear: z.string().optional().describe('Year founded if mentioned'),
  headquarters: z.string().optional().describe('Location if mentioned'),
  technicalSignals: TechnicalSignalsSchema,
  contentSignals: ContentSignalsSchema,
})

export type EntityProfile = z.infer<typeof EntityProfileSchema>

// ============================================================================
// PHASE 2: PERCEPTION SERVICE (AI Visibility)
// ============================================================================

export const LLMMentionSchema = z.object({
  source: z.string(),
  context: z.string(),
  sentiment: z.enum(['positive', 'neutral', 'negative']).optional(),
})

export const PerplexityInsightSchema = z.object({
  summary: z.string().describe('What Perplexity says about the brand'),
  sources: z.array(z.string()).describe('Sources cited by Perplexity'),
  hasAccurateInfo: z.boolean().describe('Whether info matches ground truth'),
})

export const CompetitorInsightSchema = z.object({
  domain: z.string(),
  name: z.string().optional(),
  organicTraffic: z.number().optional(),
  organicKeywords: z.number().optional(),
  backlinks: z.number().optional(),
  hasSchema: z.boolean().optional(),
  schemaTypes: z.array(z.string()).optional(),
  rankPosition: z.number().optional(),
})

export const DomainMetricsSchema = z.object({
  organicTraffic: z.number().optional(),
  organicKeywords: z.number().optional(),
  backlinks: z.number().optional(),
  referringDomains: z.number().optional(),
  domainRank: z.number().optional(),
})

export const AIPerceptionSchema = z.object({
  llmMentionsCount: z.number().describe('Total mentions found in LLM results'),
  llmMentionsByPlatform: z
    .object({
      google: z.number().describe('Mentions in Google AI Overviews / AI answers'),
      chatGpt: z.number().describe('Mentions in ChatGPT answers (DataForSEO proxy)'),
      perplexity: z.number().describe('Mentions in Perplexity answers (DataForSEO proxy)'),
    })
    .describe('Mentions broken down by platform'),
  llmMentions: z.array(LLMMentionSchema).describe('Individual mention details'),
  chatGPTSummary: z.string().describe('What ChatGPT says about the brand'),
  chatGPTRawResponse: z.string().optional(),
  perplexityInsight: PerplexityInsightSchema.optional().describe('What Perplexity says'),
  aiSearchVolume: z.number().optional().describe('AI search volume for brand keywords'),
  knowledgeGraphExists: z.boolean().describe('Brand has Google Knowledge Graph'),
  knowledgeGraphData: z.record(z.unknown()).optional(),
  domainMetrics: DomainMetricsSchema.optional().describe('SEO metrics for the domain'),
  competitors: z.array(CompetitorInsightSchema).optional().describe('Top competitors data'),
  apiCosts: z.object({
    dataForSEO: z.number().describe('DataForSEO API cost in dollars'),
    perplexity: z.number().describe('Perplexity API cost in dollars'),
    firecrawl: z.number().describe('Firecrawl API cost in dollars'),
    total: z.number().describe('Total API cost for this audit'),
  }).optional().describe('API costs breakdown'),
})

export type AIPerception = z.infer<typeof AIPerceptionSchema>
export type PerplexityInsight = z.infer<typeof PerplexityInsightSchema>
export type CompetitorInsight = z.infer<typeof CompetitorInsightSchema>
export type DomainMetrics = z.infer<typeof DomainMetricsSchema>

// ============================================================================
// PHASE 3: JUDGE AGENT (Final Report)
// ============================================================================

export const ScoringBreakdownSchema = z.object({
  entityRecognition: z.number().min(0).max(25).describe('Knowledge Graph + LLM mentions score'),
  accuracyScore: z.number().min(0).max(25).describe('Reality vs Perception alignment'),
  citationStrength: z.number().min(0).max(25).describe('Sources in LLM responses'),
  technicalReadiness: z.number().min(0).max(25).describe('Schema, structured data readiness'),
})

export const ScoreCardSchema = z.object({
  aeoScore: z.number().min(0).max(100).describe('Overall AEO score'),
  verdict: z.enum([
    'Invisible',           // Score 0-20: AI doesn't know you
    'Emerging',            // Score 21-40: Some awareness
    'Rising Star',         // Score 41-60: Growing presence
    'Authority',           // Score 61-80: Well recognized
    'Dominant',            // Score 81-100: Category leader
  ]).describe('Overall status classification'),
  grade: z.enum(['A', 'B', 'C', 'D', 'F']).describe('Letter grade'),
  breakdown: ScoringBreakdownSchema,
})

export const HallucinationSchema = z.object({
  positive: z.array(z.string()).describe('Beneficial inaccuracies (AI overstates capabilities)'),
  negative: z.array(z.string()).describe('Harmful inaccuracies (wrong pricing, features, etc.)'),
  isHallucinating: z.boolean().describe('Any hallucinations detected'),
  riskLevel: z.enum(['none', 'low', 'medium', 'high']).describe('Overall hallucination risk'),
})

export const KnowledgeGraphStatusSchema = z.object({
  exists: z.boolean(),
  message: z.string().describe('Human-readable status'),
  entityType: z.string().optional().describe('Organization, Person, Product, etc.'),
  attributes: z.array(z.string()).optional().describe('Known attributes in KG'),
})

export const ActionItemSchema = z.object({
  priority: z.enum(['Critical', 'High', 'Medium', 'Low']),
  category: z.enum(['Technical', 'Content', 'Authority', 'Accuracy']),
  task: z.string().describe('What to do'),
  fix: z.string().describe('How to implement'),
  impact: z.string().describe('Expected improvement'),
  effort: z.enum(['Low', 'Medium', 'High']).describe('Implementation effort'),
})

export const AEOAuditReportSchema = z.object({
  scoreCard: ScoreCardSchema,
  hallucinations: HallucinationSchema,
  knowledgeGraphStatus: KnowledgeGraphStatusSchema,
  actionPlan: z.array(ActionItemSchema).describe('Prioritized improvement tasks'),
  summary: z.string().describe('Executive summary of findings'),
  competitorComparison: z.string().optional().describe('Brief competitor context'),
})

export type AEOAuditReport = z.infer<typeof AEOAuditReportSchema>

// ============================================================================
// DATABASE SCHEMAS
// ============================================================================

export const AEOLeadSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  brandName: z.string(),
  url: z.string().url(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  fullReportViewed: z.boolean().default(false),
  createdAt: z.date().optional(),
})

export type AEOLead = z.infer<typeof AEOLeadSchema>

export const AEOAuditRecordSchema = z.object({
  id: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  brandName: z.string(),
  url: z.string(),
  aeoScore: z.number().optional(),
  verdict: z.string().optional(),
  grade: z.string().optional(),
  entityProfile: EntityProfileSchema.optional(),
  llmMentionsCount: z.number().default(0),
  llmMentionsData: z.unknown().optional(),
  chatgptSummary: z.string().optional(),
  chatgptRawData: z.unknown().optional(),
  aiSearchVolume: z.unknown().optional(),
  knowledgeGraphExists: z.boolean().default(false),
  knowledgeGraphData: z.unknown().optional(),
  hallucinations: HallucinationSchema.optional(),
  actionPlan: z.array(ActionItemSchema).optional(),
  processingStatus: z.enum(['pending', 'processing', 'completed', 'failed']).default('pending'),
  errorMessage: z.string().optional(),
  scrapeBlocked: z.boolean().default(false),
  processingTimeMs: z.number().optional(),
  createdAt: z.date().optional(),
})

export type AEOAuditRecord = z.infer<typeof AEOAuditRecordSchema>

