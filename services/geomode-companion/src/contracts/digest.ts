import { z } from 'zod'

export const digestSectionStatusSchema = z.enum(['ok', 'degraded', 'missing'])

export const geomodeEngineSummarySchema = z.object({
  engine: z.string(),
  mentionCount: z.number().int().nonnegative(),
  citationCount: z.number().int().nonnegative(),
  shareOfVoice: z.number().min(0).max(100).optional(),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'mixed', 'unknown']).optional(),
})

export const geomodeCitationSchema = z.object({
  url: z.string().url(),
  domain: z.string(),
  engines: z.array(z.string()),
  mentionsBrand: z.boolean(),
})

export const serpKeywordSnapshotSchema = z.object({
  keyword: z.string(),
  domain: z.string(),
  rank: z.number().int().positive().nullable(),
  previousRank: z.number().int().positive().nullable().optional(),
  rankDelta: z.number().int().optional(),
  searchVolume: z.number().int().nonnegative().nullable().optional(),
  serpFeatures: z.array(z.string()).default([]),
})

export const dailyDigestDocumentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  brand: z.string(),
  generatedAt: z.string(),
  degraded: z.boolean(),
  degradedSections: z.array(z.string()),
  geomode: z.object({
    status: digestSectionStatusSchema,
    windowHours: z.number().int().positive(),
    engines: z.array(geomodeEngineSummarySchema),
    citations: z.array(geomodeCitationSchema),
    mentionDelta: z.number().optional(),
    citationDelta: z.number().optional(),
  }),
  serp: z.object({
    status: digestSectionStatusSchema,
    keywords: z.array(serpKeywordSnapshotSchema),
    rankMovers: z.array(serpKeywordSnapshotSchema),
    serpFeatureChanges: z.array(z.object({
      keyword: z.string(),
      added: z.array(z.string()),
      removed: z.array(z.string()),
    })),
  }),
})

export const geoSuggestionActionSchema = z.object({
  priority: z.number().int().min(1).max(5),
  title: z.string().min(1).max(200),
  rationale: z.string().min(1).max(2000),
  evidence: z.array(z.string().min(1)).min(1).max(5),
})

export const geoLongTermLinkSchema = z.object({
  url: z.string().min(1),
  domain: z.string(),
  reason: z.string().min(1).max(1000),
  citedByEngines: z.array(z.string()).min(1),
})

export const geoSuggestionsSchema = z.object({
  generatedAt: z.string(),
  model: z.string(),
  actions: z.array(geoSuggestionActionSchema).max(5),
  longTermLinks: z.array(geoLongTermLinkSchema),
})

export const jobRunStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'degraded'])

export const jobRunRecordSchema = z.object({
  jobName: z.string(),
  status: jobRunStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  error: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const geoHealthResponseSchema = z.object({
  ok: z.boolean(),
  jobs: z.array(jobRunRecordSchema),
})

export type DailyDigestDocument = z.infer<typeof dailyDigestDocumentSchema>
export type GeoSuggestions = z.infer<typeof geoSuggestionsSchema>
export type SerpKeywordSnapshot = z.infer<typeof serpKeywordSnapshotSchema>
export type GeomodeEngineSummary = z.infer<typeof geomodeEngineSummarySchema>
export type GeomodeCitation = z.infer<typeof geomodeCitationSchema>
