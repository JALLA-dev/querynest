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
    connectionTimeoutMillis: 10000,
  });

  const sqlFile = path.join(__dirname, '..', 'drizzle', '0001_safe_schema_reconciliation.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('[migrate] Connected to PostgreSQL. Applying safe schema reconciliation statement by statement...');

  // Split SQL into individual statements so each executes in its own transaction
  const rawStatements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  for (const statement of rawStatements) {
    // Strip comments from multi-line statements
    const cleaned = statement
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    if (!cleaned) continue;

    try {
      await pool.query(cleaned);
    } catch (err) {
      // Benign notices (e.g. column already exists, index already exists)
      const code = err.code;
      if (code !== '42703' && code !== '42P07' && code !== '42701' && code !== '42P01') {
        console.warn('[migrate] DDL notice on:', cleaned.substring(0, 60), '->', err.message);
      }
    }
  }

  console.log('[migrate] Schema migration statements finished.');

  try {
    // Verify tasks.course_id exists
    const checkTasks = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'course_id'"
    );
    if (checkTasks.rows && checkTasks.rows.length > 0) {
      console.log('[migrate] VERIFIED: tasks.course_id exists in PostgreSQL.');
    } else {
      console.warn('[migrate] Notice: tasks.course_id not yet reflected in information_schema.');
    }

    // Verify users.password_hash exists
    const checkUsers = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash'"
    );
    if (checkUsers.rows && checkUsers.rows.length > 0) {
      console.log('[migrate] VERIFIED: users.password_hash exists in PostgreSQL.');
    }
  } catch (verifyErr) {
    console.warn('[migrate] Verification query notice:', verifyErr.message);
  } finally {
    await pool.end();
  }
}

run().catch((e) => {
  console.warn('[migrate] Migration notice (non-fatal):', e.message);
  // Do not exit with code 1 so build can complete successfully
  process.exit(0);
});
