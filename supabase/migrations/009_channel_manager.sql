-- External channel connections (Airbnb, Booking, etc.)
CREATE TYPE channel_type AS ENUM ('airbnb', 'booking', 'vrbo', 'other');
CREATE TYPE sync_status AS ENUM ('pending', 'syncing', 'success', 'error');

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type channel_type NOT NULL,
  name TEXT NOT NULL,
  -- Import: we fetch this iCal URL from the external platform
  ical_import_url TEXT,
  -- Export: our iCal URL that the external platform pulls from
  ical_export_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  last_import_at TIMESTAMPTZ,
  last_import_status sync_status DEFAULT 'pending',
  last_import_error TEXT,
  last_import_events_count INTEGER DEFAULT 0,
  auto_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER channels_updated_at
  BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_channels_property ON channels(property_id);
CREATE INDEX idx_channels_export_token ON channels(ical_export_token);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts manage own channels" ON channels FOR ALL USING (host_id = auth.uid());

-- Imported external bookings (from other platforms)
CREATE TABLE external_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  external_uid TEXT NOT NULL,
  summary TEXT,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(channel_id, external_uid)
);

CREATE INDEX idx_external_bookings_property ON external_bookings(property_id);
CREATE INDEX idx_external_bookings_dates ON external_bookings(check_in, check_out);

ALTER TABLE external_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts view own external bookings" ON external_bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM channels WHERE channels.id = external_bookings.channel_id AND channels.host_id = auth.uid())
);

-- Add external_booking_id reference in availability so we can track source
ALTER TABLE availability ADD COLUMN IF NOT EXISTS external_booking_id UUID REFERENCES external_bookings(id) ON DELETE SET NULL;
