-- Chat Context Preservation Migration
-- Creates table for preserving context across conversations

-- Chat Contexts Table
CREATE TABLE IF NOT EXISTS chat_contexts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  context_key text NOT NULL, -- e.g., 'current_workflow', 'last_analysis', 'business_context'
  context_type text NOT NULL, -- 'workflow', 'analysis', 'business', 'preference'
  context_data jsonb NOT NULL DEFAULT '{}', -- The actual context data
  expires_at timestamp with time zone, -- Optional expiration
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, context_key)
);

-- Chat Context History (for audit and recovery)
CREATE TABLE IF NOT EXISTS chat_context_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  context_key text NOT NULL,
  context_data jsonb NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'accessed')),
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_contexts_user_id ON chat_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_contexts_key ON chat_contexts(context_key);
CREATE INDEX IF NOT EXISTS idx_chat_contexts_type ON chat_contexts(context_type);
CREATE INDEX IF NOT EXISTS idx_chat_contexts_expires ON chat_contexts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_chat_context_history_user_key ON chat_context_history(user_id, context_key);
CREATE INDEX IF NOT EXISTS idx_chat_context_history_created ON chat_context_history(created_at DESC);

-- Row Level Security
ALTER TABLE chat_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_context_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own chat contexts" ON chat_contexts
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own context history" ON chat_context_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert context history" ON chat_context_history
  FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_chat_contexts_updated_at 
  BEFORE UPDATE ON chat_contexts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to log context changes
CREATE OR REPLACE FUNCTION log_chat_context_change() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO chat_context_history (user_id, context_key, context_data, action)
    VALUES (NEW.user_id, NEW.context_key, NEW.context_data, 'created');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO chat_context_history (user_id, context_key, context_data, action)
    VALUES (NEW.user_id, NEW.context_key, NEW.context_data, 'updated');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO chat_context_history (user_id, context_key, context_data, action)
    VALUES (OLD.user_id, OLD.context_key, OLD.context_data, 'deleted');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_chat_context_changes
  AFTER INSERT OR UPDATE OR DELETE ON chat_contexts
  FOR EACH ROW EXECUTE FUNCTION log_chat_context_change();

-- Function to get user context for a conversation
CREATE OR REPLACE FUNCTION get_user_chat_context(
  p_user_id uuid,
  p_context_keys text[] DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  result jsonb := '{}';
  context_record record;
BEGIN
  -- Get all contexts or specific ones
  FOR context_record IN 
    SELECT context_key, context_data, context_type
    FROM chat_contexts
    WHERE user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > now())
      AND (p_context_keys IS NULL OR context_key = ANY(p_context_keys))
  LOOP
    result := result || jsonb_build_object(context_record.context_key, context_record.context_data);
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set user context
CREATE OR REPLACE FUNCTION set_user_chat_context(
  p_user_id uuid,
  p_context_key text,
  p_context_type text,
  p_context_data jsonb,
  p_expires_at timestamp with time zone DEFAULT NULL
) RETURNS void AS $$
BEGIN
  INSERT INTO chat_contexts (user_id, context_key, context_type, context_data, expires_at)
  VALUES (p_user_id, p_context_key, p_context_type, p_context_data, p_expires_at)
  ON CONFLICT (user_id, context_key)
  DO UPDATE SET
    context_data = EXCLUDED.context_data,
    context_type = EXCLUDED.context_type,
    expires_at = EXCLUDED.expires_at,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE chat_contexts IS 'Preserved chat context across conversations';
COMMENT ON TABLE chat_context_history IS 'History of context changes for audit';
COMMENT ON FUNCTION get_user_chat_context IS 'Retrieves user chat context for conversation';
COMMENT ON FUNCTION set_user_chat_context IS 'Sets or updates user chat context';

