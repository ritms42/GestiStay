-- ============================================
-- GestiStay - Phase 4: Host Reviews & KYC
-- ============================================

-- ============================================
-- DOUBLE REVIEW SYSTEM (host can also review guests)
-- ============================================

-- Add reviewer_type to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_type TEXT DEFAULT 'guest' CHECK (reviewer_type IN ('guest', 'host'));

-- Remove the UNIQUE on booking_id to allow both guest and host to review
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_booking_id_key;

-- Add composite unique constraint: one review per booking per reviewer type
ALTER TABLE reviews ADD CONSTRAINT reviews_booking_reviewer_unique UNIQUE (booking_id, reviewer_type);

-- Index for looking up host reviews on a guest
CREATE INDEX IF NOT EXISTS idx_reviews_guest_host ON reviews(guest_id, reviewer_type) WHERE reviewer_type = 'host';

-- Update RLS: hosts can create reviews for their completed bookings
CREATE POLICY "Hosts can create reviews for their completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    host_id = auth.uid()
    AND reviewer_type = 'host'
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.host_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- Update property_ratings view to only count guest reviews
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
WHERE reviewer_type = 'guest'
GROUP BY property_id;

-- Guest ratings view (average from host reviews)
CREATE OR REPLACE VIEW guest_ratings AS
SELECT
  guest_id,
  COUNT(*) as review_count,
  ROUND(AVG(rating)::numeric, 1) as avg_rating
FROM reviews
WHERE reviewer_type = 'host'
GROUP BY guest_id;

-- ============================================
-- KYC VERIFICATION
-- ============================================
DO $$ BEGIN
  CREATE TYPE kyc_status AS ENUM ('none', 'pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status kyc_status DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_document_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_rejection_reason TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_rate INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS response_time TEXT;
