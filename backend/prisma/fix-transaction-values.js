const { Client } = require('pg');
(async function(){
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { console.error('DATABASE_URL not set'); process.exit(1); }
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected — ensuring enum type exists...');
    await client.query(`DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM ('TOPUP','BOOKING_PAYOUT','WITHDRAWAL','COMMISSION','REFUND');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);

    // Make column text so we can update legacy values
    await client.query("ALTER TABLE transactions ALTER COLUMN type DROP DEFAULT;");
    await client.query("ALTER TABLE transactions ALTER COLUMN type TYPE text USING type::text;");

    // Map legacy values to new enum labels
    await client.query("UPDATE transactions SET type='TOPUP' WHERE type='MPESA_TOPUP';");

    // Convert to enum
    await client.query("ALTER TABLE transactions ALTER COLUMN type TYPE \"TransactionType\" USING type::text::\"TransactionType\";");
    await client.query("ALTER TABLE transactions ALTER COLUMN type SET DEFAULT 'TOPUP';");

    console.log('Transactions type column migrated to TransactionType enum.');
  } catch (err) {
    console.error('Error applying transaction value fixes:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
