const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log('[migrate] No DATABASE_URL found. Skipping build-time migration.');
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

  try {
    // 1. Apply all non-destructive DDL statements
    await pool.query(sql);
    console.log('[migrate] Schema migration applied successfully!');

    // 2. Verify critical columns exist
    const checkTasks = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'course_id'"
    );
    if (checkTasks.rows.length > 0) {
      console.log('[migrate] VERIFIED: tasks.course_id exists in PostgreSQL.');
    } else {
      console.warn('[migrate] WARNING: tasks.course_id check returned 0 rows.');
    }

    const checkUsers = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'"
    );
    if (checkUsers.rows.length > 0) {
      console.log('[migrate] VERIFIED: users.password_hash exists in PostgreSQL.');
    } else {
      console.warn('[migrate] WARNING: users.password_hash check returned 0 rows.');
    }
  } catch (err) {
    console.error('[migrate] Error applying migration:', err.message, err.code);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
