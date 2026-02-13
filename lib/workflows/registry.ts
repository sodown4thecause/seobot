/**
 * Workflow Registry
 * 
 * In-memory registry for workflow definitions.
 * Workflow executions are persisted via workflowPersistence (Drizzle ORM).
 */

import type { Workflow } from './types'

// Import existing workflow definitions
import { rankingCampaignWorkflow } from './definitions/ranking-campaign'
import { competitorAnalysisWorkflow } from './definitions/competitor-analysis'
import { rankOnChatGPTWorkflow } from './definitions/rank-on-chatgpt'
import { technicalSEOAuditWorkflow } from './definitions/technical-seo-audit'
import { linkBuildingCampaignWorkflow } from './definitions/link-building-campaign'
import { localSEOCampaignWorkflow } from './definitions/local-seo-campaign'
import { aeoCitationOptimizationWorkflow } from './definitions/aeo-citation-optimization'
import { aeoComprehensiveAuditWorkflow } from './definitions/aeo-comprehensive-audit'
import { aeoMultiPlatformOptimizationWorkflow } from './definitions/aeo-multi-platform-optimization'

// Instant campaign imports
import { instantRankKeywordWorkflow } from './definitions/instant-rank-keyword'
import { instantBeatCompetitorWorkflow } from './definitions/instant-beat-competitor'
import { instantAnswerQuestionWorkflow } from './definitions/instant-answer-question'

/**
 * In-memory workflow registry
 */
const WORKFLOW_REGISTRY = new Map<string, Workflow>([
  // Standard workflows
  ['ranking-campaign', rankingCampaignWorkflow],
  ['competitor-analysis', competitorAnalysisWorkflow],
  ['rank-on-chatgpt', rankOnChatGPTWorkflow],
  ['technical-seo-audit', technicalSEOAuditWorkflow],
  ['link-building-campaign', linkBuildingCampaignWorkflow],
  ['local-seo-campaign', localSEOCampaignWorkflow],
  ['aeo-citation-optimization', aeoCitationOptimizationWorkflow],
  ['aeo-comprehensive-audit', aeoComprehensiveAuditWorkflow],
  ['aeo-multi-platform-optimization', aeoMultiPlatformOptimizationWorkflow],
  
  // Instant campaigns
  ['instant-rank-keyword', instantRankKeywordWorkflow],
  ['instant-beat-competitor', instantBeatCompetitorWorkflow],
  ['instant-answer-question', instantAnswerQuestionWorkflow],
])

/**
 * Register a new workflow dynamically
 */
export function registerWorkflow(workflow: Workflow): void {
  WORKFLOW_REGISTRY.set(workflow.id, workflow)
  console.log(`[Workflows] Registered workflow: ${workflow.name}`)
}

/**
 * Get a registered workflow by ID
 */
export function getWorkflow(workflowId: string): Workflow | null {
  return WORKFLOW_REGISTRY.get(workflowId) || null
}

/**
 * List all registered workflows
 */
export function listWorkflows(): Workflow[] {
  return Array.from(WORKFLOW_REGISTRY.values())
}

/**
 * Alias for listWorkflows for compatibility
 */
export function getAllWorkflows(): Workflow[] {
  return listWorkflows()
}

/**
 * Get workflows by category
 */
export function getWorkflowsByCategory(category: string): Workflow[] {
  return listWorkflows().filter(w => w.category === category)
}

/**
 * Get instant campaign workflows (category: 'instant')
 */
export function getInstantCampaigns(): Workflow[] {
  return getWorkflowsByCategory('instant')
}

/**
 * Get standard SEO workflows (category: 'seo')
 */
export function getSEOWorkflows(): Workflow[] {
  return getWorkflowsByCategory('seo')
}

/**
 * Check if a workflow exists
 */
export function hasWorkflow(workflowId: string): boolean {
  return WORKFLOW_REGISTRY.has(workflowId)
}

/**
 * Get workflow count
 */
export function getWorkflowCount(): number {
  return WORKFLOW_REGISTRY.size
}
