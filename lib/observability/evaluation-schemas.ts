/**
 * LangWatch Evaluation Schemas
 *
 * Defines evaluation schemas for each agent type in the multi-agent pipeline.
 * These schemas are used for LLM-as-a-judge evaluations to assess content quality,
 * EEAT compliance, and SEO effectiveness.
 */

/**
 * Evaluation schema IDs for different agent types
 */
export const EVALUATION_SCHEMAS = {
  CONTENT_QUALITY: 'content_quality_v1',
  EEAT: 'eeat_judge_v1',
  SEO: 'seo_judge_v1',
  RESEARCH: 'research_quality_v1',
  CONTENT_WRITER: 'content_writer_v1',
} as const

/**
 * Content Quality Evaluation Schema
 * Evaluates overall content quality across multiple dimensions
 */
export interface ContentQualityEvaluation {
  relevance_score: number // 0-100: How relevant is the content to the topic?
  accuracy_score: number // 0-100: How accurate is the information?
  depth_score: number // 0-100: How comprehensive is the coverage?
  readability_score: number // 0-100: How readable and engaging is the content?
  overall_score: number // 0-100: Overall quality score
}

/**
 * EEAT Evaluation Schema
 * Evaluates content for Experience, Expertise, Authoritativeness, and Trustworthiness
 */
export interface EEATEvaluation {
  experience_score: number // 0-100: Does the content demonstrate first-hand experience?
  expertise_score: number // 0-100: Does the content show expertise in the topic?
  authoritativeness_score: number // 0-100: Is the author/website authoritative?
  trustworthiness_score: number // 0-100: Is the content trustworthy and reliable?
  eeat_score: number // 0-100: Overall EEAT score
  depth_score: number // 0-100: Depth of coverage
  factual_score: number // 0-100: Factual accuracy
}

/**
 * SEO Evaluation Schema
 * Evaluates content for SEO effectiveness
 */
export interface SEOEvaluation {
  keyword_optimization_score: number // 0-100: How well are keywords integrated?
  meta_optimization_score: number // 0-100: Quality of meta title and description
  structure_score: number // 0-100: Content structure (headings, lists, etc.)
  internal_linking_score: number // 0-100: Internal linking quality
  seo_score: number // 0-100: Overall SEO score
}

/**
 * Research Quality Evaluation Schema
 * Evaluates the quality of research conducted by the research agent
 */
export interface ResearchQualityEvaluation {
  source_quality_score: number // 0-100: Quality of sources used
  coverage_score: number // 0-100: Comprehensiveness of research
  relevance_score: number // 0-100: Relevance of research to topic
  recency_score: number // 0-100: Recency of information
  overall_score: number // 0-100: Overall research quality
}

/**
 * Content Writer Evaluation Schema
 * Evaluates the content writer agent's output
 */
export interface ContentWriterEvaluation {
  coherence_score: number // 0-100: How coherent is the content?
  style_score: number // 0-100: How well does it match the requested style?
  structure_score: number // 0-100: How well-structured is the content?
  engagement_score: number // 0-100: How engaging is the content?
  overall_score: number // 0-100: Overall content writer score
}

/**
 * Evaluation schema registry
 * Maps evaluation schema IDs to their descriptions and score names
 */
export const EVALUATION_SCHEMA_REGISTRY = {
  [EVALUATION_SCHEMAS.CONTENT_QUALITY]: {
    name: 'Content Quality Evaluation',
    description: 'Evaluates overall content quality across relevance, accuracy, depth, and readability',
    scoreNames: ['relevance_score', 'accuracy_score', 'depth_score', 'readability_score', 'overall_score'],
    minPassingScore: 75,
  },
  [EVALUATION_SCHEMAS.EEAT]: {
    name: 'EEAT Evaluation',
    description: 'Evaluates content for Experience, Expertise, Authoritativeness, and Trustworthiness',
    scoreNames: ['experience_score', 'expertise_score', 'authoritativeness_score', 'trustworthiness_score', 'eeat_score', 'depth_score', 'factual_score'],
    minPassingScore: 70,
  },
  [EVALUATION_SCHEMAS.SEO]: {
    name: 'SEO Evaluation',
    description: 'Evaluates content for SEO effectiveness including keyword optimization and structure',
    scoreNames: ['keyword_optimization_score', 'meta_optimization_score', 'structure_score', 'internal_linking_score', 'seo_score'],
    minPassingScore: 80,
  },
  [EVALUATION_SCHEMAS.RESEARCH]: {
    name: 'Research Quality Evaluation',
    description: 'Evaluates the quality of research conducted by the research agent',
    scoreNames: ['source_quality_score', 'coverage_score', 'relevance_score', 'recency_score', 'overall_score'],
    minPassingScore: 75,
  },
  [EVALUATION_SCHEMAS.CONTENT_WRITER]: {
    name: 'Content Writer Evaluation',
    description: 'Evaluates the content writer agent\'s output for coherence, style, structure, and engagement',
    scoreNames: ['coherence_score', 'style_score', 'structure_score', 'engagement_score', 'overall_score'],
    minPassingScore: 75,
  },
} as const

/**
 * Get evaluation schema configuration by ID
 */
export function getEvaluationSchema(evaluationId: string) {
  return EVALUATION_SCHEMA_REGISTRY[evaluationId as keyof typeof EVALUATION_SCHEMA_REGISTRY]
}

/**
 * Check if an evaluation schema exists
 */
export function isValidEvaluationSchema(evaluationId: string): boolean {
  return evaluationId in EVALUATION_SCHEMA_REGISTRY
}

