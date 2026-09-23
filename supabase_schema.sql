-- ==============================================================================
-- M-TRAVEL SUPABASE DATABASE SCHEMA
-- Target: https://xbldmaifdqiakqfjrvei.supabase.co
-- Official Contact Info:
-- Email: safari@jambo.africa
-- Contact Person: Amos (0722374535)
-- Office: 0207855558
-- WhatsApp: 0791888840
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DROP EXISTING TABLES IF ANY
DROP TABLE IF EXISTS trip_history CASCADE;
DROP TABLE IF EXISTS driver_live_locations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS holiday_homes CASCADE;
DROP TABLE IF EXISTS tours CASCADE;
DROP TABLE IF EXISTS tour_operator_profiles CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS bus_companies CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS vehicle_alerts CASCADE;
DROP TABLE IF EXISTS vehicle_availability CASCADE;
DROP TABLE IF EXISTS vehicle_images CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS device_logins CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. CREATE ENUMS
DROP TYPE IF EXISTS role_enum CASCADE;
CREATE TYPE role_enum AS ENUM (
  'TRAVELER',
  'TOURIST',
  'DRIVER',
  'VEHICLE_OWNER',
  'BUS_COMPANY',
  'TOUR_OPERATOR',
  'HOME_OWNER',
  'ADMIN',
  'SUPER_ADMIN'
);

DROP TYPE IF EXISTS vehicle_type_enum CASCADE;
CREATE TYPE vehicle_type_enum AS ENUM (
  'CAR',
  'SUV',
  'VAN',
  'PICKUP'
);

DROP TYPE IF EXISTS fuel_type_enum CASCADE;
CREATE TYPE fuel_type_enum AS ENUM (
  'PETROL',
  'DIESEL',
  'ELECTRIC',
  'HYBRID'
);

DROP TYPE IF EXISTS transmission_type_enum CASCADE;
CREATE TYPE transmission_type_enum AS ENUM (
  'MANUAL',
  'AUTOMATIC'
);

DROP TYPE IF EXISTS booking_status_enum CASCADE;
CREATE TYPE booking_status_enum AS ENUM (
  'PENDING',
  'ACCEPTED',
  'DRIVER_ASSIGNED',
  'DRIVER_ARRIVED',
  'REJECTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

DROP TYPE IF EXISTS bookable_type_enum CASCADE;
CREATE TYPE bookable_type_enum AS ENUM (
  'VEHICLE',
  'BUS_SEAT',
  'TOUR',
  'HOLIDAY_HOME'
);

-- 3. USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  role role_enum DEFAULT 'TOURIST',
  is_email_verified BOOLEAN DEFAULT true,
  is_phone_verified BOOLEAN DEFAULT true,
  is_two_factor_on BOOLEAN DEFAULT false,
  two_factor_secret TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REFRESH TOKENS & DEVICE LOGINS
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE device_logins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  location TEXT,
  logged_in_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. VEHICLES TABLE
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type vehicle_type_enum NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  seats INT NOT NULL,
  fuel_type fuel_type_enum NOT NULL,
  transmission transmission_type_enum NOT NULL,
  price_per_day DECIMAL(10,2) NOT NULL,
  price_per_km DECIMAL(10,2),
  plate_number TEXT UNIQUE,
  has_insurance BOOLEAN DEFAULT true,
  is_stolen BOOLEAN DEFAULT false,
  is_self_drive_available BOOLEAN DEFAULT true,
  is_with_driver_available BOOLEAN DEFAULT true,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  address TEXT,
  is_available BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT true,
  rating_average FLOAT DEFAULT 4.8,
  rating_count INT DEFAULT 12,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vehicle_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_blocked BOOLEAN DEFAULT false,
  UNIQUE(vehicle_id, date)
);

-- 6. BOOKINGS TABLE
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bookable_type bookable_type_enum DEFAULT 'VEHICLE',
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  pickup_method TEXT DEFAULT 'DRIVER_DELIVER', -- 'DRIVER_DELIVER' (Driver brings vehicle) or 'SELF_COLLECT' (Traveler goes to vehicle)
  pickup_lat FLOAT,
  pickup_lng FLOAT,
  destination_lat FLOAT,
  destination_lng FLOAT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  status booking_status_enum DEFAULT 'PENDING',
  qr_code TEXT,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6b. REAL-TIME DRIVER & VEHICLE GPS TELEMETRY
CREATE TABLE driver_live_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  speed FLOAT DEFAULT 0,
  heading FLOAT DEFAULT 0,
  accuracy FLOAT DEFAULT 5,
  status TEXT DEFAULT 'AVAILABLE',
  battery_level INT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(driver_id, trip_id)
);

-- 6c. COMPLETED TRIP ROUTE BREADCRUMBS & AUDIT
CREATE TABLE trip_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id TEXT NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  speed FLOAT DEFAULT 0,
  heading FLOAT DEFAULT 0,
  sequence_number INT NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PAYMENTS & WALLETS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  provider TEXT DEFAULT 'MPESA',
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'KES',
  status TEXT DEFAULT 'SUCCEEDED',
  provider_ref TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12,2) DEFAULT 10000.00,
  currency TEXT DEFAULT 'KES',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status TEXT DEFAULT 'COMPLETED',
  reference TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REVIEWS & SUPPORT TICKETS
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BUSES & ROUTES
CREATE TABLE bus_companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES bus_companies(id) ON DELETE CASCADE,
  plate_number TEXT UNIQUE NOT NULL,
  total_seats INT NOT NULL DEFAULT 49,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES bus_companies(id) ON DELETE CASCADE,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_at TIMESTAMPTZ NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TOURS & TRAVEL
CREATE TABLE tour_operator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  operator_id UUID REFERENCES tour_operator_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_days INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. HOLIDAY HOMES
CREATE TABLE holiday_homes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  county TEXT NOT NULL,
  bedrooms INT NOT NULL,
  guests INT NOT NULL,
  price_per_night DECIMAL(10,2) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  amenities TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. VEHICLE ALERTS
CREATE TABLE vehicle_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'STOLEN',
  description TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  is_resolved BOOLEAN DEFAULT false
);

-- 13. CROSS-CUTTING TABLES
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

DROP TYPE IF EXISTS notification_channel_enum CASCADE;
CREATE TYPE notification_channel_enum AS ENUM ('PUSH', 'SMS', 'EMAIL', 'IN_APP');

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  channel notification_channel_enum DEFAULT 'IN_APP',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_pct INT NOT NULL,
  max_redemptions INT,
  redeemed_count INT DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  actor_name TEXT,
  actor_role TEXT,
  details TEXT,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) & POLICIES (Full Access for System Operations)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Users Operations" ON users;
CREATE POLICY "Allow All Users Operations" ON users FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Vehicles Operations" ON vehicles;
CREATE POLICY "Allow All Vehicles Operations" ON vehicles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Vehicle Images Operations" ON vehicle_images;
CREATE POLICY "Allow All Vehicle Images Operations" ON vehicle_images FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vehicle_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Vehicle Availability Operations" ON vehicle_availability;
CREATE POLICY "Allow All Vehicle Availability Operations" ON vehicle_availability FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Bookings Operations" ON bookings;
CREATE POLICY "Allow All Bookings Operations" ON bookings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Reviews Operations" ON reviews;
CREATE POLICY "Allow All Reviews Operations" ON reviews FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Wallets Operations" ON wallets;
CREATE POLICY "Allow All Wallets Operations" ON wallets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Transactions Operations" ON transactions;
CREATE POLICY "Allow All Transactions Operations" ON transactions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Payments Operations" ON payments;
CREATE POLICY "Allow All Payments Operations" ON payments FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE driver_live_locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Driver Live Locations Operations" ON driver_live_locations;
CREATE POLICY "Allow All Driver Live Locations Operations" ON driver_live_locations FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE trip_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Trip History Operations" ON trip_history;
CREATE POLICY "Allow All Trip History Operations" ON trip_history FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE bus_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Bus Companies Operations" ON bus_companies;
CREATE POLICY "Allow All Bus Companies Operations" ON bus_companies FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Buses Operations" ON buses;
CREATE POLICY "Allow All Buses Operations" ON buses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Routes Operations" ON routes;
CREATE POLICY "Allow All Routes Operations" ON routes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tour_operator_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Tour Operators Operations" ON tour_operator_profiles;
CREATE POLICY "Allow All Tour Operators Operations" ON tour_operator_profiles FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Tours Operations" ON tours;
CREATE POLICY "Allow All Tours Operations" ON tours FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE holiday_homes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Holiday Homes Operations" ON holiday_homes;
CREATE POLICY "Allow All Holiday Homes Operations" ON holiday_homes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Coupons Operations" ON coupons;
CREATE POLICY "Allow All Coupons Operations" ON coupons FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Refresh Tokens Operations" ON refresh_tokens;
CREATE POLICY "Allow All Refresh Tokens Operations" ON refresh_tokens FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE device_logins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Device Logins Operations" ON device_logins;
CREATE POLICY "Allow All Device Logins Operations" ON device_logins FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE vehicle_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Vehicle Alerts Operations" ON vehicle_alerts;
CREATE POLICY "Allow All Vehicle Alerts Operations" ON vehicle_alerts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Support Tickets Operations" ON support_tickets;
CREATE POLICY "Allow All Support Tickets Operations" ON support_tickets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Notifications Operations" ON notifications;
CREATE POLICY "Allow All Notifications Operations" ON notifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Favorites Operations" ON favorites;
CREATE POLICY "Allow All Favorites Operations" ON favorites FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Audit Logs Operations" ON audit_logs;
CREATE POLICY "Allow All Audit Logs Operations" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA
-- Primary Admin Contact: Amos (safari@jambo.africa / 0722374535)
-- ==============================================================================

INSERT INTO users (id, email, phone, password_hash, first_name, last_name, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'safari@jambo.africa', '0722374535', '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u', 'Amos', 'M-TRAVEL', 'ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'james.mwangi@mtravel.co.ke', '0712345678', '$2a$12$popjt7TXu8/i0Q.wTg34C.6Wzx26cj9t1hPMfco6oVmc9M0s5SCf.', 'James', 'Mwangi', 'VEHICLE_OWNER'),
('a0000000-0000-0000-0000-000000000003', 'sarah.ochieng@gmail.com', '0723456789', '$2a$12$YYIumgDr0LzGLS2Y2RhA3Oavdcd1yemS2BLyug7A1YzwAAJDf1Bgy', 'Sarah', 'Ochieng', 'TOURIST'),
('a0000000-0000-0000-0000-000000000004', 'driver@mtravel.co.ke', '0799887766', '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u', 'Samuel', 'Omondi', 'DRIVER'),
('a0000000-0000-0000-0000-000000000005', 'driver.john@mtravel.co.ke', '0788776655', '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u', 'John', 'Gitau', 'DRIVER');

-- SEED VEHICLES
INSERT INTO vehicles (id, owner_id, type, make, model, year, seats, fuel_type, transmission, price_per_day, plate_number, has_insurance, latitude, longitude, address, rating_average, rating_count) VALUES
('22222222-2222-4222-8222-222222222222', 'a0000000-0000-0000-0000-000000000002', 'SUV', 'Jeep', 'Wrangler', 2013, 7, 'DIESEL', 'AUTOMATIC', 10000.00, 'KDC 313J', true, -1.0333, 37.0693, 'Thika, Cascade Parking', 5.0, 12),
('33333333-3333-4333-8333-333333333333', 'a0000000-0000-0000-0000-000000000002', 'SUV', 'Toyota', 'Prado 4x4', 2022, 4, 'DIESEL', 'AUTOMATIC', 15000.00, 'KDD 552P', true, -1.286389, 36.817223, 'Nairobi', 5.0, 12),
('44444444-4444-4444-8444-444444444444', 'a0000000-0000-0000-0000-000000000002', 'CAR', 'Toyota', 'Premio', 2021, 4, 'DIESEL', 'AUTOMATIC', 7000.00, 'KDC 449A', true, -1.0333, 37.0693, 'Thika', 5.0, 12),
('55555555-5555-4555-8555-555555555555', 'a0000000-0000-0000-0000-000000000002', 'SUV', 'Nissan', 'Patrol', 2019, 4, 'DIESEL', 'AUTOMATIC', 14000.00, 'KDA 911N', true, -1.286389, 36.817223, 'Nairobi', 5.0, 12),
('77777777-7777-4777-8777-777777777777', 'a0000000-0000-0000-0000-000000000002', 'VAN', 'Toyota', 'Coaster', 2020, 18, 'DIESEL', 'AUTOMATIC', 9500.00, 'KDC 200C', true, -1.0333, 37.0693, 'Thika', 5.0, 12),
('88888888-8888-4888-8888-888888888888', 'a0000000-0000-0000-0000-000000000002', 'SUV', 'Toyota', 'Land Cruiser Prado', 2021, 5, 'DIESEL', 'AUTOMATIC', 15000.00, 'KDE 505P', true, -1.3197, 36.836, 'Nairobi/JKIA', 5.0, 12);

-- SEED VEHICLE IMAGES
INSERT INTO vehicle_images (vehicle_id, url, is_primary) VALUES
('22222222-2222-4222-8222-222222222222', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1000&q=80', true),
('33333333-3333-4333-8333-333333333333', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80', true),
('44444444-4444-4444-8444-444444444444', 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1000&q=80', true),
('55555555-5555-4555-8555-555555555555', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80', true),
('77777777-7777-4777-8777-777777777777', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1000&q=80', true),
('88888888-8888-4888-8888-888888888888', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1000&q=80', true);

-- SEED WALLETS
INSERT INTO wallets (user_id, balance) VALUES
('a0000000-0000-0000-0000-000000000001', 500000.00),
('a0000000-0000-0000-0000-000000000002', 342000.00),
('a0000000-0000-0000-0000-000000000003', 45000.00),
('a0000000-0000-0000-0000-000000000004', 12500.00),
('a0000000-0000-0000-0000-000000000005', 8500.00);

-- SEED DRIVER LIVE TELEMETRY
INSERT INTO driver_live_locations (driver_id, trip_id, vehicle_id, latitude, longitude, speed, heading, accuracy, status) VALUES
('a0000000-0000-0000-0000-000000000004', 'TRIP-DEMO-01', 'b0000000-0000-0000-0000-000000000001', -1.2921, 36.8219, 45.0, 110.0, 5, 'AVAILABLE'),
('a0000000-0000-0000-0000-000000000005', 'TRIP-DEMO-02', 'b0000000-0000-0000-0000-000000000003', -1.2833, 36.8167, 52.0, 225.0, 6, 'DRIVING_TO_PICKUP');
