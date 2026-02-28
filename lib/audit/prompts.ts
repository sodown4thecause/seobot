import type { BrandDetectionPayload } from '@/lib/audit/types'

export interface BuyerIntentPrompts {
  prompt1: string
  prompt2: string
  prompt3: string
}

function fallbackCompetitor(context: BrandDetectionPayload): string {
  return context.competitors[0] || context.brand
}

export function buildBuyerIntentPrompts(context: BrandDetectionPayload): BuyerIntentPrompts {
  const competitor = fallbackCompetitor(context)

  return {
    prompt1: `What are the best ${context.category} tools for ${context.icp}?`,
    prompt2: `I need a ${context.category} solution. What do you recommend?`,
    prompt3: `What are the best alternatives to ${competitor}?`,
  }
}

export function getAuditSystemPrompt(context: BrandDetectionPayload): string {
  return [
    'You are helping evaluate AI visibility for a brand.',
    `Brand: ${context.brand}`,
    `Category: ${context.category}`,
    `ICP: ${context.icp}`,
    `Competitors: ${context.competitors.join(', ') || 'None provided'}`,
    'Provide direct recommendations in a ranked list when possible.',
    'Include sources when your platform supports citations.',
  ].join('\n')
}
