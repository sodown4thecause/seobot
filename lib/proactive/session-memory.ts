/**
 * Session Memory
 * 
 * Manages sliding window conversation context and tracks completed tasks
 * to prevent duplicate suggestions within a session.
 */

import { db } from '@/lib/db'
import { completedTasks, messages, agentMemory, type Json } from '@/lib/db/schema'
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

const VALID_MESSAGE_ROLES = ['user', 'assistant', 'system'] as const
type ValidMessageRole = typeof VALID_MESSAGE_ROLES[number]

const DEFAULT_WINDOW_SIZE = 10

/**
 * Type guard to check if a string is a valid message role
 */
function isValidMessageRole(role: string): role is ValidMessageRole {
    return VALID_MESSAGE_ROLES.includes(role as ValidMessageRole)
}

/**
 * Validates and safely converts data to JSON-compatible format
 * Prevents type assertion errors and ensures data can be stored in JSONB columns
 */
function safeJsonify(data: unknown): Json {
    if (data === null || data === undefined) {
        return {} as Json
    }

    // Check if it's already a valid JSON type
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return data as Json
    }

    // For objects and arrays, ensure they're serializable
    if (typeof data === 'object') {
        try {
            // Test if it's JSON-serializable
            JSON.stringify(data)
            return data as Json
        } catch (err) {
            console.warn('[SessionMemory] Data is not JSON-serializable, returning empty object:', err)
            return {} as Json
        }
    }

    // Fallback for any other type
    return {} as Json
}

export class SessionMemory {
    private windowSize: number

    constructor(windowSize = DEFAULT_WINDOW_SIZE) {
        this.windowSize = windowSize
    }

    /**
     * Get recent messages from a conversation (sliding window)
     */
    async getRecentMessages(conversationId: string): Promise<ConversationMessage[]> {
        try {
            const result = await db
                .select()
                .from(messages)
                .where(eq(messages.conversationId, conversationId))
                .orderBy(desc(messages.createdAt))
                .limit(this.windowSize)

            // Validate and filter messages by role
            const validMessages: ConversationMessage[] = []
            for (const msg of result) {
                // Skip if role is not in valid set or content is missing
                if (!isValidMessageRole(msg.role) || !msg.content) {
                    console.warn(`[SessionMemory] Skipping message with invalid role or missing content:`, {
                        conversationId,
                        role: msg.role,
                        createdAt: msg.createdAt
                    })
                    continue
                }
                validMessages.push({
                    role: msg.role,
                    content: msg.content,
                    createdAt: msg.createdAt,
                })
            }

            return validMessages
        } catch (error) {
            console.error('[SessionMemory] Failed to fetch recent messages:', error)
            // Return empty array to allow graceful degradation
            return []
        }
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
        try {
            // Check if task is already completed to prevent duplicates
            const existing = await db
                .select()
                .from(completedTasks)
                .where(and(
                    eq(completedTasks.userId, userId),
                    eq(completedTasks.conversationId, conversationId),
                    eq(completedTasks.taskKey, taskKey)
                ))
                .limit(1)

            if (existing.length > 0) {
                console.log(`[SessionMemory] Task "${taskKey}" already completed, skipping duplicate`)
                return
            }

            await db.insert(completedTasks).values({
                userId,
                conversationId,
                taskKey,
                taskType,
                pillar,
                metadata: safeJsonify(metadata || {}),
            })
        } catch (error) {
            console.error('[SessionMemory] Failed to mark task as completed:', error)
            // Re-throw to allow caller to handle critical failures
            throw new Error(`Failed to mark task completed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Store a persistent fact in agent memory
     */
    async storeMemory(
        userId: string,
        key: string,
        value: any,
        category: string = 'general',
        conversationId?: string
    ): Promise<void> {
        try {
            // Check if a record with this userId and key already exists
            const existing = await db
                .select()
                .from(agentMemory)
                .where(and(eq(agentMemory.userId, userId), eq(agentMemory.key, key)))
                .limit(1)

            const safeValue = safeJsonify(value)

            if (existing.length > 0) {
                // Update existing record with new value and timestamp
                await db.update(agentMemory)
                    .set({
                        value: safeValue,
                        category,
                        conversationId,
                        updatedAt: new Date()
                    })
                    .where(eq(agentMemory.id, existing[0].id))
            } else {
                // Insert new memory record
                await db.insert(agentMemory).values({
                    userId,
                    key,
                    value: safeValue,
                    category,
                    conversationId,
                })
            }
        } catch (error) {
            console.error('[SessionMemory] Failed to store memory:', error)
            // Re-throw to allow caller to handle critical failures
            throw new Error(`Failed to store memory: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    /**
     * Retrieve a persistent fact from agent memory
     */
    async getMemory(userId: string, key: string): Promise<any | null> {
        const result = await db
            .select()
            .from(agentMemory)
            .where(and(eq(agentMemory.userId, userId), eq(agentMemory.key, key)))
            .limit(1)

        return result.length > 0 ? result[0].value : null
    }

    /**
     * Retrieve all memories for a user, optionally filtered by category
     */
    async getAllMemories(userId: string, category?: string): Promise<Record<string, any>> {
        const conditions = [eq(agentMemory.userId, userId)]
        if (category) {
            conditions.push(eq(agentMemory.category, category))
        }

        const result = await db
            .select()
            .from(agentMemory)
            .where(and(...conditions))

        const memoryMap: Record<string, any> = {}
        result.forEach(row => {
            memoryMap[row.key] = row.value
        })
        return memoryMap
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
            if (msg.role !== 'user' || !msg.content) continue

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
