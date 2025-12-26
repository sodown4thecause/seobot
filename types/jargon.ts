/**
 * Jargon Tooltip System Types
 * 
 * Defines types for the SEO/AEO jargon tooltip system that provides
 * beginner-friendly explanations for technical terms.
 */

export interface JargonTerm {
  id: string
  term: string
  category: JargonCategory
  difficulty: 'basic' | 'intermediate' | 'advanced'
  shortDefinition: string
  detailedExplanation: string
  examples?: string[]
  relatedTerms?: string[]
  businessContext?: string
  commonMistakes?: string[]
  learnMoreUrl?: string
  tags: string[]
}

export type JargonCategory = 
  | 'seo-basics'
  | 'keyword-research'
  | 'content-optimization'
  | 'technical-seo'
  | 'link-building'
  | 'local-seo'
  | 'analytics'
  | 'aeo'
  | 'serp-features'
  | 'tools'

export interface JargonTooltipProps {
  term: string
  children: React.ReactNode
  variant?: 'inline' | 'underline' | 'badge' | 'icon' | 'card'
  showIcon?: boolean
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export interface JargonContextType {
  // Dictionary management
  terms: Map<string, JargonTerm>
  isLoading: boolean
  error: string | null
  
  // Term lookup
  getTerm: (term: string) => JargonTerm | null
  searchTerms: (query: string) => JargonTerm[]
  getTermsByCategory: (category: JargonCategory) => JargonTerm[]
  
  // User preferences
  isEnabled: boolean
  showAdvancedTerms: boolean
  preferredComplexity: 'basic' | 'detailed' | 'comprehensive'
  
  // Actions
  toggleTooltips: () => void
  setComplexity: (level: 'basic' | 'detailed' | 'comprehensive') => void
  markTermAsLearned: (termId: string) => void
  
  // Analytics
  trackTooltipView: (termId: string) => void
  getLearnedTerms: () => string[]
}

// Progressive disclosure levels
export interface ProgressiveDisclosure {
  basic: {
    definition: string
    example?: string
  }
  detailed: {
    explanation: string
    examples: string[]
    context?: string
  }
  comprehensive: {
    fullExplanation: string
    examples: string[]
    relatedTerms: string[]
    businessImpact: string
    commonMistakes?: string[]
    actionableAdvice?: string[]
  }
}