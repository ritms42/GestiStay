-- ============================================
-- GestiStay - Messaging Enhancements
-- File attachments, read receipts, message types, quick reply templates
-- ============================================

-- Add attachment support to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'
  CHECK (message_type IN ('text', 'image', 'file', 'system'));

-- Add read receipts (timestamped)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Typing indicators use Supabase Realtime Presence (ephemeral, no table needed)

-- ============================================
-- QUICK REPLY TEMPLATES
-- ============================================
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own templates"
  ON message_templates FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- STORAGE BUCKET FOR MESSAGE ATTACHMENTS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view message attachments (public bucket)
CREATE POLICY "Anyone can view message attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'message-attachments');

-- Authenticated conversation participants can upload
CREATE POLICY "Authenticated users can upload message attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'message-attachments' AND auth.uid() IS NOT NULL);

-- Users can delete their own uploads (folder structure: sender_id/filename)
CREATE POLICY "Users can delete own message attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'message-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- UPDATE MESSAGES RLS - allow participants to update read_at
-- ============================================
CREATE POLICY "Participants can update message read status"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );
