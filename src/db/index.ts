import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool, PoolClient } from "pg";

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

export function getPool(): Pool {
  if (!_pool) _pool = makePool();
  return _pool;
}

export function getDb(): NodePgDatabase {
  if (_db) return _db;
  _db = drizzle(getPool());
  return _db;
}

export function resetDb(): void {
  _pool?.end().catch(() => {});
  _pool = null;
  _db = null;
}

// Raw query helper — bypasses Drizzle, gives raw pg errors
export async function rawQuery<T>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client?.release();
  }
}

export async function withRetry<T>(
  fn: (db: NodePgDatabase) => Promise<T>
): Promise<T> {
  try {
    return await fn(getDb());
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    const cause = err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
    const isConnErr =
      msg.includes("ECONNREFUSED") || cause.includes("ECONNREFUSED") ||
      msg.includes("Connection terminated") || cause.includes("Connection terminated") ||
      msg.includes("connection timeout") || cause.includes("connection timeout") ||
      msg.includes("Client has encountered") || cause.includes("Client has encountered");
    if (isConnErr) {
      resetDb();
      return await fn(getDb());
    }
    throw err;
  }
}

// Extract real error message from Drizzle wrapped errors
export function extractError(err: unknown): string {
  if (!(err instanceof Error)) return String(err);
  // Drizzle wraps the real error in .cause
  const cause = err.cause;
  if (cause instanceof Error) {
    const pgErr = cause as Error & { code?: string; detail?: string };
    let msg = pgErr.message;
    if (pgErr.code) msg = `[${pgErr.code}] ${msg}`;
    if (pgErr.detail) msg += ` (${pgErr.detail})`;
    return msg;
  }
  return err.message;
}
