-- Backfill costs for existing ai_usage_events
-- This migration calculates and updates cost_usd for events that don't have it

-- Function to calculate cost based on model and tokens
CREATE OR REPLACE FUNCTION calculate_cost_usd(
  p_model TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER,
  p_metadata JSONB
) RETURNS NUMERIC AS $$
DECLARE
  v_provider TEXT;
  v_cost NUMERIC := 0;
  v_input_cost NUMERIC;
  v_output_cost NUMERIC;
BEGIN
  -- Determine provider from model
  IF p_model LIKE '%gemini%' OR p_model LIKE 'google/%' THEN
    v_provider := 'google';
  ELSIF p_model LIKE '%gpt%' OR p_model LIKE 'openai/%' THEN
    v_provider := 'openai';
  ELSIF p_model LIKE '%claude%' OR p_model LIKE 'anthropic/%' THEN
    v_provider := 'anthropic';
  ELSE
    v_provider := 'vercel_gateway';
  END IF;

  -- Calculate cost based on model
  IF v_provider = 'google' THEN
    -- Gemini models: 0.000075 per 1K input, 0.0003 per 1K output
    v_input_cost := (p_prompt_tokens::NUMERIC / 1000) * 0.000075;
    v_output_cost := (p_completion_tokens::NUMERIC / 1000) * 0.0003;
    v_cost := v_input_cost + v_output_cost;
  ELSIF v_provider = 'openai' THEN
    IF p_model LIKE '%gpt-4-turbo%' THEN
      -- GPT-4 Turbo: 0.01 per 1K input, 0.03 per 1K output
      v_input_cost := (p_prompt_tokens::NUMERIC / 1000) * 0.01;
      v_output_cost := (p_completion_tokens::NUMERIC / 1000) * 0.03;
    ELSIF p_model LIKE '%gpt-4o-mini%' THEN
      -- GPT-4o Mini: 0.00015 per 1K input, 0.0006 per 1K output
      v_input_cost := (p_prompt_tokens::NUMERIC / 1000) * 0.00015;
      v_output_cost := (p_completion_tokens::NUMERIC / 1000) * 0.0006;
    ELSIF p_model LIKE '%gpt-4o%' THEN
      -- GPT-4o: 0.0025 per 1K input, 0.01 per 1K output
      v_input_cost := (p_prompt_tokens::NUMERIC / 1000) * 0.0025;
      v_output_cost := (p_completion_tokens::NUMERIC / 1000) * 0.01;
    ELSE
      -- Default OpenAI: 0.00015 per 1K input, 0.0006 per 1K output
      v_input_cost := (p_prompt_tokens::NUMERIC / 1000) * 0.00015;
      v_output_cost := (p_completion_tokens::NUMERIC / 1000) * 0.0006;
    END IF;
    v_cost := v_input_cost + v_output_cost;
  ELSIF v_provider = 'anthropic' THEN
    -- Claude models: 0.003 per 1K input, 0.015 per 1K output (default)
    v_input_cost := (p_prompt_tokens::NUMERIC / 1000) * 0.003;
    v_output_cost := (p_completion_tokens::NUMERIC / 1000) * 0.015;
    v_cost := v_input_cost + v_output_cost;
  ELSE
    -- Default: conservative estimate
    v_cost := (p_prompt_tokens::NUMERIC / 1000) * 0.001 + (p_completion_tokens::NUMERIC / 1000) * 0.002;
  END IF;

  RETURN COALESCE(v_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- Update all events without cost_usd
UPDATE ai_usage_events
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'::jsonb),
  '{cost_usd}',
  to_jsonb(calculate_cost_usd(model, prompt_tokens, completion_tokens, metadata))
)
WHERE metadata->>'cost_usd' IS NULL 
   OR metadata->>'cost_usd' = '';

-- Also set provider if missing
UPDATE ai_usage_events
SET metadata = jsonb_set(
  metadata,
  '{provider}',
  CASE
    WHEN model LIKE '%gemini%' OR model LIKE 'google/%' THEN '"google"'::jsonb
    WHEN model LIKE '%gpt%' OR model LIKE 'openai/%' THEN '"openai"'::jsonb
    WHEN model LIKE '%claude%' OR model LIKE 'anthropic/%' THEN '"anthropic"'::jsonb
    ELSE '"vercel_gateway"'::jsonb
  END
)
WHERE metadata->>'provider' IS NULL 
   OR metadata->>'provider' = '';

-- Drop the temporary function
DROP FUNCTION calculate_cost_usd(TEXT, INTEGER, INTEGER, JSONB);

