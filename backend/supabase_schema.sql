-- =================================================================================================
-- M-TRAVEL SUPABASE DATABASE SCHEMA
-- Target: https://xbldmaifdqiakqfjrvei.supabase.co
-- Official Contact Info:
-- Email: safari@jambo.africa
-- Contact Person: Amos (0722374535)
-- Office: 0207855558
-- WhatsApp: 0791888840
-- =================================================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DROP EXISTING TABLES IF ANY
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

DROP TYPE IF EXISTS "TransactionType" CASCADE;
CREATE TYPE "TransactionType" AS ENUM (
  'TOPUP',
  'MPESA_TOPUP',
  'WITHDRAWAL',
  'BOOKING_PAYOUT',
  'REFUND',
  'COMMISSION'
);

DROP TYPE IF EXISTS "TransactionStatus" CASCADE;
CREATE TYPE "TransactionStatus" AS ENUM (
  'PENDING',
  'COMPLETED',
  'FAILED'
);

DROP TYPE IF EXISTS "PaymentProvider" CASCADE;
CREATE TYPE "PaymentProvider" AS ENUM (
  'MPESA',
  'STRIPE',
  'PAYPAL',
  'WALLET'
);

DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
CREATE TYPE "PaymentStatus" AS ENUM (
  'PENDING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED'
);

DROP TYPE IF EXISTS "BookingStatus" CASCADE;
CREATE TYPE "BookingStatus" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

DROP TYPE IF EXISTS "BookableType" CASCADE;
CREATE TYPE "BookableType" AS ENUM (
  'VEHICLE',
  'BUS_SEAT',
  'TOUR',
  'HOLIDAY_HOME'
);

DROP TYPE IF EXISTS "SupportTicketStatus" CASCADE;
CREATE TYPE "SupportTicketStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED'
);

DROP TYPE IF EXISTS "NotificationChannel" CASCADE;
CREATE TYPE "NotificationChannel" AS ENUM (
  'PUSH',
  'SMS',
  'EMAIL',
  'IN_APP'
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
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. ROW LEVEL SECURITY (RLS) & POLICIES
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Vehicles" ON vehicles;
CREATE POLICY "Public Read Vehicles" ON vehicles FOR SELECT USING (true);

ALTER TABLE vehicle_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Vehicle Images" ON vehicle_images;
CREATE POLICY "Public Read Vehicle Images" ON vehicle_images FOR SELECT USING (true);

ALTER TABLE vehicle_availability ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Vehicle Availability" ON vehicle_availability;
CREATE POLICY "Public Read Vehicle Availability" ON vehicle_availability FOR SELECT USING (true);

ALTER TABLE bus_companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Bus Companies" ON bus_companies;
CREATE POLICY "Public Read Bus Companies" ON bus_companies FOR SELECT USING (true);

ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Buses" ON buses;
CREATE POLICY "Public Read Buses" ON buses FOR SELECT USING (true);

ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Routes" ON routes;
CREATE POLICY "Public Read Routes" ON routes FOR SELECT USING (true);

ALTER TABLE tour_operator_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Tour Operators" ON tour_operator_profiles;
CREATE POLICY "Public Read Tour Operators" ON tour_operator_profiles FOR SELECT USING (true);

ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Tours" ON tours;
CREATE POLICY "Public Read Tours" ON tours FOR SELECT USING (true);

ALTER TABLE holiday_homes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Holiday Homes" ON holiday_homes;
CREATE POLICY "Public Read Holiday Homes" ON holiday_homes FOR SELECT USING (true);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Reviews" ON reviews;
CREATE POLICY "Public Read Reviews" ON reviews FOR SELECT USING (true);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Read Active Coupons" ON coupons;
CREATE POLICY "Public Read Active Coupons" ON coupons FOR SELECT USING (is_active = true);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Public Read Users" ON users;
CREATE POLICY "Allow Public Read Users" ON users FOR SELECT USING (true);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow Public Read Bookings" ON bookings;
CREATE POLICY "Allow Public Read Bookings" ON bookings FOR SELECT USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_logins ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =================================================================================================
-- INITIAL SEED DATA
-- Primary Admin Contact: Amos (safari@jambo.africa / 0722374535)
-- =================================================================================================

INSERT INTO users (id, email, phone, password_hash, first_name, last_name, role) VALUES
('a0000000-0000-0000-0000-000000000001', 'safari@jambo.africa', '0722374535', '$2a$12$FcgCkt0j41e9vnp7pXSzzeGGZ.VPoec/vZ1N3Xxt1RLU4LC6UDt4u', 'Amos', 'M-TRAVEL', 'ADMIN'),
('a0000000-0000-0000-0000-000000000002', 'james.mwangi@mtravel.co.ke', '0712345678', '$2a$12$popjt7TXu8/i0Q.wTg34C.6Wzx26cj9t1hPMfco6oVmc9M0s5SCf.', 'James', 'Mwangi', 'VEHICLE_OWNER'),
('a0000000-0000-0000-0000-000000000003', 'sarah.ochieng@gmail.com', '0723456789', '$2a$12$YYIumgDr0LzGLS2Y2RhA3Oavdcd1yemS2BLyug7A1YzwAAJDf1Bgy', 'Sarah', 'Ochieng', 'TOURIST');

-- SEED VEHICLES
INSERT INTO vehicles (id, owner_id, type, make, model, year, seats, fuel_type, transmission, price_per_day, has_insurance, latitude, longitude, address, rating_average, rating_count) VALUES
('00000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'SUV', 'Toyota', 'Land Cruiser Prado', 2022, 7, 'DIESEL', 'AUTOMATIC', 14000.00, true, -1.2921, 36.8219, 'Westlands, Nairobi', 4.9, 87),
('00000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'SUV', 'Toyota', 'RAV4', 2023, 5, 'PETROL', 'AUTOMATIC', 9500.00, true, -1.3000, 36.8100, 'Karen, Nairobi', 4.8, 52),
('00000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'VAN', 'Toyota', 'Hiace (Safari Van)', 2021, 9, 'DIESEL', 'MANUAL', 11500.00, true, -1.2833, 36.8167, 'Kilimani, Nairobi', 4.7, 134),
('00000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000002', 'CAR', 'Toyota', 'Premio', 2022, 5, 'PETROL', 'AUTOMATIC', 5500.00, false, -1.2700, 36.8300, 'Upperhill, Nairobi', 4.6, 41);

-- SEED VEHICLE IMAGES
INSERT INTO vehicle_images (vehicle_id, url, is_primary) VALUES
('00000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80', true),
('00000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', true),
('00000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957-0135ef1b58bf?auto=format&fit=crop&w=800&q=80', true),
('00000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&q=80', true);

-- SEED WALLETS
INSERT INTO wallets (user_id, balance) VALUES
('a0000000-0000-0000-0000-000000000001', 500000.00),
('a0000000-0000-0000-0000-000000000002', 342000.00),
('a0000000-0000-0000-0000-000000000003', 45000.00);