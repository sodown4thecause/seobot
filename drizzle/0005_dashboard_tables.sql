CREATE TABLE "agent_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"conversation_id" text,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_id" uuid,
	"provider" text NOT NULL,
	"endpoint" text NOT NULL,
	"method" text,
	"cost_usd" real,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"website_url" text NOT NULL,
	"data_type" text NOT NULL,
	"data" jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"freshness" text DEFAULT 'fresh' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"progress" integer DEFAULT 0,
	"metadata" jsonb,
	"started_at" timestamp,
	"completed_at" timestamp,
	"error_message" text,
	"estimated_cost" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" text NOT NULL,
	"email" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	"subscription_status" text DEFAULT 'inactive',
	"polar_customer_id" text,
	"polar_subscription_id" text,
	"current_period_end" timestamp,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "api_usage_events" ALTER COLUMN "metadata" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ALTER COLUMN "discovery_metadata" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ALTER COLUMN "gap_analysis_metadata" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ALTER COLUMN "strategy_metadata" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ALTER COLUMN "production_metadata" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "completed_tasks" ALTER COLUMN "metadata" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "user_key_idx" ON "agent_memory" USING btree ("user_id","key");--> statement-breakpoint
CREATE INDEX "idx_api_usage_user_created" ON "api_usage_events" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_api_usage_provider_endpoint" ON "api_usage_events" USING btree ("provider","endpoint");--> statement-breakpoint
CREATE INDEX "idx_api_usage_job_id" ON "api_usage_events" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_dashboard_data_user_type_fresh" ON "dashboard_data" USING btree ("user_id","data_type","freshness");--> statement-breakpoint
CREATE INDEX "idx_dashboard_data_last_updated" ON "dashboard_data" USING btree ("last_updated");--> statement-breakpoint
CREATE INDEX "idx_dashboard_data_user_id" ON "dashboard_data" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_job_history_job_id" ON "job_history" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "idx_job_history_user_created" ON "job_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_refresh_jobs_user_status" ON "refresh_jobs" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_refresh_jobs_started_at" ON "refresh_jobs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "idx_refresh_jobs_status" ON "refresh_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_polar_sub_id" ON "users" USING btree ("polar_subscription_id");--> statement-breakpoint
ALTER TABLE "user_roadmap_progress" ADD CONSTRAINT "user_roadmap_progress_user_id_unique" UNIQUE("user_id");
