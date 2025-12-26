/**
 * Database Queries - Drizzle ORM helpers
 * 
 * Provides common database operations using Drizzle ORM
 * Replaces Supabase client patterns
 */

import { db } from './index'
import {
    businessProfiles,
    brandVoices,
    competitors,
    keywords,
    content,
    conversations,
    messages,
    libraryItems,
    userModeConfigs,
    userModeTransitions,
    userProgress,
    writingFrameworks,
    type BusinessProfile,
    type BrandVoice,
    type Conversation,
    type Message,
    type UserModeConfig,
    type UserProgress,
    type Json,
} from './schema'
import { eq, and, desc, asc, sql } from 'drizzle-orm'

// ============================================================================
// BUSINESS PROFILES
// ============================================================================

export async function getBusinessProfile(userId: string): Promise<BusinessProfile | null> {
    const [profile] = await db
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.userId, userId))
        .limit(1)
    return profile ?? null
}

export async function upsertBusinessProfile(
    userId: string,
    data: Partial<Omit<BusinessProfile, 'id' | 'userId' | 'createdAt'>>
) {
    const existing = await getBusinessProfile(userId)

    if (existing) {
        const [updated] = await db
            .update(businessProfiles)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(businessProfiles.userId, userId))
            .returning()
        return updated
    } else {
        const [created] = await db
            .insert(businessProfiles)
            .values({ userId, websiteUrl: data.websiteUrl || '', ...data })
            .returning()
        return created
    }
}

// ============================================================================
// BRAND VOICES
// ============================================================================

export async function getBrandVoice(userId: string): Promise<BrandVoice | null> {
    const [voice] = await db
        .select()
        .from(brandVoices)
        .where(eq(brandVoices.userId, userId))
        .limit(1)
    return voice ?? null
}

export async function upsertBrandVoice(
    userId: string,
    data: Partial<Omit<BrandVoice, 'id' | 'userId' | 'createdAt'>>
) {
    const existing = await getBrandVoice(userId)

    if (existing) {
        const [updated] = await db
            .update(brandVoices)
            .set(data)
            .where(eq(brandVoices.userId, userId))
            .returning()
        return updated
    } else {
        const [created] = await db
            .insert(brandVoices)
            .values({
                userId,
                tone: data.tone || '',
                style: data.style || '',
                source: data.source || 'manual',
                ...data
            })
            .returning()
        return created
    }
}

// ============================================================================
// CONVERSATIONS
// ============================================================================

export async function getConversation(id: string): Promise<Conversation | null> {
    const [conv] = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, id))
        .limit(1)
    return conv ?? null
}

export async function getConversationsForUser(userId: string, limit = 50): Promise<Conversation[]> {
    return db
        .select()
        .from(conversations)
        .where(eq(conversations.userId, userId))
        .orderBy(desc(conversations.updatedAt))
        .limit(limit)
}

export async function createConversation(
    userId: string,
    agentType = 'general',
    title = 'New Conversation'
): Promise<Conversation> {
    const [conv] = await db
        .insert(conversations)
        .values({ userId, agentType, title, status: 'active' })
        .returning()
    return conv
}

export async function updateConversation(
    id: string,
    data: Partial<Omit<Conversation, 'id' | 'createdAt'>>
) {
    const [updated] = await db
        .update(conversations)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(conversations.id, id))
        .returning()
    return updated
}

// ============================================================================
// MESSAGES
// ============================================================================

export async function getMessagesForConversation(
    conversationId: string
): Promise<Message[]> {
    return db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conversationId))
        .orderBy(asc(messages.createdAt))
}

export async function createMessage(
    conversationId: string,
    role: string,
    content: string,
    metadata?: Record<string, unknown>
): Promise<Message> {
    const [msg] = await db
        .insert(messages)
        .values({ conversationId, role, content, metadata: metadata as Json })
        .returning()
    return msg
}

// ============================================================================
// USER MODE CONFIGS
// ============================================================================

export async function getUserModeConfig(userId: string): Promise<UserModeConfig | null> {
    const [config] = await db
        .select()
        .from(userModeConfigs)
        .where(eq(userModeConfigs.userId, userId))
        .limit(1)
    return config ?? null
}

export async function upsertUserModeConfig(
    userId: string,
    data: Partial<Omit<UserModeConfig, 'id' | 'userId' | 'createdAt'>>
) {
    const existing = await getUserModeConfig(userId)

    if (existing) {
        const [updated] = await db
            .update(userModeConfigs)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(userModeConfigs.userId, userId))
            .returning()
        return updated
    } else {
        const [created] = await db
            .insert(userModeConfigs)
            .values({ userId, ...data })
            .returning()
        return created
    }
}

// ============================================================================
// USER PROGRESS
// ============================================================================

export async function getUserProgress(
    userId: string,
    category?: string
): Promise<UserProgress[]> {
    if (category) {
        return db
            .select()
            .from(userProgress)
            .where(and(
                eq(userProgress.userId, userId),
                eq(userProgress.category, category)
            ))
    }
    return db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
}

export async function addUserProgress(
    userId: string,
    category: string,
    itemKey: string,
    metadata?: Record<string, unknown>
): Promise<UserProgress> {
    const [progress] = await db
        .insert(userProgress)
        .values({ userId, category, itemKey, metadata: (metadata || {}) as Json })
        .returning()
    return progress
}

// ============================================================================
// LIBRARY ITEMS
// ============================================================================

export async function saveLibraryItem(
    userId: string,
    itemType: string,
    title: string,
    data: {
        content?: string
        data?: Record<string, unknown>
        imageUrl?: string
        conversationId?: string
        messageId?: string
        tags?: string[]
        metadata?: Record<string, unknown>
    }
) {
    const [item] = await db
        .insert(libraryItems)
        .values({
            userId,
            itemType,
            title,
            content: data.content,
            data: data.data as Json,
            imageUrl: data.imageUrl,
            conversationId: data.conversationId,
            messageId: data.messageId,
            tags: data.tags,
            metadata: data.metadata as Json,
        })
        .returning()
    return item
}

export async function getLibraryItems(userId: string, itemType?: string) {
    if (itemType) {
        return db
            .select()
            .from(libraryItems)
            .where(and(
                eq(libraryItems.userId, userId),
                eq(libraryItems.itemType, itemType)
            ))
            .orderBy(desc(libraryItems.createdAt))
    }
    return db
        .select()
        .from(libraryItems)
        .where(eq(libraryItems.userId, userId))
        .orderBy(desc(libraryItems.createdAt))
}

// ============================================================================
// KEYWORDS
// ============================================================================

export async function getKeywordsForUser(userId: string) {
    return db
        .select()
        .from(keywords)
        .where(eq(keywords.userId, userId))
        .orderBy(desc(keywords.updatedAt))
}

export async function saveKeyword(
    userId: string,
    keyword: string,
    data: {
        searchVolume?: number
        keywordDifficulty?: number
        currentRanking?: number
        intent?: string
        priority?: string
        metadata?: Record<string, unknown>
    }
) {
    const [kw] = await db
        .insert(keywords)
        .values({ userId, keyword, ...data, metadata: data.metadata as Json })
        .returning()
    return kw
}

// ============================================================================
// COMPETITORS
// ============================================================================

export async function getCompetitorsForUser(userId: string) {
    return db
        .select()
        .from(competitors)
        .where(eq(competitors.userId, userId))
        .orderBy(desc(competitors.updatedAt))
}

export async function saveCompetitor(
    userId: string,
    domain: string,
    data: {
        domainAuthority?: number
        monthlyTraffic?: number
        priority?: string
        metadata?: Record<string, unknown>
    }
) {
    const [comp] = await db
        .insert(competitors)
        .values({ userId, domain, ...data, metadata: data.metadata as Json })
        .returning()
    return comp
}
