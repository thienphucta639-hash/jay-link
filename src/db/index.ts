import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

export function getDb(): NodePgDatabase {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set in environment");
  }

  const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

  _pool = new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
  });

  _db = drizzle(_pool);
  return _db;
}
