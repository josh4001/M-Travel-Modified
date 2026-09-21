-- =================================================================================================
-- M-TRAVEL TOUR & VEHICLE RENTAL LIFECYCLE & SECURITY SCHEMA MIGRATION
-- Supports:
-- 1. End-to-end rental lifecycle: Register -> Inspect -> Reserve -> Handover -> Active -> Return -> Settlement
-- 2. Level 1 & Level 2 Security (Possession Check-ins, Overdue tracking, Moment Geolocation, SOS Emergency, Incidents)
-- 3. Pre-rental Handover & Post-rental Inspection with damage accountability
-- 4. Audit logging and GPS-ready future compatibility
-- =================================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMS
-- ==========================================

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM (
        'TRAVELER', 'VEHICLE_OWNER', 'ADMIN', 'SUPER_ADMIN', 'FLEET_MANAGER', 'AGENT'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE owner_status_enum AS ENUM (
        'pending', 'under_review', 'verified', 'rejected', 'suspended'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE vehicle_status_enum AS ENUM (
        'pending_verification', 'available', 'reserved', 'ready_for_pickup',
        'active_rental', 'return_pending', 'returned', 'inspection', 'maintenance', 'suspended'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE document_type_enum AS ENUM (
        'logbook', 'insurance_commercial', 'ntsa_inspection', 'ownership_proof', 
        'host_id_copy', 'authorization_letter', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE document_status_enum AS ENUM (
        'pending', 'approved', 'rejected'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE photo_type_enum AS ENUM (
        'front', 'rear', 'left_side', 'right_side', 'interior', 
        'dashboard', 'boot', 'engine', 'damage_evidence', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE booking_lifecycle_status_enum AS ENUM (
        'requested', 'approved', 'reserved', 'handover_pending',
        'active', 'return_pending', 'returned', 'inspection',
        'completed', 'cancelled', 'disputed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE inspection_type_enum AS ENUM (
        'handover', 'return'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE settlement_status_enum AS ENUM (
        'pending', 'settled', 'disputed', 'waived'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE checkin_type_enum AS ENUM (
        'possession_affirmation', 'location_checkin', 'emergency_sos', 'routine'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE incident_type_enum AS ENUM (
        'accident', 'breakdown', 'flat_tyre', 'mechanical_failure',
        'lost_key', 'late_return', 'security_concern', 'police_stop', 'other'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE incident_severity_enum AS ENUM (
        'low', 'medium', 'high', 'critical'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE incident_status_enum AS ENUM (
        'reported', 'acknowledged', 'investigating', 'action_taken', 'resolved', 'closed'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_type_enum AS ENUM (
        'rental_charge', 'security_deposit', 'damage_fee', 'late_fee', 'fuel_surcharge', 'deposit_refund'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE payment_status_enum AS ENUM (
        'pending', 'completed', 'failed', 'refunded'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ==========================================
-- 2. CORE USERS & PROFILES
-- ==========================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum DEFAULT 'TRAVELER',
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. VEHICLE OWNERS (FLEET HOSTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_owners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    business_name VARCHAR(255),
    national_id_number VARCHAR(100),
    kra_pin VARCHAR(50),
    contact_phone VARCHAR(50) NOT NULL,
    emergency_contact VARCHAR(50),
    verification_status owner_status_enum DEFAULT 'pending',
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. VEHICLES
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE SET NULL,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    vehicle_type VARCHAR(50) DEFAULT 'CAR',
    seating_capacity INTEGER DEFAULT 5,
    transmission VARCHAR(50) DEFAULT 'AUTOMATIC',
    fuel_type VARCHAR(50) DEFAULT 'PETROL',
    daily_rate NUMERIC(12, 2) NOT NULL,
    security_deposit_amount NUMERIC(12, 2) DEFAULT 10000.00,
    is_self_drive BOOLEAN DEFAULT TRUE,
    is_chauffeur_driven BOOLEAN DEFAULT FALSE,
    status vehicle_status_enum DEFAULT 'pending_verification',
    gps_enabled BOOLEAN DEFAULT FALSE, -- Default false as hardware GPS is optional/deferred
    gps_device_id UUID DEFAULT NULL,
    current_odometer_km INTEGER DEFAULT 0,
    current_fuel_percent INTEGER DEFAULT 100,
    rejection_reasons TEXT[],
    rejection_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. VEHICLE DOCUMENTS
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    document_url TEXT NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    expiry_date DATE,
    verification_status document_status_enum DEFAULT 'pending',
    rejection_reason TEXT,
    verified_by UUID REFERENCES profiles(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. VEHICLE PHOTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type photo_type_enum DEFAULT 'other',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. TRAVELERS
-- ==========================================

CREATE TABLE IF NOT EXISTS travelers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    id_type VARCHAR(50) DEFAULT 'NATIONAL_ID',
    id_number VARCHAR(100),
    id_photo_url TEXT,
    driving_license_number VARCHAR(100),
    driving_license_expiry DATE,
    driving_license_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(50),
    account_status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. BOOKINGS
-- ==========================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference VARCHAR(50) UNIQUE NOT NULL,
    traveler_id UUID REFERENCES travelers(id) ON DELETE SET NULL,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    owner_id UUID REFERENCES vehicle_owners(id) ON DELETE SET NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    actual_return_date TIMESTAMPTZ,
    pickup_location TEXT NOT NULL,
    return_location TEXT NOT NULL,
    total_days INTEGER NOT NULL,
    daily_rate NUMERIC(12, 2) NOT NULL,
    total_rental_amount NUMERIC(12, 2) NOT NULL,
    security_deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    status booking_lifecycle_status_enum DEFAULT 'requested',
    digital_agreement_accepted BOOLEAN DEFAULT FALSE,
    digital_agreement_accepted_at TIMESTAMPTZ,
    traveler_name VARCHAR(255) NOT NULL,
    traveler_phone VARCHAR(50) NOT NULL,
    traveler_email VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. VEHICLE HANDOVERS (PRE-RENTAL)
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    handover_date TIMESTAMPTZ DEFAULT NOW(),
    odometer_reading INTEGER NOT NULL,
    fuel_level_percent INTEGER NOT NULL CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
    checklist_exterior_condition BOOLEAN DEFAULT TRUE,
    checklist_interior_condition BOOLEAN DEFAULT TRUE,
    checklist_spare_wheel BOOLEAN DEFAULT TRUE,
    checklist_tools_jack BOOLEAN DEFAULT TRUE,
    checklist_cleanliness BOOLEAN DEFAULT TRUE,
    existing_damage_notes TEXT,
    digital_agreement_signed BOOLEAN DEFAULT TRUE,
    traveler_signature_data TEXT,
    agency_agent_name VARCHAR(255) NOT NULL,
    traveler_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    agency_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 10. VEHICLE INSPECTIONS (HANDOVER & RETURN)
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    inspection_type inspection_type_enum NOT NULL, -- 'handover' or 'return'
    inspector_id UUID REFERENCES profiles(id),
    inspector_name VARCHAR(255) NOT NULL,
    inspection_date TIMESTAMPTZ DEFAULT NOW(),
    odometer_reading INTEGER NOT NULL,
    fuel_level_percent INTEGER NOT NULL CHECK (fuel_level_percent >= 0 AND fuel_level_percent <= 100),
    return_condition_status VARCHAR(50) DEFAULT 'clean',
    damage_found BOOLEAN DEFAULT FALSE,
    damage_description TEXT,
    fuel_difference_charge NUMERIC(12, 2) DEFAULT 0.00,
    damage_charge NUMERIC(12, 2) DEFAULT 0.00,
    late_return_charge NUMERIC(12, 2) DEFAULT 0.00,
    deposit_held NUMERIC(12, 2) NOT NULL DEFAULT 10000.00,
    deposit_deducted NUMERIC(12, 2) DEFAULT 0.00,
    deposit_refunded NUMERIC(12, 2) DEFAULT 10000.00,
    settlement_status settlement_status_enum DEFAULT 'pending',
    settlement_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 11. INSPECTION PHOTOS
-- ==========================================

CREATE TABLE IF NOT EXISTS inspection_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inspection_id UUID REFERENCES vehicle_inspections(id) ON DELETE CASCADE,
    handover_id UUID REFERENCES vehicle_handovers(id) ON DELETE SET NULL,
    photo_url TEXT NOT NULL,
    photo_type photo_type_enum DEFAULT 'other',
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 12. TRIP CHECKINS (LEVEL 1 & 2 SECURITY)
-- ==========================================

CREATE TABLE IF NOT EXISTS trip_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    traveler_id UUID REFERENCES travelers(id) ON DELETE SET NULL,
    checkin_type checkin_type_enum DEFAULT 'possession_affirmation',
    checkin_timestamp TIMESTAMPTZ DEFAULT NOW(),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    accuracy_meters NUMERIC(8, 2),
    location_name TEXT,
    traveler_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 13. INCIDENTS (LEVEL 2 SECURITY)
-- ==========================================

CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    traveler_id UUID REFERENCES travelers(id) ON DELETE SET NULL,
    incident_type incident_type_enum NOT NULL,
    severity incident_severity_enum DEFAULT 'medium',
    description TEXT NOT NULL,
    incident_timestamp TIMESTAMPTZ DEFAULT NOW(),
    location_description TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    photo_urls TEXT[],
    emergency_contact_called BOOLEAN DEFAULT FALSE,
    status incident_status_enum DEFAULT 'reported',
    resolution_notes TEXT,
    resolved_by UUID REFERENCES profiles(id),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- ==========================================
-- 14. PAYMENTS & DEPOSITS
-- ==========================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    traveler_id UUID REFERENCES travelers(id) ON DELETE SET NULL,
    payment_type payment_type_enum NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KES',
    mpesa_receipt_number VARCHAR(100),
    payment_method VARCHAR(50) DEFAULT 'MPESA',
    payment_status payment_status_enum DEFAULT 'completed',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 15. AUDIT LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id UUID,
    actor_name VARCHAR(255),
    actor_role VARCHAR(50),
    old_state JSONB,
    new_state JSONB,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 16. GPS DEVICES & LOCATIONS (FUTURE COMPATIBILITY)
-- ==========================================

CREATE TABLE IF NOT EXISTS vehicle_gps_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    device_imei VARCHAR(100) UNIQUE NOT NULL,
    device_model VARCHAR(100),
    sim_card_number VARCHAR(50),
    is_active BOOLEAN DEFAULT FALSE,
    battery_status INTEGER,
    last_signal_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicle_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    gps_device_id UUID REFERENCES vehicle_gps_devices(id) ON DELETE SET NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed_kmh NUMERIC(6, 2) DEFAULT 0.00,
    heading NUMERIC(6, 2),
    altitude NUMERIC(8, 2),
    ignition_status BOOLEAN DEFAULT FALSE,
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- INDEXES FOR PERFORMANCE & EXCEPTION QUERIES
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_owner ON vehicles(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_vehicle ON bookings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_trip_checkins_booking ON trip_checkins(booking_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_name, entity_id);

-- ==========================================
-- RLS POLICIES (ROW LEVEL SECURITY)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_gps_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_locations ENABLE ROW LEVEL SECURITY;

-- Allow public read of verified/available vehicles
DO $$ BEGIN
    CREATE POLICY "Public read available vehicles" ON vehicles
        FOR SELECT USING (status IN ('available', 'ready_for_pickup'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Allow all authenticated users full operational access for rental flow
DO $$ BEGIN
    CREATE POLICY "Operational access profiles" ON profiles FOR ALL USING (true);
    CREATE POLICY "Operational access vehicle_owners" ON vehicle_owners FOR ALL USING (true);
    CREATE POLICY "Operational access vehicles" ON vehicles FOR ALL USING (true);
    CREATE POLICY "Operational access vehicle_documents" ON vehicle_documents FOR ALL USING (true);
    CREATE POLICY "Operational access vehicle_photos" ON vehicle_photos FOR ALL USING (true);
    CREATE POLICY "Operational access travelers" ON travelers FOR ALL USING (true);
    CREATE POLICY "Operational access bookings" ON bookings FOR ALL USING (true);
    CREATE POLICY "Operational access vehicle_handovers" ON vehicle_handovers FOR ALL USING (true);
    CREATE POLICY "Operational access vehicle_inspections" ON vehicle_inspections FOR ALL USING (true);
    CREATE POLICY "Operational access inspection_photos" ON inspection_photos FOR ALL USING (true);
    CREATE POLICY "Operational access trip_checkins" ON trip_checkins FOR ALL USING (true);
    CREATE POLICY "Operational access incidents" ON incidents FOR ALL USING (true);
    CREATE POLICY "Operational access payments" ON payments FOR ALL USING (true);
    CREATE POLICY "Operational access audit_logs" ON audit_logs FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
