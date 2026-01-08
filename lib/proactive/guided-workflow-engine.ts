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
     * Generate three proactive suggestions based on current state
     */
    async generateSuggestions(input: GenerateSuggestionsInput): Promise<ProactiveSuggestionsResponse> {
        const { userId, conversationId } = input

        // Get roadmap progress
        const roadmapProgress = await roadmapTracker.getProgress(userId)
        const currentPillar = roadmapProgress.currentPillar

        // Get completed tasks to avoid duplicates
        const completedTaskKeys = await sessionMemory.getCompletedTaskKeys(userId, conversationId)

        // Get best templates for current pillar
        const templates = getBestTemplates(currentPillar, completedTaskKeys)

        // Get user context for personalization
        const userContext = await getUserBusinessContext(userId)

        // Convert templates to suggestions with context-aware personalization
        const suggestions: ProactiveSuggestion[] = templates.map(template => ({
            category: template.category,
            prompt: this.personalizePrompt(template.prompt, userContext),
            reasoning: template.reasoning,
            pillar: template.pillar,
            taskKey: template.taskKey,
            icon: this.getCategoryIcon(template.category),
            priority: template.priority,
        }))

        // If we don't have enough suggestions (3), fill from next pillar
        if (suggestions.length < 3) {
            const nextPillar = this.getNextPillar(currentPillar)
            if (nextPillar !== currentPillar) {
                const additionalTemplates = getBestTemplates(nextPillar, completedTaskKeys)
                    .slice(0, 3 - suggestions.length)

                for (const template of additionalTemplates) {
                    suggestions.push({
                        category: template.category,
                        prompt: this.personalizePrompt(template.prompt, userContext),
                        reasoning: template.reasoning,
                        pillar: template.pillar,
                        taskKey: template.taskKey,
                        icon: this.getCategoryIcon(template.category),
                        priority: template.priority,
                    })
                }
            }
        }

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
     * Update roadmap progress based on completed action
     */
    async recordCompletedTask(
        userId: string,
        conversationId: string,
        taskKey: string,
        category: 'deep_dive' | 'adjacent' | 'execution',
        pillar: Pillar
    ): Promise<void> {
        // Mark task as completed
        await sessionMemory.markTaskCompleted(userId, conversationId, taskKey, category, pillar)

        // Update pillar progress
        const progressIncrement = this.getProgressIncrement(category)
        await roadmapTracker.updateProgress(userId, pillar, progressIncrement, {
            lastTaskKey: taskKey,
            lastTaskAt: new Date().toISOString(),
        })
    }

    /**
     * Collect and store important facts from messages into agent memory
     */
    async collectMemories(userId: string, conversationId: string, messages: any[]): Promise<void> {
        // Extract topics using session memory logic
        const topics = sessionMemory.extractTopics(messages)

        // Store common patterns as specific memories
        for (const topic of topics) {
            const topicLower = topic.toLowerCase()

            // Domain detection
            if (topicLower.includes('.') && (topicLower.startsWith('www') || topicLower.endsWith('.com') || topicLower.endsWith('.io') || topicLower.endsWith('.ai'))) {
                await sessionMemory.storeMemory(userId, 'target_domain', topic, 'domain', conversationId)
            }
            // Competitor detection
            else if (topicLower.includes('competitor') || topicLower.includes('vs')) {
                const competitors = await sessionMemory.getMemory(userId, 'competitors') || []
                if (Array.isArray(competitors) && !competitors.includes(topic)) {
                    await sessionMemory.storeMemory(userId, 'competitors', [...competitors, topic], 'competitor', conversationId)
                }
            }
            // Keyword detection
            else {
                const keywords = await sessionMemory.getMemory(userId, 'primary_keywords') || []
                if (Array.isArray(keywords) && !keywords.includes(topic)) {
                    await sessionMemory.storeMemory(userId, 'primary_keywords', [...keywords, topic].slice(0, 10), 'keyword', conversationId)
                }
            }
        }
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

    private personalizePrompt(prompt: string, userContext: Awaited<ReturnType<typeof getUserBusinessContext>>): string {
        if (!userContext.hasProfile) return prompt

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
