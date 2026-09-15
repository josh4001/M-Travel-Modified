-- ============================================================
-- fix_enums.sql - Creates all Prisma enum types in PostgreSQL
-- ============================================================

-- 1. TransactionType
DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM (
    'TOPUP',
    'BOOKING_PAYOUT',
    'WITHDRAWAL',
    'COMMISSION',
    'REFUND'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TransactionStatus
DO $$ BEGIN
  CREATE TYPE "TransactionStatus" AS ENUM (
    'PENDING',
    'COMPLETED',
    'FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. PaymentProvider
DO $$ BEGIN
  CREATE TYPE "PaymentProvider" AS ENUM (
    'MPESA',
    'STRIPE',
    'PAYPAL',
    'WALLET'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. PaymentStatus
DO $$ BEGIN
  CREATE TYPE "PaymentStatus" AS ENUM (
    'PENDING',
    'SUCCEEDED',
    'FAILED',
    'REFUNDED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. BookingStatus
DO $$ BEGIN
  CREATE TYPE "BookingStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. BookableType
DO $$ BEGIN
  CREATE TYPE "BookableType" AS ENUM (
    'VEHICLE',
    'BUS_SEAT',
    'TOUR',
    'HOLIDAY_HOME'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7. SupportTicketStatus
DO $$ BEGIN
  CREATE TYPE "SupportTicketStatus" AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. NotificationChannel
DO $$ BEGIN
  CREATE TYPE "NotificationChannel" AS ENUM (
    'PUSH',
    'SMS',
    'EMAIL',
    'IN_APP'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. Role (maps to Prisma enum Role)
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM (
    'TRAVELER',
    'TOURIST',
    'VEHICLE_OWNER',
    'BUS_COMPANY',
    'TOUR_OPERATOR',
    'HOME_OWNER',
    'ADMIN',
    'SUPER_ADMIN'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. VehicleType
DO $$ BEGIN
  CREATE TYPE "VehicleType" AS ENUM (
    'CAR',
    'SUV',
    'VAN',
    'PICKUP'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 11. FuelType
DO $$ BEGIN
  CREATE TYPE "FuelType" AS ENUM (
    'PETROL',
    'DIESEL',
    'ELECTRIC',
    'HYBRID'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 12. TransmissionType
DO $$ BEGIN
  CREATE TYPE "TransmissionType" AS ENUM (
    'MANUAL',
    'AUTOMATIC'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Alter transactions table to use proper enum types
-- ============================================================
ALTER TABLE transactions
  ALTER COLUMN type TYPE "TransactionType" USING type::"TransactionType",
  ALTER COLUMN status TYPE "TransactionStatus" USING status::"TransactionStatus";

-- ============================================================
-- Alter payments table to use proper enum types
-- ============================================================
ALTER TABLE payments
  ALTER COLUMN provider TYPE "PaymentProvider" USING provider::"PaymentProvider",
  ALTER COLUMN status TYPE "PaymentStatus" USING status::"PaymentStatus";

-- ============================================================
-- Alter bookings table to use proper enum types
-- ============================================================
ALTER TABLE bookings
  ALTER COLUMN status TYPE "BookingStatus" USING status::"BookingStatus",
  ALTER COLUMN bookable_type TYPE "BookableType" USING bookable_type::"BookableType";

-- ============================================================
-- Alter support_tickets table to use proper enum types
-- ============================================================
ALTER TABLE support_tickets
  ALTER COLUMN status TYPE "SupportTicketStatus" USING status::"SupportTicketStatus";

-- ============================================================
-- Alter notifications table to use proper enum types (if exists)
-- ============================================================
DO $$ BEGIN
  ALTER TABLE notifications
    ALTER COLUMN channel TYPE "NotificationChannel" USING channel::"NotificationChannel";
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN undefined_table  THEN NULL; END $$;
