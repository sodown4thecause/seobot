/**
 * Prompt Templates for Proactive Suggestions
 * 
 * Templates organized by pillar and category for dynamic suggestion generation
 */

import type { Pillar, SuggestionCategory } from './types'

export interface PromptTemplate {
    taskKey: string
    prompt: string
    reasoning: string
    category: SuggestionCategory
    pillar: Pillar
    priority: number
    // Conditions for when this template applies
    conditions?: {
        requiresKeywords?: boolean
        requiresCompetitors?: boolean
        requiresContent?: boolean
    }
}

/**
 * Discovery Pillar Templates
 */
export const DISCOVERY_TEMPLATES: PromptTemplate[] = [
    // Deep Dive
    {
        taskKey: 'keyword_search_intent',
        prompt: 'Analyze the search intent for my top keywords',
        reasoning: 'Understanding search intent helps create content that matches user expectations',
        category: 'deep_dive',
        pillar: 'discovery',
        priority: 1,
    },
    {
        taskKey: 'keyword_difficulty_analysis',
        prompt: 'Which of these keywords are most realistic to rank for?',
        reasoning: 'Prioritizing winnable keywords maximizes ROI',
        category: 'deep_dive',
        pillar: 'discovery',
        priority: 2,
    },
    // Adjacent Strategy
    {
        taskKey: 'related_keywords',
        prompt: 'Find related keywords and topic clusters for my niche',
        reasoning: 'Expanding keyword coverage improves topical authority',
        category: 'adjacent',
        pillar: 'discovery',
        priority: 1,
    },
    {
        taskKey: 'competitor_keyword_gaps',
        prompt: 'What keywords are my competitors ranking for that I\'m missing?',
        reasoning: 'Identifying gaps reveals quick-win opportunities',
        category: 'adjacent',
        pillar: 'discovery',
        priority: 2,
    },
    // Execution
    {
        taskKey: 'keyword_prioritization',
        prompt: 'Create a prioritized keyword list for my content calendar',
        reasoning: 'A structured approach ensures systematic progress',
        category: 'execution',
        pillar: 'discovery',
        priority: 1,
    },
    {
        taskKey: 'content_mapping',
        prompt: 'Map these keywords to specific content pieces',
        reasoning: 'Connecting keywords to content prevents duplication',
        category: 'execution',
        pillar: 'discovery',
        priority: 2,
    },
]

/**
 * Gap Analysis Pillar Templates
 */
export const GAP_ANALYSIS_TEMPLATES: PromptTemplate[] = [
    // Deep Dive
    {
        taskKey: 'zero_click_analysis',
        prompt: 'Identify zero-click opportunities for my target keywords',
        reasoning: 'Featured snippets capture visibility even without clicks',
        category: 'deep_dive',
        pillar: 'gap_analysis',
        priority: 1,
    },
    {
        taskKey: 'aeo_weakness_audit',
        prompt: 'Audit my content for Answer Engine Optimization gaps',
        reasoning: 'AEO readiness is critical for AI search visibility',
        category: 'deep_dive',
        pillar: 'gap_analysis',
        priority: 2,
    },
    // Adjacent Strategy
    {
        taskKey: 'competitor_serp_features',
        prompt: 'What SERP features are competitors winning that I could target?',
        reasoning: 'Learning from competitor success accelerates gains',
        category: 'adjacent',
        pillar: 'gap_analysis',
        priority: 1,
    },
    {
        taskKey: 'paa_opportunities',
        prompt: 'Find "People Also Ask" questions I should answer',
        reasoning: 'PAA optimization captures long-tail search traffic',
        category: 'adjacent',
        pillar: 'gap_analysis',
        priority: 2,
    },
    // Execution
    {
        taskKey: 'schema_implementation',
        prompt: 'Generate schema markup for my key pages',
        reasoning: 'Structured data improves SERP feature eligibility',
        category: 'execution',
        pillar: 'gap_analysis',
        priority: 1,
    },
    {
        taskKey: 'faq_optimization',
        prompt: 'Create optimized FAQ sections for zero-click targeting',
        reasoning: 'FAQ format directly maps to featured snippet format',
        category: 'execution',
        pillar: 'gap_analysis',
        priority: 2,
    },
]

/**
 * Strategy Pillar Templates
 */
export const STRATEGY_TEMPLATES: PromptTemplate[] = [
    // Deep Dive
    {
        taskKey: 'backlink_profile_analysis',
        prompt: 'Analyze my current backlink profile quality',
        reasoning: 'Understanding link strength informs link building priorities',
        category: 'deep_dive',
        pillar: 'strategy',
        priority: 1,
    },
    {
        taskKey: 'topical_authority_mapping',
        prompt: 'Map my topical authority gaps vs competitors',
        reasoning: 'Topical authority drives organic visibility',
        category: 'deep_dive',
        pillar: 'strategy',
        priority: 2,
    },
    // Adjacent Strategy
    {
        taskKey: 'competitor_backlink_opportunities',
        prompt: 'Find sites linking to competitors that might link to me',
        reasoning: 'Competitor backlinks are proven link opportunities',
        category: 'adjacent',
        pillar: 'strategy',
        priority: 1,
    },
    {
        taskKey: 'content_hub_strategy',
        prompt: 'Design a content hub strategy for my main topics',
        reasoning: 'Hub-and-spoke models build topical authority',
        category: 'adjacent',
        pillar: 'strategy',
        priority: 2,
    },
    // Execution
    {
        taskKey: 'link_outreach_list',
        prompt: 'Generate a link building outreach target list',
        reasoning: 'Actionable outreach lists enable systematic link building',
        category: 'execution',
        pillar: 'strategy',
        priority: 1,
    },
    {
        taskKey: 'internal_linking_plan',
        prompt: 'Create an internal linking optimization plan',
        reasoning: 'Internal links distribute authority and improve crawlability',
        category: 'execution',
        pillar: 'strategy',
        priority: 2,
    },
]

/**
 * Production Pillar Templates
 */
export const PRODUCTION_TEMPLATES: PromptTemplate[] = [
    // Deep Dive
    {
        taskKey: 'content_structure_optimization',
        prompt: 'Analyze the optimal H1-H4 structure for this pillar page',
        reasoning: 'Proper heading structure improves SEO and readability',
        category: 'deep_dive',
        pillar: 'production',
        priority: 1,
    },
    {
        taskKey: 'competitor_content_analysis',
        prompt: 'What content gaps exist vs top-ranking competitors?',
        reasoning: 'Competitor content gaps reveal differentiation opportunities',
        category: 'deep_dive',
        pillar: 'production',
        priority: 2,
    },
    // Adjacent Strategy
    {
        taskKey: 'content_repurposing',
        prompt: 'How can I repurpose this content for other channels?',
        reasoning: 'Repurposing maximizes content ROI',
        category: 'adjacent',
        pillar: 'production',
        priority: 1,
    },
    {
        taskKey: 'content_update_priorities',
        prompt: 'Which existing content should I update for better rankings?',
        reasoning: 'Content refreshes often outperform new content',
        category: 'adjacent',
        pillar: 'production',
        priority: 2,
    },
    // Execution
    {
        taskKey: 'generate_pillar_content',
        prompt: 'Generate the optimized content for my target keyword',
        reasoning: 'RAG-enhanced content meets quality and SEO requirements',
        category: 'execution',
        pillar: 'production',
        priority: 1,
    },
    {
        taskKey: 'meta_optimization',
        prompt: 'Write optimized title tags and meta descriptions',
        reasoning: 'Meta optimization improves CTR from search results',
        category: 'execution',
        pillar: 'production',
        priority: 2,
    },
]

/**
 * Get all templates for a specific pillar
 */
export function getTemplatesForPillar(pillar: Pillar): PromptTemplate[] {
    switch (pillar) {
        case 'discovery':
            return DISCOVERY_TEMPLATES
        case 'gap_analysis':
            return GAP_ANALYSIS_TEMPLATES
        case 'strategy':
            return STRATEGY_TEMPLATES
        case 'production':
            return PRODUCTION_TEMPLATES
        default:
            return DISCOVERY_TEMPLATES
    }
}

/**
 * Get best templates for each category, excluding completed tasks
 */
export function getBestTemplates(
    pillar: Pillar,
    completedTaskKeys: Set<string>
): PromptTemplate[] {
    const templates = getTemplatesForPillar(pillar)

    // Filter out completed tasks and get best for each category
    const categories: SuggestionCategory[] = ['deep_dive', 'adjacent', 'execution']
    const selected: PromptTemplate[] = []

    for (const category of categories) {
        const categoryTemplates = templates
            .filter(t => t.category === category && !completedTaskKeys.has(t.taskKey))
            .sort((a, b) => a.priority - b.priority)

        if (categoryTemplates.length > 0) {
            selected.push(categoryTemplates[0])
        }
    }

    return selected
}
