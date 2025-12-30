// Workflow System Exports

export * from './types'
export * from './engine'
export * from './registry'
export * from './executor'
export * from './detector'
export { rankOnChatGPTWorkflow } from './definitions/rank-on-chatgpt'
export { competitorAnalysisWorkflow } from './definitions/competitor-analysis'
export { orchestratedWorkflows } from './orchestrator'

/**
 * Workflow detection utilities (stub)
 * TODO: Re-implement with Drizzle ORM
 */
export function detectWorkflow(content: string): boolean {
  return false
}

export function isWorkflowRequest(content: string): boolean {
  return false
}

export function extractWorkflowId(content: string): string | null {
  return null
}

