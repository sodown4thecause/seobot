// Workflow Registry - All available workflows

import { Workflow } from './types'
import { rankOnChatGPTWorkflow } from './definitions/rank-on-chatgpt'

export const workflows: Record<string, Workflow> = {
  'rank-on-chatgpt': rankOnChatGPTWorkflow,
  // More workflows will be added here
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

