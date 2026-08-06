import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

// Allow build without DATABASE_URL (for Vercel build step)
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")
        ? false
        : { rejectUnauthorized: false },
    })
  : null;

export const db = pool ? drizzle(pool) : (null as unknown as ReturnType<typeof drizzle>);

// Helper to check if DB is available
export const isDbAvailable = () => !!pool;
