import { NextResponse } from "next/server";
import { withRetry } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    return await withRetry(async (db) => {
      await db.execute(sql`SELECT 1`);
      return NextResponse.json({ status: "ok", database: "connected" });
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ status: "ok", database: `error: ${msg}` });
  }
}
