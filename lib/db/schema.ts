/**
 * Drizzle ORM Schema for Neon PostgreSQL
 * 
 * Migrated from Supabase - all 13 tables with pgvector support
 */

import { pgTable, text, timestamp, jsonb, integer, real, uuid, vector, boolean, primaryKey } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ============================================================================
// TYPES
// ============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ============================================================================
// CORE BUSINESS TABLES
// ============================================================================

/**
 * Business Profiles - User business information from onboarding
 */
export const businessProfiles = pgTable('business_profiles', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(), // Stack Auth user ID
    websiteUrl: text('website_url').notNull(),
    industry: text('industry'),
    locations: jsonb('locations').$type<Json>(),
    goals: jsonb('goals').$type<Json>(),
    contentFrequency: text('content_frequency'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Brand Voices - Writing style/tone with embeddings
 */
export const brandVoices = pgTable('brand_voices', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    tone: text('tone').notNull(),
    style: text('style').notNull(),
    personality: jsonb('personality').$type<Json>(),
    samplePhrases: text('sample_phrases').array(),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI embeddings
    source: text('source').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * Competitors - Tracked competitor domains
 */
export const competitors = pgTable('competitors', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    domain: text('domain').notNull(),
    domainAuthority: integer('domain_authority'),
    monthlyTraffic: integer('monthly_traffic'),
    priority: text('priority').default('medium').notNull(),
    metadata: jsonb('metadata').$type<Json>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Keywords - Target keywords with metrics
 */
export const keywords = pgTable('keywords', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    keyword: text('keyword').notNull(),
    searchVolume: integer('search_volume'),
    keywordDifficulty: integer('keyword_difficulty'),
    currentRanking: integer('current_ranking'),
    intent: text('intent'),
    priority: text('priority').default('medium').notNull(),
    metadata: jsonb('metadata').$type<Json>(),
    status: text('status').default('active').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Content - Generated content pieces
 */
export const content = pgTable('content', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    contentType: text('content_type').notNull(),
    targetKeyword: text('target_keyword'),
    wordCount: integer('word_count'),
    seoScore: integer('seo_score'),
    status: text('status').default('draft').notNull(),
    publishedUrl: text('published_url'),
    publishedAt: timestamp('published_at'),
    cmsId: text('cms_id'),
    metadata: jsonb('metadata').$type<Json>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================================
// CHAT & CONVERSATIONS
// ============================================================================

/**
 * Conversations - Chat conversation metadata
 */
export const conversations = pgTable('conversations', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    agentType: text('agent_type').default('general').notNull(),
    title: text('title').default('New Conversation').notNull(),
    status: text('status'),
    metadata: jsonb('metadata').$type<Json>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    archivedAt: timestamp('archived_at'),
    lastMessageAt: timestamp('last_message_at'),
})

/**
 * Messages - Individual chat messages
 */
export const messages = pgTable('messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'user' | 'assistant' | 'system'
    content: text('content').notNull(),
    metadata: jsonb('metadata').$type<Json>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * Chat Messages - Legacy chat messages (keeping for backwards compatibility)
 */
export const chatMessages = pgTable('chat_messages', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    role: text('role').notNull(),
    content: text('content').notNull(),
    metadata: jsonb('metadata').$type<Json>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * Library Items - Saved content items
 */
export const libraryItems = pgTable('library_items', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
    messageId: uuid('message_id'),
    itemType: text('item_type').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    data: jsonb('data').$type<Json>(),
    imageUrl: text('image_url'),
    tags: text('tags').array(),
    metadata: jsonb('metadata').$type<Json>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================================
// USER MODE & PROGRESS
// ============================================================================

/**
 * User Mode Configs - User experience mode settings
 */
export const userModeConfigs = pgTable('user_mode_configs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().unique(),
    currentMode: text('current_mode').default('beginner').notNull(),
    preferences: jsonb('preferences').$type<Json>().default({}).notNull(),
    customizations: jsonb('customizations').$type<Json>().default({}).notNull(),
    onboardingCompleted: jsonb('onboarding_completed').$type<Json>().default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * User Mode Transitions - Mode change history
 */
export const userModeTransitions = pgTable('user_mode_transitions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    fromMode: text('from_mode'),
    toMode: text('to_mode').notNull(),
    transitionReason: text('transition_reason'),
    requirementsMet: jsonb('requirements_met').$type<Json>().default({}).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

/**
 * User Progress - Learning milestones
 */
export const userProgress = pgTable('user_progress', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull(),
    category: text('category').notNull(),
    itemKey: text('item_key').notNull(),
    completedAt: timestamp('completed_at').defaultNow().notNull(),
    metadata: jsonb('metadata').$type<Json>().default({}).notNull(),
})

// ============================================================================
// RAG / EMBEDDINGS
// ============================================================================

/**
 * Writing Frameworks - RAG knowledge base with vector embeddings
 */
export const writingFrameworks = pgTable('writing_frameworks', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    structure: jsonb('structure').$type<Json>(),
    examples: text('examples'),
    category: text('category').notNull(),
    metadata: jsonb('metadata').$type<Json>(),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI embeddings
    usageCount: integer('usage_count').default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Agent Documents - RAG knowledge base for AI agents
 * Contains uploaded PDFs, research documents, and expert knowledge
 */
export const agentDocuments = pgTable('agent_documents', {
    id: uuid('id').primaryKey().defaultRandom(),
    agentType: text('agent_type').notNull().default('general'),
    title: text('title').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }), // OpenAI embeddings
    sourceType: text('source_type').default('pdf'),
    metadata: jsonb('metadata').$type<Json>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

/**
 * Content Learnings - Cross-user learning from content generation
 * Stores successful patterns and techniques
 */
export const contentLearnings = pgTable('content_learnings', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id'),
    contentType: text('content_type').notNull(),
    topic: text('topic').notNull(),
    keywords: text('keywords').array(),
    aiDetectionScore: real('ai_detection_score'),
    humanProbability: real('human_probability'),
    successful: boolean('successful').default(false),
    techniquesUsed: text('techniques_used').array(),
    feedback: text('feedback'),
    contentSample: text('content_sample'),
    embedding: vector('embedding', { dimensions: 1536 }),
    metadata: jsonb('metadata').$type<Json>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type BusinessProfile = typeof businessProfiles.$inferSelect
export type NewBusinessProfile = typeof businessProfiles.$inferInsert

export type BrandVoice = typeof brandVoices.$inferSelect
export type NewBrandVoice = typeof brandVoices.$inferInsert

export type Competitor = typeof competitors.$inferSelect
export type NewCompetitor = typeof competitors.$inferInsert

export type Keyword = typeof keywords.$inferSelect
export type NewKeyword = typeof keywords.$inferInsert

export type Content = typeof content.$inferSelect
export type NewContent = typeof content.$inferInsert

export type Conversation = typeof conversations.$inferSelect
export type NewConversation = typeof conversations.$inferInsert

export type Message = typeof messages.$inferSelect
export type NewMessage = typeof messages.$inferInsert

export type ChatMessage = typeof chatMessages.$inferSelect
export type NewChatMessage = typeof chatMessages.$inferInsert

export type LibraryItem = typeof libraryItems.$inferSelect
export type NewLibraryItem = typeof libraryItems.$inferInsert

export type UserModeConfig = typeof userModeConfigs.$inferSelect
export type NewUserModeConfig = typeof userModeConfigs.$inferInsert

export type UserModeTransition = typeof userModeTransitions.$inferSelect
export type NewUserModeTransition = typeof userModeTransitions.$inferInsert

export type UserProgress = typeof userProgress.$inferSelect
export type NewUserProgress = typeof userProgress.$inferInsert

export type WritingFramework = typeof writingFrameworks.$inferSelect
export type NewWritingFramework = typeof writingFrameworks.$inferInsert

export type AgentDocument = typeof agentDocuments.$inferSelect
export type NewAgentDocument = typeof agentDocuments.$inferInsert

export type ContentLearning = typeof contentLearnings.$inferSelect
export type NewContentLearning = typeof contentLearnings.$inferInsert
