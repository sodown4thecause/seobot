/**
 * Jargon Tooltip System Components
 * 
 * Export all jargon-related components for easy importing
 */

export { JargonTooltip } from './jargon-tooltip'
export { JargonSearch } from './jargon-search'
export { JargonPreferences } from './jargon-preferences'

// Re-export provider and hooks for convenience
export { JargonProvider, useJargon, useJargonTerm } from '../providers/jargon-provider'

// Re-export types
export type { 
  JargonTerm, 
  JargonCategory, 
  JargonTooltipProps,
  JargonContextType,
  ProgressiveDisclosure
} from '../../types/jargon'