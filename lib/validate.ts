import { z } from 'zod'

export type AIRecommendationType = 'primary' | 'secondary' | 'listed' | 'mention_only'

export const aiRecommendationTypeSchema = z.enum(['primary', 'secondary', 'listed', 'mention_only'])

export const recommendedBrandSchema = z.object({
  name: z.string(),
  recommendation_type: aiRecommendationTypeSchema,
  position: z.number().nullable().optional(),
})

export const directLinkSchema = z.object({
  url: z.string().url(),
})

export const llmStructuredResponseSchema = z.object({
  recommended_brands: z.array(recommendedBrandSchema),
  direct_links_included: z.array(directLinkSchema),
})

export interface RecommendedBrand {
  name: string
  recommendation_type: AIRecommendationType
  position?: number | null
}

export interface DirectLink {
  url: string
}

export interface LlmStructuredResponse {
  recommended_brands: RecommendedBrand[]
  direct_links_included: DirectLink[]
}

const domainRegex = /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(?:\/.*)?$/i

export const diagnosticRunInputSchema = z.object({
  domain: z
    .string({
      required_error: 'Domain is required',
      invalid_type_error: 'Domain must be a string',
    })
    .min(1, 'Domain cannot be empty')
    .refine((val) => domainRegex.test(val), {
      message: 'Domain must be a valid URL or domain format (e.g., example.com or https://example.com)',
    }),
  keywords: z
    .array(z.string().min(1, 'Keyword cannot be empty'))
    .max(5, 'Maximum 5 keywords allowed')
    .optional()
    .default([]),
  brandIdentity: z.string().optional(),
})

export type DiagnosticRunInput = z.infer<typeof diagnosticRunInputSchema>