/**
 * Quality Thresholds Configuration
 * Defines minimum scores and revision limits for content quality feedback loop
 */

import { serverEnv } from './env'

export const QUALITY_THRESHOLDS = {
  // Minimum scores (0-100) required to pass QA
  MIN_DATAFORSEO_SCORE: serverEnv.MIN_DATAFORSEO_SCORE ?? 60,
  MIN_EEAT_SCORE: serverEnv.MIN_EEAT_SCORE ?? 70,
  MIN_DEPTH_SCORE: serverEnv.MIN_DEPTH_SCORE ?? 65,
  MIN_FACTUAL_SCORE: serverEnv.MIN_FACTUAL_SCORE ?? 70,
  MIN_AEO_SCORE: serverEnv.MIN_AEO_SCORE ?? 70, // AEO compliance threshold
  MIN_OVERALL_SCORE: serverEnv.MIN_OVERALL_SCORE ?? 70,

  // Maximum revision rounds before giving up
  MAX_REVISION_ROUNDS: serverEnv.MAX_REVISION_ROUNDS ?? 2,

  // Scoring weights for overall quality calculation (adjusted for AEO)
  SCORING_WEIGHTS: {
    dataforseo: 0.20, // Reduced from 0.25 to accommodate AEO
    eeat: 0.35,       // Reduced from 0.40 to accommodate AEO
    depth: 0.15,      // Reduced from 0.20 to accommodate AEO
    factual: 0.15,    // Unchanged
    aeo: 0.15,        // NEW: AEO compliance weight
  },
} as const

export function shouldTriggerRevision(scores: {
  dataforseo?: number
  eeat?: number
  depth?: number
  factual?: number
  aeo?: number // NEW: AEO compliance score
  overall?: number
}): boolean {
  const {
    MIN_DATAFORSEO_SCORE,
    MIN_EEAT_SCORE,
    MIN_DEPTH_SCORE,
    MIN_FACTUAL_SCORE,
    MIN_AEO_SCORE,
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

  // Check AEO compliance score
  if (scores.aeo !== undefined && scores.aeo < MIN_AEO_SCORE) {
    return true
  }

  return false
}

