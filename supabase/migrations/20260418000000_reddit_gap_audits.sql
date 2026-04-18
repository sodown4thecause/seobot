-- Reddit Gap Auditor tables
-- Stores audit results and event tracking for the Reddit-to-Content Gap lead magnet
-- Compatible with Neon PostgreSQL (no Supabase RLS)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS reddit_gap_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  url TEXT,
  discovered_subreddits JSONB,
  thread_count INTEGER DEFAULT 0,
  content_gaps JSONB,
  scorecard JSONB,
  overall_gap_score INTEGER,
  total_questions_found INTEGER DEFAULT 0,
  analysis_confidence REAL,
  report JSONB,
  source TEXT DEFAULT 'reddit_gap_landing',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reddit_gap_audits_email ON reddit_gap_audits (email);
CREATE INDEX IF NOT EXISTS idx_reddit_gap_audits_topic ON reddit_gap_audits (topic);
CREATE INDEX IF NOT EXISTS idx_reddit_gap_audits_created ON reddit_gap_audits (created_at);

CREATE TABLE IF NOT EXISTS reddit_gap_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  topic TEXT,
  email TEXT,
  overall_gap_score INTEGER,
  properties JSONB DEFAULT '{}',
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reddit_gap_events_session ON reddit_gap_events (session_id);
CREATE INDEX IF NOT EXISTS idx_reddit_gap_events_type ON reddit_gap_events (event_type);
CREATE INDEX IF NOT EXISTS idx_reddit_gap_events_created ON reddit_gap_events (created_at);