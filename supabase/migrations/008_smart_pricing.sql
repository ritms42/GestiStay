-- Smart pricing rules per property
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  -- Base price boundaries
  min_price DECIMAL(10, 2) NOT NULL,
  max_price DECIMAL(10, 2) NOT NULL,
  -- Weekend adjustment (Fri-Sat)
  weekend_uplift_percent DECIMAL(5, 2) DEFAULT 0,
  -- Last-minute discount (booking < N days before check-in)
  last_minute_days INTEGER DEFAULT 7,
  last_minute_discount_percent DECIMAL(5, 2) DEFAULT 0,
  -- Early bird discount (booking > N days before check-in)
  early_bird_days INTEGER DEFAULT 60,
  early_bird_discount_percent DECIMAL(5, 2) DEFAULT 0,
  -- Long stay discount (7+ and 28+ nights)
  weekly_discount_percent DECIMAL(5, 2) DEFAULT 0,
  monthly_discount_percent DECIMAL(5, 2) DEFAULT 0,
  -- Occupancy-based surge
  high_demand_threshold_percent DECIMAL(5, 2) DEFAULT 80,
  high_demand_uplift_percent DECIMAL(5, 2) DEFAULT 0,
  -- Gap night filler (isolated empty night between bookings)
  gap_night_discount_percent DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id)
);

CREATE TRIGGER pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts manage own pricing rules" ON pricing_rules FOR ALL USING (host_id = auth.uid());

-- Dynamic price calculation history (for analytics)
CREATE TABLE IF NOT EXISTS dynamic_price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  computed_price DECIMAL(10, 2) NOT NULL,
  factors JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dph_property_date ON dynamic_price_history(property_id, date);
ALTER TABLE dynamic_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hosts view own price history" ON dynamic_price_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM properties WHERE properties.id = dynamic_price_history.property_id AND properties.host_id = auth.uid())
);
