CREATE TABLE "agent_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_type" text DEFAULT 'general' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"source_type" text DEFAULT 'pdf',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"session_id" text NOT NULL,
	"brand_name" text,
	"url" text,
	"email" text,
	"score" integer,
	"grade" text,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"referrer" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"brand_name" text NOT NULL,
	"url" text NOT NULL,
	"score" integer,
	"grade" text,
	"report" jsonb,
	"source" text DEFAULT 'landing_page',
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blocked_ips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" text NOT NULL,
	"reason" text NOT NULL,
	"user_id" text,
	"blocked_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_ips_ip_address_unique" UNIQUE("ip_address")
);
--> statement-breakpoint
CREATE TABLE "brand_voices" (
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
--> statement-breakpoint
CREATE TABLE "business_profiles" (
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
--> statement-breakpoint
CREATE TABLE "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competitors" (
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
--> statement-breakpoint
CREATE TABLE "content" (
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
--> statement-breakpoint
CREATE TABLE "content_learnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"content_type" text NOT NULL,
	"topic" text NOT NULL,
	"keywords" text[],
	"ai_detection_score" real,
	"human_probability" real,
	"successful" boolean DEFAULT false,
	"techniques_used" text[],
	"feedback" text,
	"content_sample" text,
	"embedding" vector(1536),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"agent_type" text DEFAULT 'general' NOT NULL,
	"title" text DEFAULT 'New Conversation' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	"last_message_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "keywords" (
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
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" uuid,
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
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_mode_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"current_mode" text DEFAULT 'beginner' NOT NULL,
	"preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"customizations" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"onboarding_completed" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_mode_configs_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_mode_transitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"from_mode" text,
	"to_mode" text NOT NULL,
	"transition_reason" text,
	"requirements_met" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"category" text NOT NULL,
	"item_key" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	CONSTRAINT "user_progress_user_id_category_item_key_unique" UNIQUE("user_id", "category", "item_key")
);
--> statement-breakpoint
CREATE TABLE "writing_frameworks" (
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
--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;