/**
 * Quality Thresholds Configuration
 * Defines minimum scores and revision limits for content quality feedback loop
 */

export const QUALITY_THRESHOLDS = {
  // Minimum scores (0-100) required to pass QA
  MIN_DATAFORSEO_SCORE: Number(process.env.MIN_DATAFORSEO_SCORE) || 60,
  MIN_EEAT_SCORE: Number(process.env.MIN_EEAT_SCORE) || 70,
  MIN_DEPTH_SCORE: Number(process.env.MIN_DEPTH_SCORE) || 65,
  MIN_FACTUAL_SCORE: Number(process.env.MIN_FACTUAL_SCORE) || 70,
  MIN_OVERALL_SCORE: Number(process.env.MIN_OVERALL_SCORE) || 70,

  // Maximum revision rounds before giving up
  MAX_REVISION_ROUNDS: Number(process.env.MAX_REVISION_ROUNDS) || 3,

  // Scoring weights for overall quality calculation
  SCORING_WEIGHTS: {
    dataforseo: 0.25,
    eeat: 0.40,
    depth: 0.20,
    factual: 0.15,
  },
} as const

export function shouldTriggerRevision(scores: {
  dataforseo?: number
  eeat?: number
  depth?: number
  factual?: number
  overall?: number
}): boolean {
  const { 
    MIN_DATAFORSEO_SCORE,
    MIN_EEAT_SCORE,
    MIN_DEPTH_SCORE,
    MIN_FACTUAL_SCORE,
    MIN_OVERALL_SCORE,
  } = QUALITY_THRESHOLDS

  // Check overall score first
  if (scores.overall !== undefined && scores.overall < MIN_OVERALL_SCORE) {
    return true
  }

  // Check individual dimension scores
  if (scores.dataforseo !== undefined && scores.dataforseo < MIN_DATAFORSEO_SCORE) {
    return true
  }

  if (scores.eeat !== undefined && scores.eeat < MIN_EEAT_SCORE) {
    return true
  }

  if (scores.depth !== undefined && scores.depth < MIN_DEPTH_SCORE) {
    return true
  }

  if (scores.factual !== undefined && scores.factual < MIN_FACTUAL_SCORE) {
    return true
  }

  return false
}

