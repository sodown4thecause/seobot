import type { AgentType } from './intent-classifier'
import type { ChatMode } from './modes'

export function resolveEffectiveAgent(
  classifiedAgent: AgentType,
  mode: ChatMode,
): AgentType {
  if (classifiedAgent === 'image') return classifiedAgent
  if (mode === 'content') return 'content'
  if (mode === 'geo') return 'geo'
  if (mode === 'social') return 'social'
  return 'seo-aeo'
}

export function shouldLoadRagContext(agent: AgentType): boolean {
  return agent === 'seo-aeo' || agent === 'content' || agent === 'geo' || agent === 'social'
}
