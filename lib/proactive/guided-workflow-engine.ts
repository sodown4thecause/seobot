/**
 * Guided Workflow Engine
 * 
 * The core engine that generates proactive follow-up prompts after each user response.
 * Analyzes current state, session history, and roadmap progress to generate
 * three categorized suggestions: Deep Dive, Adjacent Strategy, Execution.
 */

import { roadmapTracker } from './roadmap-tracker'
import { sessionMemory } from './session-memory'
import { getBestTemplates } from './prompt-templates'
import { getUserBusinessContext } from '@/lib/onboarding/user-context-service'
import type {
    ProactiveSuggestion,
    ProactiveSuggestionsResponse,
    Pillar,
    CATEGORY_ICONS,
    SessionContext,
} from './types'

export interface GenerateSuggestionsInput {
    userId: string
    conversationId: string
    recentMessages?: Array<{ role: string; content: string }>
    assistantResponse?: string
}

export class GuidedWorkflowEngine {
    /**
     * Generate three proactive suggestions based on current user state.
     * Fetches progress, completed tasks, and user context in parallel for optimal performance.
     */
    async generateSuggestions(input: GenerateSuggestionsInput): Promise<ProactiveSuggestionsResponse> {
        const { userId, conversationId } = input

        // Fetch all three data sources in parallel to minimize latency
        const [roadmapProgress, completedTaskKeys, userContext] = await Promise.all([
            // Fetch current roadmap progress to determine active pillar
            roadmapTracker.getProgress(userId).catch(error => {
                console.error('[GuidedWorkflowEngine] Failed to fetch roadmap progress:', error)
                // Fallback to default starting state
                return {
                    currentPillar: 'discovery' as Pillar,
                    discoveryProgress: 0,
                    gapAnalysisProgress: 0,
                    strategyProgress: 0,
                    productionProgress: 0,
                }
            }),

            // Retrieve previously completed task keys to prevent recommending duplicates
            sessionMemory.getCompletedTaskKeys(userId, conversationId).catch(error => {
                console.error('[GuidedWorkflowEngine] Failed to fetch completed tasks:', error)
                // Fallback to empty set - may show some duplicate suggestions
                return new Set<string>()
            }),

            // Load business context for personalization (industry, goals, tone)
            getUserBusinessContext(userId).catch(error => {
                console.error('[GuidedWorkflowEngine] Failed to fetch user context:', error)
                // Fallback to generic context
                return null
            })
        ])

        const currentPillar = roadmapProgress.currentPillar

        // Select best-fit templates filtered by current pillar and exclusion list
        const templates = getBestTemplates(currentPillar, completedTaskKeys)

        // Transform templates into suggestion objects with personalized prompts
        const suggestions: ProactiveSuggestion[] = templates.map(template => ({
            category: template.category,
            prompt: this.personalizePrompt(template.prompt, userContext),
            reasoning: template.reasoning,
            pillar: template.pillar,
            taskKey: template.taskKey,
            icon: this.getCategoryIcon(template.category),
            priority: template.priority,
        }))

        // Ensure minimum of 3 suggestions by borrowing from next pillar if needed
        if (suggestions.length < 3) {
            const nextPillar = this.getNextPillar(currentPillar)
            if (nextPillar !== currentPillar) {
                // Get templates from next pillar
                const additionalTemplates = getBestTemplates(nextPillar, completedTaskKeys)

                // Track existing categories and taskKeys to avoid duplicates
                const existingCategories = new Set(suggestions.map(s => s.category))
                const existingTaskKeys = new Set(suggestions.map(s => s.taskKey))

                // Filter out templates with duplicate categories or taskKeys
                const filteredTemplates = additionalTemplates.filter(template => 
                    !existingCategories.has(template.category) && 
                    !existingTaskKeys.has(template.taskKey)
                )

                // Add filtered templates until we reach 3 suggestions or run out of templates
                for (const template of filteredTemplates) {
                    if (suggestions.length >= 3) break

                    suggestions.push({
                        category: template.category,
                        prompt: this.personalizePrompt(template.prompt, userContext),
                        reasoning: template.reasoning,
                        pillar: template.pillar,
                        taskKey: template.taskKey,
                        icon: this.getCategoryIcon(template.category),
                        priority: template.priority,
                    })

                    // Update tracking sets
                    existingCategories.add(template.category)
                    existingTaskKeys.add(template.taskKey)
                }
            }
        }

        // Return formatted response with suggestions and progress metadata
        return {
            suggestions: suggestions.slice(0, 3),
            currentPillar,
            pillarProgress: {
                discovery: roadmapProgress.discoveryProgress,
                gap_analysis: roadmapProgress.gapAnalysisProgress,
                strategy: roadmapProgress.strategyProgress,
                production: roadmapProgress.productionProgress,
            },
        }
    }

    /**
     * Update roadmap progress based on completed action.
     * 
     * Implements transaction-like semantics with compensation:
     * - If marking task complete fails, throws error (no progress update)
     * - If progress update fails, logs error but keeps task completion
     * 
     * This ensures we never lose user progress while maintaining consistency.
     */
    async recordCompletedTask(
        userId: string,
        conversationId: string,
        taskKey: string,
        category: 'deep_dive' | 'adjacent' | 'execution',
        pillar: Pillar
    ): Promise<void> {
        // Step 1: Mark task as completed (critical - throws on failure)
        try {
            await sessionMemory.markTaskCompleted(userId, conversationId, taskKey, category, pillar)
        } catch (error) {
            // Task completion is critical - re-throw to prevent progress update
            console.error('[GuidedWorkflowEngine] Failed to mark task completed:', {
                userId,
                conversationId,
                taskKey,
                category,
                pillar,
                error
            })
            throw new Error(`Failed to record completed task: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        // Step 2: Update pillar progress (best-effort - log on failure)
        try {
            const progressIncrement = this.getProgressIncrement(category)
            await roadmapTracker.updateProgress(userId, pillar, progressIncrement, {
                lastTaskKey: taskKey,
                lastTaskAt: new Date().toISOString(),
            })
        } catch (error) {
            // Progress update failure is non-critical - task is already marked complete
            // Log error for monitoring but don't throw (user still gets credit for task)
            console.error('[GuidedWorkflowEngine] Failed to update roadmap progress (task completion preserved):', {
                userId,
                pillar,
                taskKey,
                error
            })
            // Note: Task completion is preserved - progress can be recalculated from completed tasks
        }
    }

    /**
     * Collect and store important facts from messages into agent memory
     */
    async collectMemories(userId: string, conversationId: string, messages: any[]): Promise<void> {
        try {
            // Extract topics using session memory logic
            const topics = sessionMemory.extractTopics(messages)

            // Store common patterns as specific memories
            for (const topic of topics) {
                const topicLower = topic.toLowerCase()

                // Domain detection - improved pattern matching
                if (this.isDomain(topicLower)) {
                    try {
                        await sessionMemory.storeMemory(userId, 'target_domain', topic, 'domain', conversationId)
                    } catch (error) {
                        console.error('[GuidedWorkflowEngine] Failed to store domain memory:', error)
                    }
                }
                // Competitor detection
                else if (topicLower.includes('competitor') || topicLower.includes('vs')) {
                    try {
                        const competitors = await sessionMemory.getMemory(userId, 'competitors') || []
                        if (Array.isArray(competitors) && !competitors.includes(topic)) {
                            // Avoid race condition by using a fresh copy
                            const updatedCompetitors = [...competitors, topic]
                            await sessionMemory.storeMemory(userId, 'competitors', updatedCompetitors, 'competitor', conversationId)
                        }
                    } catch (error) {
                        console.error('[GuidedWorkflowEngine] Failed to store competitor memory:', error)
                    }
                }
                // Keyword detection
                else {
                    try {
                        const keywords = await sessionMemory.getMemory(userId, 'primary_keywords') || []
                        if (Array.isArray(keywords) && !keywords.includes(topic)) {
                            // Avoid race condition by using a fresh copy and limiting to 10
                            const updatedKeywords = [...keywords, topic].slice(0, 10)
                            await sessionMemory.storeMemory(userId, 'primary_keywords', updatedKeywords, 'keyword', conversationId)
                        }
                    } catch (error) {
                        console.error('[GuidedWorkflowEngine] Failed to store keyword memory:', error)
                    }
                }
            }
        } catch (error) {
            console.error('[GuidedWorkflowEngine] Error in collectMemories:', error)
            // Don't throw - memory collection is optional
        }
    }

    /**
     * Helper to detect if a topic is a domain name
     * Supports common TLDs and URL patterns
     */
    private isDomain(topic: string): boolean {
        if (!topic.includes('.')) return false

        // Common domain TLDs
        const commonTLDs = [
            '.com', '.org', '.net', '.io', '.ai', '.co', '.dev',
            '.app', '.tech', '.site', '.online', '.store',
            '.shop', '.biz', '.info', '.me', '.xyz'
        ]

        // Check for common TLD at the end
        if (commonTLDs.some(tld => topic.endsWith(tld))) {
            return true
        }

        // Check for www prefix
        if (topic.startsWith('www.')) {
            return true
        }

        // Check for domain-like pattern (word.word)
        const domainPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i
        return domainPattern.test(topic)
    }

    /**
     * Detect which task was completed from assistant response
     */
    detectCompletedTask(
        assistantResponse: string,
        recentMessages: Array<{ role: string; content: string }>
    ): { taskKey: string; category: 'deep_dive' | 'adjacent' | 'execution'; pillar: Pillar } | null {
        const responseContent = assistantResponse.toLowerCase()
        const lastUserMessage = recentMessages.filter(m => m.role === 'user').pop()?.content?.toLowerCase() || ''

        // Keyword research detection
        if (responseContent.includes('search volume') || responseContent.includes('keyword difficulty')) {
            if (lastUserMessage.includes('intent')) {
                return { taskKey: 'keyword_search_intent', category: 'deep_dive', pillar: 'discovery' }
            }
            return { taskKey: 'keyword_analysis', category: 'deep_dive', pillar: 'discovery' }
        }

        // Backlink analysis detection
        if (responseContent.includes('backlink') || responseContent.includes('referring domain')) {
            return { taskKey: 'backlink_profile_analysis', category: 'deep_dive', pillar: 'strategy' }
        }

        // Content generation detection
        if (responseContent.includes('## ') && responseContent.length > 500) {
            return { taskKey: 'generate_pillar_content', category: 'execution', pillar: 'production' }
        }

        // Zero-click/AEO detection
        if (responseContent.includes('featured snippet') || responseContent.includes('zero-click')) {
            return { taskKey: 'zero_click_analysis', category: 'deep_dive', pillar: 'gap_analysis' }
        }

        return null
    }

    private personalizePrompt(prompt: string, userContext: Awaited<ReturnType<typeof getUserBusinessContext>> | null): string {
        if (!userContext || !userContext.hasProfile) return prompt

        // Add context hints if available
        if (userContext.profile?.industry) {
            prompt = prompt.replace('my niche', `my ${userContext.profile.industry} niche`)
        }

        return prompt
    }

    private getCategoryIcon(category: 'deep_dive' | 'adjacent' | 'execution'): string {
        const icons = {
            deep_dive: '🔍',
            adjacent: '🔄',
            execution: '⚡',
        }
        return icons[category]
    }

    private getNextPillar(current: Pillar): Pillar {
        const order: Pillar[] = ['discovery', 'gap_analysis', 'strategy', 'production']
        const currentIndex = order.indexOf(current)
        return currentIndex < order.length - 1 ? order[currentIndex + 1] : current
    }

    private getProgressIncrement(category: 'deep_dive' | 'adjacent' | 'execution'): number {
        // Different categories contribute different progress amounts
        const increments = {
            deep_dive: 15,
            adjacent: 10,
            execution: 25,
        }
        return increments[category]
    }
}

export const guidedWorkflowEngine = new GuidedWorkflowEngine()
