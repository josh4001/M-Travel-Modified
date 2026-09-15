require('dotenv').config();
const { Client } = require('pg');

async function run() {
  let connectionString = process.env.DATABASE_URL || '';
  // Remove sslmode from query params so custom ssl config takes precedence
  connectionString = connectionString.replace(/[?&]sslmode=[^&]+/g, '');
  if (!connectionString.includes('?')) {
    connectionString = connectionString.replace('&', '?');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('✅ Connected to Supabase PostgreSQL successfully!');

  // 1. Add missing updated_at on payments
  await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();');
  console.log('✅ payments.updated_at verified/added');

  // 2. Check and fix any other missing columns across all Prisma models:
  // payments table
  await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();');
  await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_ref TEXT;');
  await client.query('ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT \'KES\';');

  // bookings table
  await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason TEXT;');
  await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qr_code TEXT;');
  await client.query('ALTER TABLE bookings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();');

  // reviews table
  await client.query('ALTER TABLE reviews ADD COLUMN IF NOT EXISTS booking_id UUID UNIQUE REFERENCES bookings(id) ON DELETE CASCADE;');

  // Check columns of payments table
  const pCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments'");
  console.log('Payments columns:', pCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  // Check columns of bookings table
  const bCols = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings'");
  console.log('Bookings columns:', bCols.rows.map(r => `${r.column_name} (${r.data_type})`));

  await client.end();
  console.log('🎉 Schema sync completed!');
}

run().catch(err => {
  console.error('Error during schema sync:', err);
  process.exit(1);
});
