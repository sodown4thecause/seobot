-- Framework Policies and Constraints Migration
-- Adds RLS policies for global and custom frameworks
-- Adds unique constraint for global framework upserts
-- Adds category and tags columns for framework classification

-- Add missing columns to writing_frameworks table
ALTER TABLE writing_frameworks 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add index on category for filtering
CREATE INDEX IF NOT EXISTS idx_frameworks_category ON writing_frameworks(category);

-- Ensure RLS is enabled (should already be from initial migration)
ALTER TABLE writing_frameworks ENABLE ROW LEVEL SECURITY;

-- Create unique constraint for global frameworks (prevents duplicates on seed)
-- Allows same framework name if different category or if custom (user_id not null)
CREATE UNIQUE INDEX IF NOT EXISTS ux_frameworks_global_name 
ON writing_frameworks (lower(name), category) 
WHERE user_id IS NULL;

-- ============================================================================
-- POLICIES FOR GLOBAL FRAMEWORKS (is_custom = false or null)
-- ============================================================================

-- Allow all authenticated users to view global frameworks
CREATE POLICY "Anyone can view global frameworks"
ON writing_frameworks FOR SELECT
TO authenticated
USING (is_custom = false OR is_custom IS NULL);

-- Only service role can manage (insert/update/delete) global frameworks
-- This prevents regular users from modifying the core framework library
CREATE POLICY "Service role can manage global frameworks"
ON writing_frameworks FOR ALL
TO service_role
USING (is_custom = false OR is_custom IS NULL)
WITH CHECK (is_custom = false OR is_custom IS NULL);

-- ============================================================================
-- POLICIES FOR CUSTOM FRAMEWORKS (is_custom = true)
-- ============================================================================

-- Users can view their own custom frameworks
CREATE POLICY "Users can view own custom frameworks"
ON writing_frameworks FOR SELECT
TO authenticated
USING (is_custom = true AND auth.uid() = user_id);

-- Users can create their own custom frameworks
CREATE POLICY "Users can create custom frameworks"
ON writing_frameworks FOR INSERT
TO authenticated
WITH CHECK (is_custom = true AND auth.uid() = user_id);

-- Users can update their own custom frameworks
CREATE POLICY "Users can update own custom frameworks"
ON writing_frameworks FOR UPDATE
TO authenticated
USING (is_custom = true AND auth.uid() = user_id)
WITH CHECK (is_custom = true AND auth.uid() = user_id);

-- Users can delete their own custom frameworks
CREATE POLICY "Users can delete own custom frameworks"
ON writing_frameworks FOR DELETE
TO authenticated
USING (is_custom = true AND auth.uid() = user_id);

-- ============================================================================
-- HELPER FUNCTION: Get framework by name (case-insensitive)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_framework_by_name(framework_name TEXT, framework_category TEXT DEFAULT NULL)
RETURNS SETOF writing_frameworks
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM writing_frameworks
  WHERE lower(name) = lower(framework_name)
    AND (framework_category IS NULL OR category = framework_category)
    AND (is_custom = false OR is_custom IS NULL)
  LIMIT 1;
$$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON POLICY "Anyone can view global frameworks" ON writing_frameworks IS
'All authenticated users can view the global framework library (is_custom=false)';

COMMENT ON POLICY "Service role can manage global frameworks" ON writing_frameworks IS
'Only service role (used by seed scripts) can create/update/delete global frameworks';

COMMENT ON POLICY "Users can view own custom frameworks" ON writing_frameworks IS
'Users can only see custom frameworks they created themselves';

COMMENT ON POLICY "Users can create custom frameworks" ON writing_frameworks IS
'Users can create their own custom frameworks for personal use';

COMMENT ON INDEX ux_frameworks_global_name IS
'Ensures unique framework names within each category for global frameworks only';

COMMENT ON FUNCTION get_framework_by_name IS
'Helper function to retrieve framework by name (case-insensitive) and optional category';
