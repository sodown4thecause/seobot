-- Conversations, Library, and Archive System
-- Migration for persistent chat conversations with library and archive functionality

-- Conversations Table (replaces simple chat_messages)
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  agent_type text NOT NULL DEFAULT 'general', -- 'seo_manager', 'marketing_manager', 'article_writer', 'general'
  title text NOT NULL DEFAULT 'New Conversation', -- Auto-generated from first message or user-defined
  status text DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata jsonb DEFAULT '{}', -- {tags, summary, key_topics}
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  archived_at timestamp with time zone,
  last_message_at timestamp with time zone DEFAULT now()
);

-- Messages Table (linked to conversations)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}', -- {tool_calls, usage, performance, components}
  created_at timestamp with time zone DEFAULT now()
);

-- Library Items Table (saved responses, images, data)
CREATE TABLE IF NOT EXISTS library_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  item_type text NOT NULL CHECK (item_type IN ('response', 'image', 'data', 'component')),
  title text NOT NULL,
  content text, -- For text responses
  data jsonb, -- For structured data (keyword metrics, SERP data, etc.)
  image_url text, -- For images
  tags text[] DEFAULT '{}',
  metadata jsonb DEFAULT '{}', -- {agent_type, tool_used, export_formats}
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_status ON conversations(user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(user_id, last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_agent_type ON conversations(user_id, agent_type, status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_library_items_user ON library_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_items_type ON library_items(user_id, item_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_items_conversation ON library_items(conversation_id);

-- Row Level Security (RLS) Policies
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in their conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages in their conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Library items policies
CREATE POLICY "Users can view their own library items"
  ON library_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own library items"
  ON library_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own library items"
  ON library_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own library items"
  ON library_items FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update conversation's last_message_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_at = NEW.created_at,
      updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update conversation timestamp when message is added
CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Function to auto-generate conversation title from first message
-- This runs AFTER INSERT on messages, not on conversation creation
CREATE OR REPLACE FUNCTION generate_conversation_title_from_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_title text;
  message_count int;
BEGIN
  -- Only update title if this is the first user message
  SELECT COUNT(*) INTO message_count
  FROM messages
  WHERE conversation_id = NEW.conversation_id AND role = 'user';

  IF message_count = 1 AND NEW.role = 'user' THEN
    -- Generate title from first user message
    SELECT SUBSTRING(NEW.content, 1, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END
    INTO conv_title;

    -- Update conversation title
    UPDATE conversations
    SET title = conv_title
    WHERE id = NEW.conversation_id AND (title IS NULL OR title = '' OR title = 'New Conversation');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate title from first message
CREATE TRIGGER set_conversation_title_from_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION generate_conversation_title_from_message();

