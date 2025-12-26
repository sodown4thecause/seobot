// Workflow Registry - All available workflows

import { Workflow } from './types'
import { rankOnChatGPTWorkflow } from './definitions/rank-on-chatgpt'
import { aeoComprehensiveAuditWorkflow } from './definitions/aeo-comprehensive-audit'
import { aeoCitationOptimizationWorkflow } from './definitions/aeo-citation-optimization'
import { aeoMultiPlatformOptimizationWorkflow } from './definitions/aeo-multi-platform-optimization'
import { competitorAnalysisWorkflow } from './definitions/competitor-analysis'
import { rankingCampaignWorkflow } from './definitions/ranking-campaign'
import { linkBuildingCampaignWorkflow } from './definitions/link-building-campaign'
import { technicalSEOAuditWorkflow } from './definitions/technical-seo-audit'
import { localSEOCampaignWorkflow } from './definitions/local-seo-campaign'

export const workflows: Record<string, Workflow> = {
  'rank-on-chatgpt': rankOnChatGPTWorkflow,
  'aeo-comprehensive-audit': aeoComprehensiveAuditWorkflow,
  'aeo-citation-optimization': aeoCitationOptimizationWorkflow,
  'aeo-multi-platform-optimization': aeoMultiPlatformOptimizationWorkflow,
  'competitor-analysis': competitorAnalysisWorkflow,
  'ranking-campaign': rankingCampaignWorkflow,
  'link-building-campaign': linkBuildingCampaignWorkflow,
  'technical-seo-audit': technicalSEOAuditWorkflow,
  'local-seo-campaign': localSEOCampaignWorkflow,
}

export function getWorkflow(id: string): Workflow | undefined {
  return workflows[id]
}

export function getAllWorkflows(): Workflow[] {
  return Object.values(workflows)
}

export function getWorkflowsByCategory(category: string): Workflow[] {
  return Object.values(workflows).filter((w) => w.category === category)
}

export function getWorkflowsByTag(tag: string): Workflow[] {
  return Object.values(workflows).filter((w) => w.tags.includes(tag))
}

