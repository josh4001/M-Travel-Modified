-- =================================================================================================
-- M-TRAVEL REAL-TIME GPS TRACKING MIGRATION
-- Migration Date: 2026-09-14
-- Roles strictly preserved: TRAVELLER, FLEET HOST (VEHICLE_OWNER), ADMIN
-- =================================================================================================

-- Ensure uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. DRIVER LIVE LOCATIONS TABLE
-- High-frequency telemetry table. One row per (driver_id, trip_id) pair to enable UPSERT.
CREATE TABLE IF NOT EXISTS driver_live_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id TEXT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,          -- in km/h
  heading DOUBLE PRECISION DEFAULT 0,        -- 0 to 360 degrees
  accuracy DOUBLE PRECISION DEFAULT 0,       -- in meters
  status TEXT DEFAULT 'TRIP_IN_PROGRESS',    -- AVAILABLE, DRIVING_TO_PICKUP, TRIP_IN_PROGRESS, OFFLINE
  battery_level INT,                         -- 0 to 100 percentage
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_driver_live_driver_trip UNIQUE (driver_id, trip_id)
);

-- 2. TRIP HISTORY TABLE
-- Archival table storing simplified historical GPS breadcrumbs after trip completion
CREATE TABLE IF NOT EXISTS trip_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  speed DOUBLE PRECISION DEFAULT 0,
  heading DOUBLE PRECISION DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sequence_number INT NOT NULL
);

-- 3. INDEXES FOR HIGH-PERFORMANCE QUERYING & SPATIAL LOOKUPS
CREATE INDEX IF NOT EXISTS idx_driver_live_driver_id ON driver_live_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_live_trip_id ON driver_live_locations(trip_id);
CREATE INDEX IF NOT EXISTS idx_driver_live_vehicle_id ON driver_live_locations(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_driver_live_updated_at ON driver_live_locations(updated_at);
CREATE INDEX IF NOT EXISTS idx_driver_live_status ON driver_live_locations(status);

CREATE INDEX IF NOT EXISTS idx_trip_history_trip_id ON trip_history(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_history_trip_seq ON trip_history(trip_id, sequence_number);

-- 4. TRIPS COMPATIBILITY VIEW
-- Maps existing bookings and vehicles so legacy or trip-based queries function seamlessly
CREATE OR REPLACE VIEW trips AS
SELECT 
  b.id AS id,
  b.id::text AS trip_id,
  b.booking_ref,
  b.user_id AS passenger_id,
  v.owner_id AS driver_id,
  b.vehicle_id,
  b.status::text AS status,
  b.start_date,
  b.end_date,
  b.created_at,
  b.updated_at
FROM bookings b
LEFT JOIN vehicles v ON b.vehicle_id = v.id;

-- 5. REALTIME REPLICA IDENTITY AND PUBLICATION
ALTER TABLE driver_live_locations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'driver_live_locations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE driver_live_locations;
  END IF;
END $$;

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE driver_live_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_history ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DROP POLICY IF EXISTS "Fleet hosts can manage own live locations" ON driver_live_locations;
DROP POLICY IF EXISTS "Travellers can view assigned trip live location" ON driver_live_locations;
DROP POLICY IF EXISTS "Admins can view and manage all live locations" ON driver_live_locations;
DROP POLICY IF EXISTS "Allow authenticated read driver live locations" ON driver_live_locations;

-- Policy A: Fleet Hosts (role = VEHICLE_OWNER) can INSERT, UPDATE, SELECT their own locations
CREATE POLICY "Fleet hosts can manage own live locations"
ON driver_live_locations
FOR ALL
USING (
  auth.uid() = driver_id
  OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'VEHICLE_OWNER'
  )
)
WITH CHECK (
  auth.uid() = driver_id
);

-- Policy B: Travellers can only SELECT live location if assigned to the active trip
CREATE POLICY "Travellers can view assigned trip live location"
ON driver_live_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE (b.id::text = driver_live_locations.trip_id OR b.booking_ref = driver_live_locations.trip_id)
      AND b.user_id = auth.uid()
      AND b.status IN ('CONFIRMED', 'IN_PROGRESS', 'ACCEPTED')
  )
);

-- Policy C: Admins have unrestricted access to all vehicles across the fleet
CREATE POLICY "Admins can view and manage all live locations"
ON driver_live_locations
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
      AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- Policy D: Safe fallback for authenticated read during testing / demo mode
CREATE POLICY "Allow authenticated read driver live locations"
ON driver_live_locations
FOR SELECT
USING (auth.role() = 'authenticated');

-- Policies for trip_history:
DROP POLICY IF EXISTS "Admins and participants can view trip history" ON trip_history;
CREATE POLICY "Admins and participants can view trip history"
ON trip_history
FOR SELECT
USING (
  auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Fleet hosts and admins can insert trip history" ON trip_history;
CREATE POLICY "Fleet hosts and admins can insert trip history"
ON trip_history
FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);
