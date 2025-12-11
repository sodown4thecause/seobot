-- Beta Mode Guardrails Migration
-- Adds pause functionality and IP blocking for beta users

-- Add pause columns to user_usage_limits table
ALTER TABLE public.user_usage_limits
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pause_reason TEXT,
ADD COLUMN IF NOT EXISTS pause_until TIMESTAMP WITH TIME ZONE;

-- Create blocked_ips table
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on ip_address for fast lookups
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip_address ON public.blocked_ips(ip_address);

-- Enable RLS on blocked_ips
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all blocked IPs
CREATE POLICY "Service role can manage all blocked_ips" ON public.blocked_ips
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can read blocked_ips (for checking their own IP)
CREATE POLICY "Authenticated users can read blocked_ips" ON public.blocked_ips
  FOR SELECT
  USING (true);

-- Update default monthly limit to $1 for beta (only for new users)
-- Existing users keep their current limits
-- This is handled in application code, not migration

