-- Cancellation policies
CREATE TYPE cancellation_policy AS ENUM ('flexible', 'moderate', 'strict');
ALTER TABLE properties ADD COLUMN IF NOT EXISTS cancellation_policy cancellation_policy DEFAULT 'moderate';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS instant_book BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS min_nights INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS max_nights INTEGER DEFAULT 365;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS preparation_days INTEGER DEFAULT 0;

-- Favorites / Wishlist
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL USING (user_id = auth.uid());

-- Booking modifications tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_check_in DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_check_out DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
