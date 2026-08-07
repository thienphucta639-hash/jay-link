import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

// Fresh pool every time — no caching that goes stale
function freshPool(): Pool {
  const isLocal = DB_URL.includes("localhost") || DB_URL.includes("127.0.0.1");
  return new Pool({
    connectionString: DB_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });
}

let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

function pool(): Pool {
  if (!_pool || (_pool as Pool & { ending?: boolean }).ending) {
    _pool = freshPool();
  }
  return _pool;
}

export function getDb(): NodePgDatabase {
  if (!_db) _db = drizzle(pool());
  return _db;
}

export function resetDb(): void {
  try { _pool?.end(); } catch {}
  _pool = null;
  _db = null;
}

// Raw query with fresh connection — most reliable
export async function rawQuery<T>(text: string, params?: unknown[]): Promise<T[]> {
  const p = pool();
  const client = await p.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function withRetry<T>(fn: (db: NodePgDatabase) => Promise<T>): Promise<T> {
  try {
    return await fn(getDb());
  } catch (err: unknown) {
    const full = String(err);
    if (full.includes("ECONNREFUSED") || full.includes("terminated") || full.includes("timeout") || full.includes("Cannot read")) {
      resetDb();
      return await fn(getDb());
    }
    throw err;
  }
}

export function extractError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  const cause = err.cause;
  if (cause instanceof Error) {
    const pg = cause as Error & { code?: string; detail?: string };
    let m = pg.message;
    if (pg.code) m = `[${pg.code}] ${m}`;
    if (pg.detail) m += ` (${pg.detail})`;
    return m;
  }
  return err.message;
}
