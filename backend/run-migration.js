/**
 * run-migration.js
 * Runs fix_enums SQL against Supabase using the REST API (rpc / pg_meta).
 * Usage: node run-migration.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// The SQL to run — broken into individual atomic statements
// so we can catch each error separately
const statements = [
  // 1. Create enum types (idempotent via DO blocks)
  `DO $$ BEGIN CREATE TYPE "TransactionType" AS ENUM ('TOPUP','BOOKING_PAYOUT','WITHDRAWAL','COMMISSION','REFUND'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "TransactionStatus" AS ENUM ('PENDING','COMPLETED','FAILED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "PaymentProvider" AS ENUM ('MPESA','STRIPE','PAYPAL','WALLET'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "PaymentStatus" AS ENUM ('PENDING','SUCCEEDED','FAILED','REFUNDED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "BookingStatus" AS ENUM ('PENDING','ACCEPTED','REJECTED','CONFIRMED','IN_PROGRESS','COMPLETED','CANCELLED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "BookableType" AS ENUM ('VEHICLE','BUS_SEAT','TOUR','HOLIDAY_HOME'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "SupportTicketStatus" AS ENUM ('OPEN','IN_PROGRESS','RESOLVED','CLOSED'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "NotificationChannel" AS ENUM ('PUSH','SMS','EMAIL','IN_APP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "Role" AS ENUM ('TRAVELER','TOURIST','VEHICLE_OWNER','BUS_COMPANY','TOUR_OPERATOR','HOME_OWNER','ADMIN','SUPER_ADMIN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "VehicleType" AS ENUM ('CAR','SUV','VAN','PICKUP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "FuelType" AS ENUM ('PETROL','DIESEL','ELECTRIC','HYBRID'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "TransmissionType" AS ENUM ('MANUAL','AUTOMATIC'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  // 2. Alter transactions table columns
  `DO $$ BEGIN ALTER TABLE transactions ALTER COLUMN type TYPE "TransactionType" USING type::"TransactionType"; EXCEPTION WHEN others THEN RAISE NOTICE 'transactions.type: %', SQLERRM; END $$`,
  `DO $$ BEGIN ALTER TABLE transactions ALTER COLUMN status TYPE "TransactionStatus" USING status::"TransactionStatus"; EXCEPTION WHEN others THEN RAISE NOTICE 'transactions.status: %', SQLERRM; END $$`,

  // 3. Alter payments table columns
  `DO $$ BEGIN ALTER TABLE payments ALTER COLUMN provider TYPE "PaymentProvider" USING provider::"PaymentProvider"; EXCEPTION WHEN others THEN RAISE NOTICE 'payments.provider: %', SQLERRM; END $$`,
  `DO $$ BEGIN ALTER TABLE payments ALTER COLUMN status TYPE "PaymentStatus" USING status::"PaymentStatus"; EXCEPTION WHEN others THEN RAISE NOTICE 'payments.status: %', SQLERRM; END $$`,

  // 4. Alter bookings table columns
  `DO $$ BEGIN ALTER TABLE bookings ALTER COLUMN status TYPE "BookingStatus" USING status::"BookingStatus"; EXCEPTION WHEN others THEN RAISE NOTICE 'bookings.status: %', SQLERRM; END $$`,
  `DO $$ BEGIN ALTER TABLE bookings ALTER COLUMN bookable_type TYPE "BookableType" USING bookable_type::"BookableType"; EXCEPTION WHEN others THEN RAISE NOTICE 'bookings.bookable_type: %', SQLERRM; END $$`,

  // 5. Alter support_tickets status
  `DO $$ BEGIN ALTER TABLE support_tickets ALTER COLUMN status TYPE "SupportTicketStatus" USING status::"SupportTicketStatus"; EXCEPTION WHEN others THEN RAISE NOTICE 'support_tickets.status: %', SQLERRM; END $$`,
];

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`);
    
    // Use Supabase pg_meta endpoint instead
    const pgMetaUrl = new URL(`${SUPABASE_URL.replace('https://', 'https://')}`);
    
    // Use PostgREST rpc with a wrapper function - fallback to direct approach
    // Actually use the pg_dump-compatible approach via supabase-js raw query
    const options = {
      hostname: pgMetaUrl.hostname,
      path: `/rest/v1/rpc/run_sql`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Better approach: use Supabase Management API or pg connection
// Since we have the DATABASE_URL, use the pg module directly
const { Client } = require('pg');

async function main() {
  // Build direct connection URL (port 5432, not pooler 6543)
  const dbUrl = process.env.DATABASE_URL
    .replace(':6543/', ':5432/')
    .replace('pgbouncer=true&', '')
    .replace('&pgbouncer=true', '')
    .replace('connection_limit=1&', '')
    .replace('&connection_limit=1', '');

  console.log('Connecting to Supabase (direct session mode)...');
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  
  await client.connect();
  console.log('Connected!\n');

  let allOk = true;
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    const label = sql.substring(0, 80).replace(/\s+/g, ' ');
    process.stdout.write(`[${i + 1}/${statements.length}] ${label}... `);
    try {
      await client.query(sql);
      console.log('OK');
    } catch (err) {
      console.log(`WARN: ${err.message}`);
      allOk = false;
    }
  }

  await client.end();
  console.log('\n' + (allOk ? '✅ All statements executed successfully!' : '⚠️  Some statements had warnings (see above).'));
  console.log('Migration complete — restart backend and retry wallet top-up.');
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
