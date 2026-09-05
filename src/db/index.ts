import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "querynest.db");

const globalForDb = globalThis as typeof globalThis & {
  __querynestSqlite?: InstanceType<typeof Database>;
};

export const sqlite =
  globalForDb.__querynestSqlite ??
  new Database(dbPath);

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

if (process.env.NODE_ENV !== "production") {
  globalForDb.__querynestSqlite = sqlite;
}

export const db = drizzle(sqlite, { schema });
