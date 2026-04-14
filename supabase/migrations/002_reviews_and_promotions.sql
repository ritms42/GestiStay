-- ============================================
-- GestiStay - Phase 2: Reviews & Promotions
-- ============================================

-- ============================================
-- REVIEWS & RATINGS
-- ============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  cleanliness INTEGER CHECK (cleanliness >= 1 AND cleanliness <= 5),
  communication INTEGER CHECK (communication >= 1 AND communication <= 5),
  location INTEGER CHECK (location >= 1 AND location <= 5),
  value INTEGER CHECK (value >= 1 AND value <= 5),
  comment TEXT,
  host_reply TEXT,
  host_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_reviews_property ON reviews(property_id);
CREATE INDEX idx_reviews_guest ON reviews(guest_id);
CREATE INDEX idx_reviews_rating ON reviews(property_id, rating);

-- Average rating view for properties
CREATE OR REPLACE VIEW property_ratings AS
SELECT
  property_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as avg_rating,
  ROUND(AVG(cleanliness)::numeric, 1) as avg_cleanliness,
  ROUND(AVG(communication)::numeric, 1) as avg_communication,
  ROUND(AVG(location)::numeric, 1) as avg_location,
  ROUND(AVG(value)::numeric, 1) as avg_value
FROM reviews
GROUP BY property_id;

-- RLS for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Guests can create reviews for their completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    guest_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.guest_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

CREATE POLICY "Guests can update their own reviews"
  ON reviews FOR UPDATE
  USING (guest_id = auth.uid());

CREATE POLICY "Hosts can reply to reviews on their properties"
  ON reviews FOR UPDATE
  USING (host_id = auth.uid());

-- ============================================
-- PROMOTIONS / DISCOUNTS
-- ============================================
CREATE TYPE promotion_type AS ENUM ('percentage', 'fixed', 'early_bird', 'last_minute', 'weekly', 'monthly');

CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type promotion_type NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10, 2) NOT NULL,
  min_nights INTEGER DEFAULT 1,
  max_nights INTEGER,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  max_usage INTEGER,
  promo_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER promotions_updated_at
  BEFORE UPDATE ON promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_promotions_property ON promotions(property_id);
CREATE INDEX idx_promotions_active ON promotions(is_active, start_date, end_date);
CREATE INDEX idx_promotions_code ON promotions(promo_code) WHERE promo_code IS NOT NULL;

-- RLS for promotions
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active promotions are viewable by everyone"
  ON promotions FOR SELECT
  USING (is_active = true OR host_id = auth.uid());

CREATE POLICY "Hosts can manage own promotions"
  ON promotions FOR ALL
  USING (host_id = auth.uid());

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TYPE notification_type AS ENUM (
  'booking_new', 'booking_confirmed', 'booking_canceled',
  'review_new', 'review_reply',
  'message_new',
  'payment_received',
  'promotion_expiring'
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN DEFAULT false,
  email_sent BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================
-- ADD RATING COLUMNS TO BOOKINGS FOR TRACKING
-- ============================================
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reviewed BOOLEAN DEFAULT false;
