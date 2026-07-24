ALTER TABLE "geo_runs"
  ADD COLUMN IF NOT EXISTS "fix_cycle_id" uuid;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "geo_fix_cycles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" text NOT NULL,
  "geo_prompt_id" uuid,
  "brand" text NOT NULL,
  "query" text NOT NULL,
  "engines" text[] NOT NULL,
  "baseline_run_ids" uuid[] NOT NULL,
  "fix_plan" jsonb,
  "fix_type" text,
  "shipped_url" text,
  "shipped_at" timestamp,
  "status" text DEFAULT 'scanning' NOT NULL,
  "verify_schedule" text DEFAULT 'every_3_days' NOT NULL,
  "next_verify_at" timestamp,
  "last_verified_at" timestamp,
  "latest_delta" jsonb,
  "share_token" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "geo_fix_cycles_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "geo_fix_cycles"
    ADD CONSTRAINT "geo_fix_cycles_geo_prompt_id_geo_prompts_id_fk"
    FOREIGN KEY ("geo_prompt_id") REFERENCES "public"."geo_prompts"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "geo_runs"
    ADD CONSTRAINT "geo_runs_fix_cycle_id_geo_fix_cycles_id_fk"
    FOREIGN KEY ("fix_cycle_id") REFERENCES "public"."geo_fix_cycles"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_geo_fix_cycles_user_id"
  ON "geo_fix_cycles" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_geo_fix_cycles_status_next_verify"
  ON "geo_fix_cycles" USING btree ("status", "next_verify_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_geo_fix_cycles_prompt_id"
  ON "geo_fix_cycles" USING btree ("geo_prompt_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_geo_runs_fix_cycle_id"
  ON "geo_runs" USING btree ("fix_cycle_id");
