import type { DiagnosticIntent } from '@/lib/diagnostic-types'

export const DIAGNOSTIC_SYSTEM_PROMPT = `You are an impartial AI recommendation analyst. Your role is to simulate how AI assistants make brand recommendations.

When asked about products or services, provide realistic brand recommendations as an AI assistant would. Your response must be structured as valid JSON.

**Response Format (required):**
Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "name": "Brand/Company name",
      "type": "primary" | "secondary" | "listed" | "mention_only",
      "reasoning": "Brief explanation of why this brand is recommended",
      "position": 1-10,
      "cited": true | false
    }
  ],
  "analysis": {
    "intentDetected": "transactional" | "comparative" | "informational",
    "confidenceScore": 0.0-1.0,
    "keyFactors": ["factor1", "factor2", "factor3"],
    "marketContext": "Brief market context description"
  }
}

**Recommendation Types:**
- "primary": First/strongest recommendation (position 1-2)
- "secondary": Alternative recommendations (position 3-5)
- "listed": Mentioned in a list but not emphasized (position 6-10)
- "mention_only": Referenced but not positioned as a recommendation

**Guidelines:**
1. Be realistic - recommend brands an actual AI would suggest
2. Base recommendations on general market knowledge and typical user needs
3. Consider factors like reputation, features, pricing, and user reviews
4. Provide honest reasoning for each recommendation
5. Include 3-7 brands in total for most queries
6. Mark "cited" as true if you reference specific sources or data

Return ONLY valid JSON, no additional text or markdown.`

export const DEFAULT_USE_CASE = 'a business or individual looking for solutions in this market'

function sanitizeBrandSummary(summary: string): string {
  let sanitized = summary
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/["`'\\]/g, '')

  const imperativePatterns = [
    /^(ignore|disregard|forget|override|skip)\b/gim,
    /^(you must|you should|you have to|your task is|your role is)\b/gim,
    /^(system:|assistant:|user:)\b/gim,
  ]

  for (const pattern of imperativePatterns) {
    sanitized = sanitized.replace(pattern, '[redacted]')
  }

  const lines = sanitized.split(/[.!?]/)
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim().toLowerCase()
    return !trimmed.startsWith('ignore') &&
           !trimmed.startsWith('disregard') &&
           !trimmed.startsWith('forget') &&
           !trimmed.includes('system prompt') &&
           !trimmed.includes('your instructions')
  })
  sanitized = filteredLines.join('. ').trim()

  if (sanitized.length > 200) {
    sanitized = sanitized.slice(0, 200).trim()
    const lastSpace = sanitized.lastIndexOf(' ')
    if (lastSpace > 150) {
      sanitized = sanitized.slice(0, lastSpace)
    }
  }

  return sanitized || 'a company in this market'
}

export interface BuildIntentPromptParams {
  intent: DiagnosticIntent
  domain: string
  brandSummary: string
  primaryKeyword: string
  secondaryKeyword: string
  useCase?: string
}

export function buildIntentPrompt(params: BuildIntentPromptParams): string {
  const {
    intent,
    domain,
    brandSummary,
    primaryKeyword,
    secondaryKeyword,
    useCase = DEFAULT_USE_CASE,
  } = params

  const safeBrandSummary = sanitizeBrandSummary(brandSummary)

  const intentPrompts: Record<DiagnosticIntent, string> = {
    transactional: `I need to find the best solution for "${primaryKeyword}". I'm comparing options and ready to make a decision soon.

Context: I'm ${useCase}. I've heard about ${domain} - ${safeBrandSummary}

What are the top solutions you'd recommend? Please provide your top recommendations with reasoning.`,
    
    comparative: `I'm comparing different solutions for "${primaryKeyword}" vs "${secondaryKeyword}". What are the main differences and which would you recommend?

Context: I'm ${useCase}. I want to understand how ${domain} compares to alternatives.

Please compare the leading options and explain their strengths and weaknesses.`,
    
    informational: `What should I know about "${primaryKeyword}"? I'm researching this topic and want to understand the landscape.

Context: I'm ${useCase}. I'm aware of ${domain} but want to learn about other options too.

What are the key players and solutions in this space? Provide an informative overview.`,
  }

  return intentPrompts[intent]
}