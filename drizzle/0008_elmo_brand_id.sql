-- Link FlowIntent business profiles to Elmo brand IDs for GEO tracking provisioning
ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS elmo_brand_id text;

CREATE INDEX IF NOT EXISTS idx_business_profiles_elmo_brand_id
  ON business_profiles (elmo_brand_id)
  WHERE elmo_brand_id IS NOT NULL;
