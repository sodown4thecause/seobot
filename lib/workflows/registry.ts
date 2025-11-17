// Workflow Registry - All available workflows

import { Workflow } from './types'
import { rankOnChatGPTWorkflow } from './definitions/rank-on-chatgpt'
import { aeoComprehensiveAuditWorkflow } from './definitions/aeo-comprehensive-audit'
import { aeoCitationOptimizationWorkflow } from './definitions/aeo-citation-optimization'
import { aeoMultiPlatformOptimizationWorkflow } from './definitions/aeo-multi-platform-optimization'

export const workflows: Record<string, Workflow> = {
  'rank-on-chatgpt': rankOnChatGPTWorkflow,
  'aeo-comprehensive-audit': aeoComprehensiveAuditWorkflow,
  'aeo-citation-optimization': aeoCitationOptimizationWorkflow,
  'aeo-multi-platform-optimization': aeoMultiPlatformOptimizationWorkflow,
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

