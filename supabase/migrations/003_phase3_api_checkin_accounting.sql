-- ============================================
-- GestiStay - Phase 3: API, Check-in, Accounting
-- ============================================

-- ============================================
-- API KEYS (pour l'API publique)
-- ============================================
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{read}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user ON api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own API keys"
  ON api_keys FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- CHECK-IN EN LIGNE
-- ============================================
CREATE TYPE checkin_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status checkin_status DEFAULT 'pending',
  -- Guest identity
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  id_type TEXT, -- passport, id_card, driver_license
  id_number TEXT,
  id_expiry DATE,
  id_document_url TEXT,
  -- Additional guests
  additional_guests JSONB DEFAULT '[]',
  -- Arrival info
  estimated_arrival TIME,
  special_requests TEXT,
  -- Contract
  contract_signed BOOLEAN DEFAULT false,
  contract_signed_at TIMESTAMPTZ,
  signature_url TEXT,
  -- Access info (sent after approval)
  access_instructions TEXT,
  door_code TEXT,
  wifi_name TEXT,
  wifi_password TEXT,
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER checkins_updated_at
  BEFORE UPDATE ON checkins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_checkins_booking ON checkins(booking_id);
CREATE INDEX idx_checkins_guest ON checkins(guest_id);
CREATE INDEX idx_checkins_host ON checkins(host_id);
CREATE INDEX idx_checkins_status ON checkins(status);

ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guests can view and update own checkins"
  ON checkins FOR ALL
  USING (guest_id = auth.uid());

CREATE POLICY "Hosts can view and manage checkins for their properties"
  ON checkins FOR ALL
  USING (host_id = auth.uid());

-- ============================================
-- INVOICES (Factures)
-- ============================================
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'canceled');
CREATE TYPE invoice_type AS ENUM ('booking', 'subscription', 'credit_note');

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  type invoice_type DEFAULT 'booking',
  status invoice_status DEFAULT 'draft',
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  -- Parties
  issuer_name TEXT NOT NULL,
  issuer_address TEXT,
  issuer_tax_id TEXT,
  client_name TEXT NOT NULL,
  client_address TEXT,
  client_email TEXT,
  -- Details
  description TEXT,
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  -- Dates
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  -- PDF
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_invoices_user ON invoices(user_id);
CREATE INDEX idx_invoices_booking ON invoices(booking_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_date ON invoices(issue_date);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own invoices"
  ON invoices FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- FISCAL REPORTS (Récapitulatifs fiscaux)
-- ============================================
CREATE TABLE fiscal_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  -- Revenue summary
  total_revenue DECIMAL(12, 2) DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_nights INTEGER DEFAULT 0,
  average_nightly_rate DECIMAL(10, 2) DEFAULT 0,
  occupancy_rate DECIMAL(5, 2) DEFAULT 0,
  -- Expenses
  total_cleaning_fees DECIMAL(10, 2) DEFAULT 0,
  platform_fees DECIMAL(10, 2) DEFAULT 0,
  -- Per property breakdown
  property_breakdown JSONB DEFAULT '[]',
  -- Monthly breakdown
  monthly_breakdown JSONB DEFAULT '[]',
  -- Export
  pdf_url TEXT,
  csv_url TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

ALTER TABLE fiscal_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own fiscal reports"
  ON fiscal_reports FOR ALL
  USING (user_id = auth.uid());

-- ============================================
-- PROPERTY ACCESS INSTRUCTIONS
-- ============================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS access_instructions TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS door_code TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS wifi_password TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS checkin_form_enabled BOOLEAN DEFAULT true;

-- ============================================
-- INVOICE NUMBER SEQUENCE
-- ============================================
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'GS-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
