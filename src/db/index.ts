import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import fs from "fs";
import path from "path";

let _db: NodePgDatabase | null = null;

function loadDatabaseUrl(): string {
  // 1) Check process.env first
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // 2) Manually read .env file
  const envPaths = [
    path.resolve(process.cwd(), ".env"),
    path.resolve(__dirname, "../../.env"),
    path.resolve(__dirname, "../../../.env"),
    "/app/.env",
  ];

  for (const p of envPaths) {
    try {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, "utf-8");
        const match = content.match(
          /^DATABASE_URL\s*=\s*(.+)$/m
        );
        if (match) {
          const url = match[1].trim().replace(/^["']|["']$/g, "");
          // Also set it for future use
          process.env.DATABASE_URL = url;
          return url;
        }
      }
    } catch {
      // ignore
    }
  }

  throw new Error(
    "DATABASE_URL not found in env or .env file"
  );
}

export function getDb(): NodePgDatabase {
  if (_db) return _db;

  const url = loadDatabaseUrl();
  const isLocal =
    url.includes("localhost") || url.includes("127.0.0.1");

  const pool = new Pool({
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 10,
  });

  _db = drizzle(pool);
  return _db;
}
