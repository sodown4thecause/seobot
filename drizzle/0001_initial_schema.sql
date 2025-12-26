-- Neon PostgreSQL Schema Migration
-- Generated from Drizzle schema for FlowIntent
-- Run this in Neon SQL Editor to create all tables

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Core Business Tables
CREATE TABLE IF NOT EXISTS "business_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"website_url" text NOT NULL,
	"industry" text,
	"locations" jsonb,
	"goals" jsonb,
	"content_frequency" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "brand_voices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tone" text NOT NULL,
	"style" text NOT NULL,
	"personality" jsonb,
	"sample_phrases" text[],
	"embedding" vector(1536),
	"source" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "competitors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"domain" text NOT NULL,
	"domain_authority" integer,
	"monthly_traffic" integer,
	"priority" text DEFAULT 'medium' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "keywords" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"keyword" text NOT NULL,
	"search_volume" integer,
	"keyword_difficulty" integer,
	"current_ranking" integer,
	"intent" text,
	"priority" text DEFAULT 'medium' NOT NULL,
	"metadata" jsonb,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content_type" text NOT NULL,
	"target_keyword" text,
	"word_count" integer,
	"seo_score" integer,
	"status" text DEFAULT 'draft' NOT NULL,
	"published_url" text,
	"published_at" timestamp,
	"cms_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Chat & Conversations
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"agent_type" text DEFAULT 'general' NOT NULL,
	"title" text DEFAULT 'New Conversation' NOT NULL,
	"status" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"last_message_at" timestamp
);

CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL REFERENCES "conversations"("id") ON DELETE CASCADE,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" uuid REFERENCES "conversations"("id"),
	"message_id" uuid,
	"item_type" text NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"data" jsonb,
	"image_url" text,
	"tags" text[],
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- User Mode & Progress
CREATE TABLE IF NOT EXISTS "user_mode_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL UNIQUE,
	"current_mode" text DEFAULT 'beginner' NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"customizations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"onboarding_completed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_mode_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"from_mode" text,
	"to_mode" text NOT NULL,
	"transition_reason" text,
	"requirements_met" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"item_key" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- RAG / Embeddings
CREATE TABLE IF NOT EXISTS "writing_frameworks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"structure" jsonb,
	"examples" text,
	"category" text NOT NULL,
	"metadata" jsonb,
	"embedding" vector(1536),
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_business_profiles_user_id" ON "business_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_conversations_user_id" ON "conversations"("user_id");
CREATE INDEX IF NOT EXISTS "idx_messages_conversation_id" ON "messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_keywords_user_id" ON "keywords"("user_id");
CREATE INDEX IF NOT EXISTS "idx_content_user_id" ON "content"("user_id");

-- Vector search function for RAG
CREATE OR REPLACE FUNCTION match_frameworks(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  structure jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wf.id,
    wf.name,
    wf.structure,
    1 - (wf.embedding <=> query_embedding) AS similarity
  FROM writing_frameworks wf
  WHERE wf.embedding IS NOT NULL
    AND 1 - (wf.embedding <=> query_embedding) > match_threshold
  ORDER BY wf.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
