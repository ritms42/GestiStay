-- ============================================
-- GestiStay - Initial Database Schema
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE user_role AS ENUM ('guest', 'host', 'admin');
CREATE TYPE subscription_status AS ENUM ('none', 'trial', 'active', 'past_due', 'canceled');
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'villa', 'studio', 'room', 'other');
CREATE TYPE property_status AS ENUM ('draft', 'published', 'paused', 'archived');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'canceled', 'completed');
CREATE TYPE availability_status AS ENUM ('available', 'blocked', 'booked');

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role DEFAULT 'guest',
  stripe_customer_id TEXT,
  subscription_status subscription_status DEFAULT 'none',
  subscription_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PROPERTIES
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  property_type property_type DEFAULT 'apartment',
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  max_guests INTEGER DEFAULT 1,
  bedrooms INTEGER DEFAULT 0,
  beds INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  amenities TEXT[] DEFAULT '{}',
  house_rules TEXT,
  check_in_time TIME,
  check_out_time TIME,
  status property_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_properties_host ON properties(host_id);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);

-- ============================================
-- PROPERTY IMAGES
-- ============================================
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  is_cover BOOLEAN DEFAULT false
);

CREATE INDEX idx_property_images_property ON property_images(property_id);

-- ============================================
-- PRICING
-- ============================================
CREATE TABLE pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE UNIQUE,
  base_price DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR'
);

-- ============================================
-- SEASONAL PRICING
-- ============================================
CREATE TABLE seasonal_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_per_night DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_seasonal_pricing_property ON seasonal_pricing(property_id);
CREATE INDEX idx_seasonal_pricing_dates ON seasonal_pricing(start_date, end_date);

-- ============================================
-- BOOKINGS
-- ============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests_count INTEGER DEFAULT 1,
  total_price DECIMAL(10, 2) NOT NULL,
  cleaning_fee DECIMAL(10, 2) DEFAULT 0,
  status booking_status DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_bookings_property ON bookings(property_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_host ON bookings(host_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================
-- AVAILABILITY
-- ============================================
CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status availability_status DEFAULT 'available',
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  UNIQUE(property_id, date)
);

CREATE INDEX idx_availability_property_date ON availability(property_id, date);

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable"
  ON profiles FOR SELECT
  USING (true);

-- Properties
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published properties are viewable by everyone"
  ON properties FOR SELECT
  USING (status = 'published' OR host_id = auth.uid());

CREATE POLICY "Hosts can insert own properties"
  ON properties FOR INSERT
  WITH CHECK (host_id = auth.uid());

CREATE POLICY "Hosts can update own properties"
  ON properties FOR UPDATE
  USING (host_id = auth.uid());

CREATE POLICY "Hosts can delete own properties"
  ON properties FOR DELETE
  USING (host_id = auth.uid());

-- Property Images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Property images are viewable with property"
  ON property_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND (properties.status = 'published' OR properties.host_id = auth.uid())
  ));

CREATE POLICY "Hosts can manage own property images"
  ON property_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.host_id = auth.uid()
  ));

-- Pricing
ALTER TABLE pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pricing viewable with published property"
  ON pricing FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = pricing.property_id
    AND (properties.status = 'published' OR properties.host_id = auth.uid())
  ));

CREATE POLICY "Hosts can manage own pricing"
  ON pricing FOR ALL
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = pricing.property_id
    AND properties.host_id = auth.uid()
  ));

-- Seasonal Pricing
ALTER TABLE seasonal_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seasonal pricing viewable with property"
  ON seasonal_pricing FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = seasonal_pricing.property_id
    AND (properties.status = 'published' OR properties.host_id = auth.uid())
  ));

CREATE POLICY "Hosts can manage own seasonal pricing"
  ON seasonal_pricing FOR ALL
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = seasonal_pricing.property_id
    AND properties.host_id = auth.uid()
  ));

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (guest_id = auth.uid() OR host_id = auth.uid());

CREATE POLICY "Guests can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (guest_id = auth.uid());

CREATE POLICY "Booking participants can update"
  ON bookings FOR UPDATE
  USING (guest_id = auth.uid() OR host_id = auth.uid());

-- Availability
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability is viewable for published properties"
  ON availability FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = availability.property_id
    AND (properties.status = 'published' OR properties.host_id = auth.uid())
  ));

CREATE POLICY "Hosts can manage own availability"
  ON availability FOR ALL
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = availability.property_id
    AND properties.host_id = auth.uid()
  ));

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = conversations.id
    AND conversation_participants.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Conversation Participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view"
  ON conversation_participants FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM conversation_participants cp
    WHERE cp.conversation_id = conversation_participants.conversation_id
    AND cp.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated can insert"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages"
  ON messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_participants.conversation_id = messages.conversation_id
    AND conversation_participants.user_id = auth.uid()
  ));

CREATE POLICY "Participants can send messages"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKET FOR PROPERTY IMAGES
-- ============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'property-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own property images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
