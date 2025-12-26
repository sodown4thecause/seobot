-- Rename 'locations' column to 'location' in business_profiles table
-- This aligns the database schema with the input schema which uses 'location' (singular)

-- Rename the column
ALTER TABLE business_profiles
RENAME COLUMN locations TO location;

-- No index or constraint changes needed as this is just a column rename
-- The data type (JSONB) remains the same
