const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('[migrate] No DATABASE_URL found. Skipping migration.');
  process.exit(0);
}

async function run() {
  const isRenderOrRemote =
    connectionString.includes('render.com') ||
    connectionString.includes('sslmode=require') ||
    process.env.NODE_ENV === 'production';

  const pool = new Pool({
    connectionString,
    ssl: isRenderOrRemote ? { rejectUnauthorized: false } : undefined,
    max: 1,
    connectionTimeoutMillis: 15000,
  });

  const sqlFile = path.join(__dirname, '..', 'drizzle', '0001_safe_schema_reconciliation.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('[migrate] Connected to PostgreSQL. Applying safe schema reconciliation...');

  // Execute using simple query protocol
  try {
    await pool.query(sql);
    console.log('[migrate] Schema migration applied successfully!');
  } catch (err) {
    console.error('[migrate] Error applying migration:', err.message, err.code);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
