import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let _db: NodePgDatabase | null = null;

const FALLBACK_URL = "postgresql://postgres:postgres@127.0.0.1:5432/app_db";

export function getDb(): NodePgDatabase {
  if (_db) return _db;

  const url = process.env.DATABASE_URL || FALLBACK_URL;
  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

  const pool = new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
  });

  _db = drizzle(pool);
  return _db;
}
