/**
 * Session Memory
 * 
 * Manages sliding window conversation context and tracks completed tasks
 * to prevent duplicate suggestions within a session.
 */

import { db } from '@/lib/db'
import { completedTasks, messages, type Json } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { Pillar, SuggestionCategory } from './types'

export interface CompletedTaskRecord {
    taskKey: string
    taskType: SuggestionCategory
    pillar: Pillar
    completedAt: Date
}

export interface ConversationMessage {
    role: 'user' | 'assistant' | 'system'
    content: string
    createdAt?: Date
}

const DEFAULT_WINDOW_SIZE = 10

export class SessionMemory {
    private windowSize: number

    constructor(windowSize = DEFAULT_WINDOW_SIZE) {
        this.windowSize = windowSize
    }

    /**
     * Get recent messages from a conversation (sliding window)
     */
    async getRecentMessages(conversationId: string): Promise<ConversationMessage[]> {
        const result = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, conversationId))
            .orderBy(desc(messages.createdAt))
            .limit(this.windowSize)

        return result.reverse().map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content,
            createdAt: msg.createdAt,
        }))
    }

    /**
     * Get completed tasks for a user within a conversation
     */
    async getCompletedTasks(userId: string, conversationId?: string): Promise<CompletedTaskRecord[]> {
        const conditions = [eq(completedTasks.userId, userId)]

        if (conversationId) {
            conditions.push(eq(completedTasks.conversationId, conversationId))
        }

        const result = await db
            .select()
            .from(completedTasks)
            .where(and(...conditions))
            .orderBy(desc(completedTasks.completedAt))

        return result.map(task => ({
            taskKey: task.taskKey,
            taskType: task.taskType as SuggestionCategory,
            pillar: task.pillar as Pillar,
            completedAt: task.completedAt,
        }))
    }

    /**
     * Get task keys that have been completed (for filtering suggestions)
     */
    async getCompletedTaskKeys(userId: string, conversationId?: string): Promise<Set<string>> {
        const tasks = await this.getCompletedTasks(userId, conversationId)
        return new Set(tasks.map(t => t.taskKey))
    }

    /**
     * Mark a task as completed
     */
    async markTaskCompleted(
        userId: string,
        conversationId: string,
        taskKey: string,
        taskType: SuggestionCategory,
        pillar: Pillar,
        metadata?: Record<string, unknown>
    ): Promise<void> {
        await db.insert(completedTasks).values({
            userId,
            conversationId,
            taskKey,
            taskType,
            pillar,
            metadata: (metadata || {}) as Json,
        })
    }

    /**
     * Extract key topics from recent messages for context-aware suggestions
     */
    extractTopics(messages: ConversationMessage[]): string[] {
        const topics: string[] = []
        const topicPatterns = [
            /keyword[s]?:?\s*([^.!?\n]+)/gi,
            /(?:analyze|research|looking at)\s+([^.!?\n]+)/gi,
            /(?:competitor[s]?|domain[s]?):?\s*([^.!?\n]+)/gi,
            /(?:content|article|blog|page)\s+(?:about|on|for)\s+([^.!?\n]+)/gi,
        ]

        for (const msg of messages) {
            if (msg.role !== 'user') continue

            for (const pattern of topicPatterns) {
                const matches = msg.content.matchAll(pattern)
                for (const match of matches) {
                    if (match[1]) {
                        topics.push(match[1].trim().substring(0, 100))
                    }
                }
            }
        }

        return [...new Set(topics)].slice(0, 5)
    }

    /**
     * Detect intent from recent messages
     */
    detectCurrentIntent(messages: ConversationMessage[]): string | null {
        const lastUserMessage = messages.filter(m => m.role === 'user').pop()
        if (!lastUserMessage) return null

        const content = lastUserMessage.content.toLowerCase()

        // Discovery intents
        if (content.includes('keyword') || content.includes('search volume') || content.includes('intent')) {
            return 'keyword_research'
        }

        // Gap analysis intents
        if (content.includes('competitor') || content.includes('gap') || content.includes('zero-click') || content.includes('aeo')) {
            return 'gap_analysis'
        }

        // Strategy intents
        if (content.includes('link') || content.includes('backlink') || content.includes('authority') || content.includes('topical')) {
            return 'link_building'
        }

        // Production intents
        if (content.includes('write') || content.includes('content') || content.includes('article') || content.includes('blog')) {
            return 'content_production'
        }

        return null
    }
}

export const sessionMemory = new SessionMemory()
