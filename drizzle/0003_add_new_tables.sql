-- Add new tables for AI usage tracking, user limits, roadmap progress, and completed tasks
CREATE TABLE "ai_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"conversation_id" uuid,
	"message_id" uuid,
	"agent_type" text,
	"model" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0,
	"completion_tokens" integer DEFAULT 0,
	"tool_calls" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_usage_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"monthly_credit_limit_usd" real DEFAULT 1.0 NOT NULL,
	"is_unlimited" boolean DEFAULT false NOT NULL,
	"is_paused" boolean DEFAULT false NOT NULL,
	"paused_at" timestamp,
	"pause_reason" text,
	"pause_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_usage_limits_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_roadmap_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL UNIQUE,
	"discovery_progress" integer DEFAULT 0 NOT NULL,
	"discovery_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"gap_analysis_progress" integer DEFAULT 0 NOT NULL,
	"gap_analysis_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"strategy_progress" integer DEFAULT 0 NOT NULL,
	"strategy_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"production_progress" integer DEFAULT 0 NOT NULL,
	"production_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"current_pillar" text DEFAULT 'discovery' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "completed_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" uuid,
	"task_type" text NOT NULL,
	"task_key" text NOT NULL,
	"pillar" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "completed_tasks" ADD CONSTRAINT "completed_tasks_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
