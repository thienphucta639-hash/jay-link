import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

const FALLBACK_URL = "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

export function getDb(): NodePgDatabase {
  if (_db) return _db;

  const url = process.env.DATABASE_URL || FALLBACK_URL;
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

  _pool = new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 5000,
  });

  _db = drizzle(_pool);
  return _db;
}

// Test connection before first use
export async function testConnection(): Promise<string> {
  try {
    const pool = _pool || new Pool({
      connectionString: process.env.DATABASE_URL || FALLBACK_URL,
      max: 1,
      connectionTimeoutMillis: 3000,
    });
    const client = await pool.connect();
    const res = await client.query("SELECT 1 as ok");
    client.release();
    return res.rows[0]?.ok === 1 ? "ok" : "unexpected";
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return `fail: ${msg}`;
  }
}
