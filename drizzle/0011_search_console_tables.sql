CREATE TABLE IF NOT EXISTS "search_console_connections" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL,
  "site_url" text NOT NULL,
  "site_name" text,
  "connected_at" timestamp DEFAULT now() NOT NULL,
  "last_sync_at" timestamp,
  "status" text DEFAULT 'active' NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS "idx_sc_connections_user" ON "search_console_connections" ("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_sc_connections_user_site" ON "search_console_connections" ("user_id", "site_url");

CREATE TABLE IF NOT EXISTS "search_console_snapshots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "connection_id" uuid REFERENCES "search_console_connections"("id"),
  "user_id" text NOT NULL,
  "site_url" text NOT NULL,
  "start_date" date,
  "end_date" date,
  "row_count" integer DEFAULT 0,
  "chunk_count" integer DEFAULT 0,
  "document_ids" jsonb DEFAULT '[]'::jsonb,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_sc_snapshots_user" ON "search_console_snapshots" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "idx_sc_snapshots_connection" ON "search_console_snapshots" ("connection_id");
