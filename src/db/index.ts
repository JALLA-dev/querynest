import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __querynestPgPool?: Pool;
};

function createPool(): Pool {
  if (!connectionString) {
    // Allows Next.js build / typecheck to succeed even if DATABASE_URL is not yet set
    return new Pool({
      connectionString: undefined,
      max: 1,
    });
  }

  const isRenderOrRemote =
    connectionString.includes("render.com") ||
    connectionString.includes("sslmode=require") ||
    process.env.NODE_ENV === "production";

  return new Pool({
    connectionString,
    ssl: isRenderOrRemote ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

export const pool = globalForDb.__querynestPgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__querynestPgPool = pool;
}

export const db = drizzle(pool, { schema });
