import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

function makePool(): Pool {
  const isLocal = DB_URL.includes("localhost") || DB_URL.includes("127.0.0.1");
  return new Pool({
    connectionString: DB_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
}

export function getDb(): NodePgDatabase {
  if (_db) return _db;
  _pool = makePool();
  _db = drizzle(_pool);
  return _db;
}

// Reset connection if it fails, so next call creates a fresh pool
export function resetDb(): void {
  if (_pool) {
    _pool.end().catch(() => {});
  }
  _pool = null;
  _db = null;
}

// Execute with auto-retry: if first attempt fails with connection error, reset pool and retry once
export async function withRetry<T>(fn: (db: NodePgDatabase) => Promise<T>): Promise<T> {
  try {
    return await fn(getDb());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    const isConnErr =
      msg.includes("ECONNREFUSED") ||
      msg.includes("Connection terminated") ||
      msg.includes("connection timeout") ||
      msg.includes("Cannot read properties of null") ||
      msg.includes("Client has encountered a connection error");

    if (isConnErr) {
      // Reset and retry once
      resetDb();
      return await fn(getDb());
    }
    throw err;
  }
}
