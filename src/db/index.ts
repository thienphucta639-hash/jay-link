import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn("⚠️ DATABASE_URL not set — database features disabled");
}

const globalForDb = globalThis as typeof globalThis & {
  __pgPool?: Pool;
};

function createPool() {
  if (!databaseUrl) return null;
  if (globalForDb.__pgPool) return globalForDb.__pgPool;

  const isLocal =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on("error", (err) => {
    console.error("Pool error:", err.message);
  });

  globalForDb.__pgPool = pool;
  return pool;
}

const pool = createPool();

export const db = pool
  ? drizzle(pool)
  : (null as unknown as ReturnType<typeof drizzle>);

export function isDbReady(): boolean {
  return pool !== null;
}
