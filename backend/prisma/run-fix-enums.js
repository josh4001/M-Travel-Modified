const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const sqlPath = path.join(__dirname, 'migrations', 'fix_enums.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlPath, { encoding: 'utf8' });

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Please set the DATABASE_URL environment variable (Postgres connection string).');
    process.exit(1);
  }

  // Allow self-signed certs for dev environments (some managed Postgres providers use them).
  // This sets rejectUnauthorized: false only when SSL is required in the connection string
  // to avoid breaking stricter production setups.
  const sslOptions = /sslmode\s*=\s*(require|verify-ca|verify-full)/i.test(connectionString)
    ? { rejectUnauthorized: false }
    : undefined;

  const client = new Client({ connectionString, ssl: sslOptions });
  try {
    await client.connect();
    console.log('Connected to database. Ensuring enum types exist and applying safe alters...');

    const createTypesSql = `DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM ('TOPUP','BOOKING_PAYOUT','WITHDRAWAL','COMMISSION','REFUND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "TransactionStatus" AS ENUM ('PENDING','COMPLETED','FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;`;

    await client.query(createTypesSql);

    // Apply a safe alter for transactions (drop defaults handled in fallback if needed)
    const alterSql = `DO $$ BEGIN
  ALTER TABLE transactions
    ALTER COLUMN type TYPE "TransactionType" USING type::text::"TransactionType",
    ALTER COLUMN status TYPE "TransactionStatus" USING status::text::"TransactionStatus";
EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END $$;`;

    await client.query(alterSql);

    console.log('Enum creation and transactional table alteration attempted.');
  } catch (err) {
    // Handle specific Postgres error where default values cannot be cast during ALTER COLUMN
    if (err && err.code === '42804') {
      console.warn('Detected column type cast error (42804). Attempting fallback: drop defaults then alter columns.');
      const fallback = `DO $$ BEGIN
  -- drop defaults so the ALTER TYPE can proceed
  ALTER TABLE transactions ALTER COLUMN status DROP DEFAULT;
  ALTER TABLE transactions ALTER COLUMN type DROP DEFAULT;
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN undefined_table THEN NULL; END $$;

-- now alter the column types using explicit text casts
ALTER TABLE transactions
  ALTER COLUMN type TYPE "TransactionType" USING type::text::"TransactionType",
  ALTER COLUMN status TYPE "TransactionStatus" USING status::text::"TransactionStatus";

-- restore sensible defaults
DO $$ BEGIN
  ALTER TABLE transactions ALTER COLUMN type SET DEFAULT 'TOPUP';
  ALTER TABLE transactions ALTER COLUMN status SET DEFAULT 'PENDING';
EXCEPTION WHEN undefined_column THEN NULL;
         WHEN undefined_table THEN NULL; END $$;`;
      try {
        await client.query(fallback);
        console.log('Fallback alter executed — enums applied to transactions.');
      } catch (err2) {
        console.error('Fallback also failed:', err2);
        process.exit(1);
      }
    } else {
      console.error('Error executing SQL:', err);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main();
