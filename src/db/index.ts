import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import dotenv from "dotenv";

// Force load .env — Next.js production sometimes misses it
dotenv.config();

let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

export function getDb(): NodePgDatabase {
  if (_db) return _db;

  // Try multiple sources for DATABASE_URL
  let url = process.env.DATABASE_URL;

  if (!url) {
    // Try loading .env again
    dotenv.config();
    url = process.env.DATABASE_URL;
  }

  if (!url) {
    throw new Error(
      "DATABASE_URL not found. Set it in .env or environment variables."
    );
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
