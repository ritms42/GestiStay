CREATE TABLE auto_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('pre_arrival', 'check_in_day', 'post_checkout')),
  days_offset INTEGER DEFAULT 0,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER auto_messages_updated_at
  BEFORE UPDATE ON auto_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE auto_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts manage own auto messages" ON auto_messages FOR ALL USING (host_id = auth.uid());
