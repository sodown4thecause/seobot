/**
 * Proactive Consultant - Types
 * 
 * Shared type definitions for the guided workflow engine
 */

// SEO/AEO Lifecycle Pillars
export type Pillar = 'discovery' | 'gap_analysis' | 'strategy' | 'production'

// Suggestion categories
export type SuggestionCategory = 'deep_dive' | 'adjacent' | 'execution'

// Individual suggestion
export interface ProactiveSuggestion {
    category: SuggestionCategory
    prompt: string
    reasoning: string
    pillar: Pillar
    taskKey: string
    icon: string
    priority: number
}

// Complete suggestions response
export interface ProactiveSuggestionsResponse {
    suggestions: ProactiveSuggestion[]
    currentPillar: Pillar
    pillarProgress: Record<Pillar, number>
}

// Roadmap progress
export interface RoadmapProgress {
    userId: string
    discoveryProgress: number
    discoveryMetadata: Record<string, unknown>
    gapAnalysisProgress: number
    gapAnalysisMetadata: Record<string, unknown>
    strategyProgress: number
    strategyMetadata: Record<string, unknown>
    productionProgress: number
    productionMetadata: Record<string, unknown>
    currentPillar: Pillar
}

// Session context for suggestion generation
export interface SessionContext {
    recentMessages: Array<{ role: string; content: string }>
    completedTasks: string[]
    userContext: {
        industry?: string
        goals?: string[]
        websiteUrl?: string
    }
}

// Pillar configuration
export const PILLAR_CONFIG: Record<Pillar, { name: string; description: string; threshold: number }> = {
    discovery: {
        name: 'Discovery',
        description: 'Keyword research and intent mapping',
        threshold: 100,
    },
    gap_analysis: {
        name: 'Gap Analysis',
        description: 'Zero-Click opportunities and AEO weaknesses',
        threshold: 100,
    },
    strategy: {
        name: 'Strategy',
        description: 'Link building and topical authority mapping',
        threshold: 100,
    },
    production: {
        name: 'Production',
        description: 'RAG-enhanced content writing',
        threshold: 100,
    },
}

// Category icons
export const CATEGORY_ICONS: Record<SuggestionCategory, string> = {
    deep_dive: '🔍',
    adjacent: '🔄',
    execution: '⚡',
}
