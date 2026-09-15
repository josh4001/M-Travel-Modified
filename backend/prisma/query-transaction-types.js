const { Client } = require('pg');
(async function(){
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) { console.error('DATABASE_URL not set'); process.exit(1); }
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT DISTINCT type FROM transactions;');
    console.log(res.rows.map(r=>r.type));
  } catch (err) {
    console.error('Query error:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
