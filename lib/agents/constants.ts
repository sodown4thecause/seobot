/**
 * Shared Agent Constants
 * Single source of truth for agent IDs across the codebase
 */

/**
 * Agent IDs used by the router and throughout the system
 * Using kebab-case for consistency
 */
export const AGENT_IDS = {
  ONBOARDING: 'onboarding',
  SEO_AEO: 'seo-aeo',
  CONTENT: 'content',
  GENERAL: 'general',
} as const

export type AgentId = (typeof AGENT_IDS)[keyof typeof AGENT_IDS]

/**
 * Legacy agent IDs for backward compatibility
 * Maps old snake_case IDs to new kebab-case IDs
 */
export const LEGACY_AGENT_ID_MAP: Record<string, AgentId> = {
  seo_manager: AGENT_IDS.SEO_AEO,
  content_writer: AGENT_IDS.CONTENT,
  // Add more mappings as needed
}

/**
 * Normalize an agent ID, handling legacy formats
 */
export function normalizeAgentId(id: string): AgentId {
  // Check if it's already a valid agent ID
  const validIds = Object.values(AGENT_IDS)
  if (validIds.includes(id as AgentId)) {
    return id as AgentId
  }

  // Check legacy mapping
  const mapped = LEGACY_AGENT_ID_MAP[id]
  if (mapped) {
    return mapped
  }

  // Default to general for unknown IDs
  return AGENT_IDS.GENERAL
}

/**
 * Check if a string is a valid agent ID
 */
export function isValidAgentId(id: string): id is AgentId {
  return Object.values(AGENT_IDS).includes(id as AgentId)
}
