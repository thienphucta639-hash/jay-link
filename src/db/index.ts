import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Lazy pool — only created on first actual DB call
let _pool: Pool | null = null;
let _db: NodePgDatabase | null = null;

function getPool(): Pool {
  if (_pool) return _pool;

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const isLocal =
    url.includes("localhost") || url.includes("127.0.0.1");

  _pool = new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  _pool.on("error", (err) => {
    console.error("Unexpected PG pool error:", err.message);
  });

  return _pool;
}

// db getter — creates connection lazily on first use
export const db: NodePgDatabase = new Proxy({} as NodePgDatabase, {
  get(_target, prop) {
    if (!_db) {
      _db = drizzle(getPool());
    }
    return (_db as unknown as Record<string | symbol, unknown>)[prop];
  },
});
